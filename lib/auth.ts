import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

//Throw nếu JWT_SECRET không được cấu hình (bảo mật)
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("WARNING: JWT_SECRET or NEXTAUTH_SECRET environment variable is missing in production!");
}
const SECRET = JWT_SECRET || "edulearn-dev-secret-DO-NOT-USE-IN-PROD";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
}

export function signToken(user: AuthUser): string {
    return jwt.sign(user, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser | null {
    try {
        return jwt.verify(token, SECRET) as AuthUser;
    } catch {
        return null;
    }
}

export async function getAuthUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return verifyToken(token);
}

/**

 * Dùng trong API route để yêu cầu đăng nhập.
 * Trả về user hoặc null (caller tự quyết định reject hay không).
 */
export async function requireAuth(): Promise<AuthUser | null> {
    return getAuthUser();
}

/**

 * Kiểm tra user có phải ADMIN không.
 */
export async function requireAdmin(): Promise<AuthUser | null> {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") return null;
    return user;
}

