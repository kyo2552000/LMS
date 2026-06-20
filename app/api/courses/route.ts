
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { validateInput, GetCoursesQuerySchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

       
        const rawParams = {
            category:  searchParams.get("category")  ?? undefined,
            search:    searchParams.get("search")    ?? undefined,
            level:     searchParams.get("level")     ?? undefined,
            type:      searchParams.get("type")      ?? undefined,
            sort:      searchParams.get("sort")      ?? "newest",
            minRating: searchParams.get("minRating") ?? undefined,
            page:      searchParams.get("page")      ?? "1",
            limit:     searchParams.get("limit")     ?? "12",
        };

        const validation = validateInput(GetCoursesQuerySchema, rawParams);
        if (!validation.success) return validation.response;
        const { category, search, level, type, sort, minRating, page, limit } = validation.data;

        const offset = (page - 1) * limit;

        // ② Build SQL query (string interpolation an toàn với prepared statements)
        let query = `
            SELECT
                c.*,
                cat.name  AS category_name,
                cat.icon  AS category_icon,
                cat.color AS category_color,
                u.name    AS instructor_name,
                u.avatar  AS instructor_avatar
            FROM courses c
            JOIN categories cat ON c.category_id = cat.id
            JOIN users u        ON c.instructor_id = u.id
            WHERE c.published = TRUE
        `;
        let countQuery = `
            SELECT COUNT(*) AS total
            FROM courses c
            JOIN categories cat ON c.category_id = cat.id
            WHERE c.published = TRUE
        `;

        const params: (string | number)[] = [];
        const countParams: (string | number)[] = [];

        if (category) {
            query      += ` AND cat.name = ?`;
            countQuery += ` AND cat.name = ?`;
            params.push(category);
            countParams.push(category);
        }
        if (level) {
            query      += ` AND c.level = ?`;
            countQuery += ` AND c.level = ?`;
            params.push(level);
            countParams.push(level);
        }
        if (type) {
            query      += ` AND c.type = ?`;
            countQuery += ` AND c.type = ?`;
            params.push(type);
            countParams.push(type);
        }
        if (minRating && minRating > 0) {
            query      += ` AND c.rating >= ?`;
            countQuery += ` AND c.rating >= ?`;
            params.push(minRating);
            countParams.push(minRating);
        }
        if (search) {
            query      += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
            countQuery += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
            const keyword = `%${search}%`;
            params.push(keyword, keyword);
            countParams.push(keyword, keyword);
        }

        // Sort
        switch (sort) {
            case "popular":    query += ` ORDER BY c.students DESC`;  break;
            case "rating":     query += ` ORDER BY c.rating DESC`;    break;
            case "price_asc":  query += ` ORDER BY c.price ASC`;      break;
            case "price_desc": query += ` ORDER BY c.price DESC`;     break;
            default:           query += ` ORDER BY c.created_at DESC`; break;
        }

        query += ` LIMIT ${limit} OFFSET ${offset}`;

        
        const [coursesResult, countResult] = await Promise.all([
            db.execute<RowDataPacket[]>(query, params),
            db.execute<RowDataPacket[]>(countQuery, countParams),
        ]);

        const courses = coursesResult[0];
        const total   = (countResult[0][0] as RowDataPacket)?.total ?? 0;

     
        if (courses.length > 0) {
            const courseIds = courses.map((c) => c.id);
            const placeholders = courseIds.map(() => "?").join(",");

            const [allLessons] = await db.execute<RowDataPacket[]>(
                `SELECT id, title, duration, type, sort_order, course_id
                 FROM lessons
                 WHERE course_id IN (${placeholders})
                 ORDER BY sort_order ASC`,
                courseIds
            );

            // Group lessons by course_id (O(n) thay vì O(n * m))
            const lessonsByCourse = new Map<string, RowDataPacket[]>();
            for (const lesson of allLessons) {
                if (!lessonsByCourse.has(lesson.course_id)) {
                    lessonsByCourse.set(lesson.course_id, []);
                }
                lessonsByCourse.get(lesson.course_id)!.push(lesson);
            }

            // Gán lessons vào từng course
            for (const course of courses) {
                course.lessons = lessonsByCourse.get(course.id) ?? [];
            }
        }

        return NextResponse.json({
            courses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
        });

    } catch (error) {
        return handleApiError(error);
    }
}
