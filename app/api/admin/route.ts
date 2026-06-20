
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireAdmin } from "@/lib/auth";
import {
    handleApiError,
    AuthorizationError,
    ErrorCodes,
} from "@/lib/api-error";

// ─── GET: Admin Dashboard Stats ───────────────────────────────────────────────

export async function GET() {
    try {
        const admin = await requireAdmin();
        if (!admin) throw new AuthorizationError("Chỉ Admin mới có quyền truy cập", ErrorCodes.INSUFFICIENT_PERMISSIONS);

        
        const [
            tablesResult,
            revenueResult,
            recentOrdersResult,
            recentEnrollmentsResult,
            topFavoritesResult,
            chartRevenueResult,
            chartEnrollsResult,
            courseRevenueResult,
        ] = await Promise.allSettled([
            // 1. Tất cả table counts trong 1 query
            db.execute<RowDataPacket[]>(`
                SELECT
                    (SELECT COUNT(*) FROM users)         AS users,
                    (SELECT COUNT(*) FROM courses)       AS courses,
                    (SELECT COUNT(*) FROM categories)    AS categories,
                    (SELECT COUNT(*) FROM lessons)       AS lessons,
                    (SELECT COUNT(*) FROM enrollments)   AS enrollments,
                    (SELECT COUNT(*) FROM reviews)       AS reviews,
                    (SELECT COUNT(*) FROM orders)        AS orders,
                    (SELECT COUNT(*) FROM chat_messages) AS chat_messages,
                    (SELECT COUNT(*) FROM lesson_progress) AS lesson_progress
            `),
            // 2. Revenue (total + tháng hiện tại) — dùng COALESCE(paid_at,created_at) vì đơn PAID cũ có thể chưa có paid_at
            db.execute<RowDataPacket[]>(`
                SELECT
                    COALESCE(SUM(amount), 0) AS totalRevenue,
                    COALESCE(SUM(CASE WHEN MONTH(COALESCE(paid_at, created_at)) = MONTH(CURRENT_DATE())
                                         AND YEAR(COALESCE(paid_at, created_at)) = YEAR(CURRENT_DATE())
                                    THEN amount ELSE 0 END), 0) AS monthRevenue
                FROM orders WHERE status = 'PAID'
            `),
            // 3. Recent orders
            db.execute<RowDataPacket[]>(`
                SELECT o.id, o.amount, o.status, o.created_at,
                       u.name as user_name, c.title as course_title
                FROM orders o
                JOIN users u   ON o.user_id   = u.id
                JOIN courses c ON o.course_id  = c.id
                ORDER BY o.created_at DESC LIMIT 5
            `),
            // 4. Recent enrollments
            db.execute<RowDataPacket[]>(`
                SELECT e.id, e.enrolled_at, e.status, e.progress,
                       u.name as user_name, c.title as course_title
                FROM enrollments e
                JOIN users u   ON e.user_id   = u.id
                JOIN courses c ON e.course_id  = c.id
                ORDER BY e.enrolled_at DESC LIMIT 5
            `),
            // 5. Top favorited courses
            db.execute<RowDataPacket[]>(`
                SELECT c.id, c.title, c.image, c.price, c.rating,
                       COUNT(f.id) AS favorite_count
                FROM favorites f
                JOIN courses c ON f.course_id = c.id
                GROUP BY c.id
                ORDER BY favorite_count DESC LIMIT 5
            `),
            // 6. Revenue chart (30 ngày gần nhất) — mốc thời gian: ngà thanh toán hoặc ngà tạo đơn (legacy)
            db.execute<RowDataPacket[]>(`
                SELECT
                    DATE_FORMAT(day_bucket, '%d/%m') AS date,
                    DATE_FORMAT(day_bucket, '%Y-%m-%d') AS sort_day,
                    SUM(amount) AS total
                FROM (
                    SELECT amount, DATE(COALESCE(paid_at, created_at)) AS day_bucket
                    FROM orders
                    WHERE status = 'PAID'
                      AND COALESCE(paid_at, created_at) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
                ) t
                GROUP BY day_bucket
                ORDER BY day_bucket ASC
            `),
            // 7. Enrollment chart (30 ngày gần nhất)
            db.execute<RowDataPacket[]>(`
                SELECT
                    DATE_FORMAT(day_bucket, '%d/%m') AS date,
                    DATE_FORMAT(day_bucket, '%Y-%m-%d') AS sort_day,
                    COUNT(*) AS students
                FROM (
                    SELECT DATE(enrolled_at) AS day_bucket
                    FROM enrollments
                    WHERE enrolled_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
                ) e
                GROUP BY day_bucket
                ORDER BY day_bucket ASC
            `),
            // 8. Revenue by course (top 5)
            db.execute<RowDataPacket[]>(`
                SELECT c.title AS name, SUM(o.amount) AS total
                FROM orders o
                JOIN courses c ON o.course_id = c.id
                WHERE o.status = 'PAID'
                GROUP BY c.id
                ORDER BY total DESC LIMIT 5
            `),
        ]);

        // ─── Extract results (với fallback nếu query thất bại) ──────────────
        const tableRow = tablesResult.status === "fulfilled" ? tablesResult.value[0][0] : {};
        const tables = [
            "users", "courses", "categories", "lessons",
            "enrollments", "reviews", "orders", "chat_messages", "lesson_progress"
        ].map(name => ({
            name,
            rows: (tableRow as RowDataPacket)?.[name] ?? 0,
        }));

        const revRow      = revenueResult.status === "fulfilled" ? revenueResult.value[0][0] : { totalRevenue: 0, monthRevenue: 0 };
        const recentOrders      = recentOrdersResult.status === "fulfilled"      ? recentOrdersResult.value[0]      : [];
        const recentEnrollments = recentEnrollmentsResult.status === "fulfilled" ? recentEnrollmentsResult.value[0] : [];
        const topFavorites      = topFavoritesResult.status === "fulfilled"      ? topFavoritesResult.value[0]      : [];
        const courseRevenue     = courseRevenueResult.status === "fulfilled"     ? courseRevenueResult.value[0]     : [];

        // Merge revenue + enrollment chart by date
        const chartRevRows    = chartRevenueResult.status === "fulfilled" ? chartRevenueResult.value[0] : [];
        const chartEnrollRows = chartEnrollsResult.status === "fulfilled" ? chartEnrollsResult.value[0] : [];
        type ChartPt = { date: string; sort_day: string; total: number; students: number };
        const chartMap = new Map<string, ChartPt>();
        for (const r of chartRevRows as RowDataPacket[]) {
            const key = String(r.sort_day || r.date);
            chartMap.set(key, {
                date: String(r.date),
                sort_day: key,
                total: Number(r.total),
                students: 0,
            });
        }
        for (const r of chartEnrollRows as RowDataPacket[]) {
            const key = String(r.sort_day || r.date);
            const cur = chartMap.get(key);
            const st = Number(r.students);
            if (cur) {
                cur.students = st;
            } else {
                chartMap.set(key, {
                    date: String(r.date),
                    sort_day: key,
                    total: 0,
                    students: st,
                });
            }
        }
        const revenueChartData = Array.from(chartMap.values())
            .sort((a, b) => a.sort_day.localeCompare(b.sort_day))
            .map(({ date, total, students }) => ({ date, total, students }));

        // Total favorites
        const [favRows] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM favorites").catch(() => [[{ cnt: 0 }]]);
        const favCountResult = (favRows as RowDataPacket[])[0] as { cnt: number };

        return NextResponse.json({
            tables,
            totalRevenue:    Number(revRow.totalRevenue ?? 0),
            monthRevenue:    Number(revRow.monthRevenue ?? 0),
            recentOrders,
            recentEnrollments,
            revenueChartData,
            courseRevenue,
            topFavorites,
            totalFavorites:  Number(favCountResult.cnt ?? 0),
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─── POST: Execute raw SQL (admin debug tool) ─────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const admin = await requireAdmin();
        if (!admin) throw new AuthorizationError("Chỉ Admin mới có quyền thực thi SQL", ErrorCodes.INSUFFICIENT_PERMISSIONS);

        const { query } = await request.json().catch(() => ({ query: null }));
        if (!query || typeof query !== "string") {
            return NextResponse.json({ error: "SQL query là bắt buộc" }, { status: 400 });
        }

        const [result] = await db.query(query);

        if (Array.isArray(result)) {
            return NextResponse.json({ rows: result, type: "select" });
        } else {
            const info = result as { affectedRows?: number; insertId?: number };
            return NextResponse.json({ affectedRows: info.affectedRows, insertId: info.insertId, type: "mutation" });
        }
    } catch (error: unknown) {
        const err = error as { sqlMessage?: string; message?: string };
        return NextResponse.json(
            { error: err.sqlMessage || err.message || "Query thất bại" },
            { status: 400 }
        );
    }
}
