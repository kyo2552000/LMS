import { NextRequest, NextResponse } from "next/server";

// Step 1: Redirect user to Google OAuth consent screen
export async function GET(request: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return NextResponse.json({ error: "Google OAuth not configured. Please add GOOGLE_CLIENT_ID to .env" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get("redirect") || "/dashboard";

    const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const callbackUrl = `${baseUrl}/api/auth/google/callback`;

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "select_account",
        state: redirectTo, // pass redirect destination through state param
    });

    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
