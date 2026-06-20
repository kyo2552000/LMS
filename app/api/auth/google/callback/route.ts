import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { signToken } from "@/lib/auth";
import crypto from "crypto";

// Step 2: Google redirects back here with an authorization code
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state") || "/dashboard"; // redirect destination
    const error = searchParams.get("error");

    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("x-forwarded-host") || request.nextUrl.host;
    const baseUrl = process.env.NEXTAUTH_URL || `${proto}://${host}`;
    const callbackUrl = `${baseUrl}/api/auth/google/callback`;

    if (error || !code) {
        return NextResponse.redirect(`${baseUrl}/login?error=google_cancelled`);
    }

    try {
        // Exchange code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: callbackUrl,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenRes.ok) {
            console.error("Google token exchange error:", await tokenRes.text());
            return NextResponse.redirect(`${baseUrl}/login?error=google_token`);
        }

        const tokens = await tokenRes.json();

        // Fetch user info from Google
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoRes.ok) {
            return NextResponse.redirect(`${baseUrl}/login?error=google_userinfo`);
        }

        const googleUser = await userInfoRes.json();
        const { email, name, picture, sub: googleId } = googleUser;

        if (!email) {
            return NextResponse.redirect(`${baseUrl}/login?error=no_email`);
        }

        // Find or create user in DB
        const [existing] = await db.execute<RowDataPacket[]>(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        let user = existing[0];

        if (!user) {
            // Auto-register via Google
            const newId = crypto.randomUUID();
            await db.execute<ResultSetHeader>(
                `INSERT INTO users (id, name, email, password, role, avatar, google_id)
                 VALUES (?, ?, ?, '', 'STUDENT', ?, ?)
                 ON DUPLICATE KEY UPDATE google_id = VALUES(google_id), avatar = VALUES(avatar)`,
                [newId, name, email, picture || null, googleId]
            );
            const [newUser] = await db.execute<RowDataPacket[]>(
                "SELECT * FROM users WHERE email = ?",
                [email]
            );
            user = newUser[0];
        } else if (!user.google_id) {
            // Link Google account to existing email
            await db.execute(
                "UPDATE users SET google_id = ?, avatar = COALESCE(avatar, ?) WHERE email = ?",
                [googleId, picture || null, email]
            );
        }

        // Create JWT exactly like normal login
        const token = signToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar || picture,
        });

        // Determine safe redirect (avoid open redirect)
        const safePaths = ["/dashboard", "/courses", "/profile", "/admin"];
        const redirectTo = safePaths.some(p => state.startsWith(p)) ? state : "/dashboard";

        const response = NextResponse.redirect(`${baseUrl}${redirectTo}`);
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: "/",
        });

        return response;
    } catch (err) {
        console.error("Google OAuth callback error:", err);
        return NextResponse.redirect(`${baseUrl}/login?error=server`);
    }
}
