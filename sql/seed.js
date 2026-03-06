/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function seed() {
    const connection = await mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "123456",
        database: "edulearn",
        multipleStatements: true,
    });

    console.log("🌱 Connected to MySQL. Seeding database...\n");

    // Clean tables
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
    await connection.execute("TRUNCATE TABLE chat_messages");
    await connection.execute("TRUNCATE TABLE lesson_progress");
    await connection.execute("TRUNCATE TABLE reviews");
    await connection.execute("TRUNCATE TABLE enrollments");
    await connection.execute("TRUNCATE TABLE lessons");
    await connection.execute("TRUNCATE TABLE courses");
    await connection.execute("TRUNCATE TABLE categories");
    await connection.execute("TRUNCATE TABLE users");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.log("🧹 Cleaned existing data");

    // Insert Categories
    const categoryIds = [];
    const categoriesData = [
        ["Web Development", "💻", "bg-blue-500"],
        ["Data Science", "📊", "bg-purple-500"],
        ["Design", "🎨", "bg-pink-500"],
        ["Business", "💼", "bg-green-500"],
        ["Marketing", "📢", "bg-orange-500"],
        ["Photography", "📸", "bg-red-500"],
    ];

    for (const [name, icon, color] of categoriesData) {
        const id = crypto.randomUUID();
        await connection.execute(
            "INSERT INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)",
            [id, name, icon, color]
        );
        categoryIds.push(id);
    }
    console.log(`✅ Created ${categoriesData.length} categories`);

    // Insert Instructors
    const instructorIds = [];
    const instructorsData = [
        ["sarah.johnson@edulearn.com", "Sarah Johnson", "INSTRUCTOR", "Full-stack developer with 10+ years of experience.", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"],
        ["michael.chen@edulearn.com", "Dr. Michael Chen", "INSTRUCTOR", "PhD in Computer Science, specializing in ML and AI.", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"],
        ["emma.davis@edulearn.com", "Emma Davis", "INSTRUCTOR", "Lead UX designer. Passionate about user experiences.", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"],
        ["robert.williams@edulearn.com", "Robert Williams", "INSTRUCTOR", "MBA, serial entrepreneur and business consultant.", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"],
        ["lisa.anderson@edulearn.com", "Lisa Anderson", "INSTRUCTOR", "Digital marketing expert at major tech companies.", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200"],
        ["james.wilson@edulearn.com", "James Wilson", "INSTRUCTOR", "Professional photographer published in National Geographic.", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200"],
    ];

    for (const [email, name, role, bio, avatar] of instructorsData) {
        const id = crypto.randomUUID();
        const hashedPw = await bcrypt.hash("instructor123", 10);
        await connection.execute(
            "INSERT INTO users (id, email, name, password, role, bio, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id, email, name, hashedPw, role, bio, avatar]
        );
        instructorIds.push(id);
    }
    console.log(`✅ Created ${instructorsData.length} instructors`);

    // Insert sample student
    const studentId = crypto.randomUUID();
    const studentPw = await bcrypt.hash("student123", 10);
    await connection.execute(
        "INSERT INTO users (id, email, name, password, role, bio) VALUES (?, ?, ?, ?, ?, ?)",
        [studentId, "student@edulearn.com", "John Doe", studentPw, "STUDENT", "Aspiring web developer."]
    );
    console.log("✅ Created sample student");

    // Insert admin user
    const adminPw = await bcrypt.hash("admin123", 10);
    await connection.execute(
        "INSERT INTO users (id, email, name, password, role, bio) VALUES (?, ?, ?, ?, ?, ?)",
        [crypto.randomUUID(), "admin@edulearn.com", "Admin", adminPw, "ADMIN", "System administrator."]
    );
    console.log("✅ Created admin user");

    // Insert Courses + Lessons
    const coursesData = [
        {
            title: "Complete Web Development Bootcamp",
            description: "Master modern web development with React, Node.js, and MongoDB. Build real-world projects and land your dream job.",
            price: 89, image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
            rating: 4.8, students: 12500, catIdx: 0, instIdx: 0,
            lessons: [
                ["Introduction to Web Development", "15:30", "VIDEO"],
                ["HTML Fundamentals", "45:20", "VIDEO"],
                ["CSS Styling", "60:15", "VIDEO"],
                ["JavaScript Basics", "90:00", "VIDEO"],
                ["React Fundamentals", "120:00", "VIDEO"],
                ["Quiz: Web Basics", "30:00", "QUIZ"],
            ],
        },
        {
            title: "Data Science & Machine Learning",
            description: "Learn data science from scratch. Work with Python, pandas, scikit-learn, and TensorFlow to build ML models.",
            price: 129, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
            rating: 4.9, students: 8900, catIdx: 1, instIdx: 1,
            lessons: [
                ["Introduction to Data Science", "20:00", "VIDEO"],
                ["Python for Data Analysis", "75:30", "VIDEO"],
                ["Data Visualization", "65:45", "VIDEO"],
                ["Machine Learning Basics", "110:20", "VIDEO"],
                ["Project: Predictive Model", "180:00", "ASSIGNMENT"],
            ],
        },
        {
            title: "UI/UX Design Masterclass",
            description: "Create stunning user interfaces and exceptional user experiences. Master Figma, design systems, and prototyping.",
            price: 79, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
            rating: 4.7, students: 6700, catIdx: 2, instIdx: 2,
            lessons: [
                ["Design Principles", "30:00", "VIDEO"],
                ["Figma Basics", "45:00", "VIDEO"],
                ["Creating Design Systems", "90:00", "VIDEO"],
                ["Prototyping & Interactions", "60:00", "VIDEO"],
                ["Portfolio Project", "150:00", "ASSIGNMENT"],
            ],
        },
        {
            title: "Business Strategy & Leadership",
            description: "Learn strategic thinking, leadership skills, and how to build successful businesses from industry experts.",
            price: 99, image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
            rating: 4.6, students: 5200, catIdx: 3, instIdx: 3,
            lessons: [
                ["Strategic Planning", "40:00", "VIDEO"],
                ["Leadership Fundamentals", "55:30", "VIDEO"],
                ["Team Management", "50:00", "VIDEO"],
                ["Case Study Analysis", "70:00", "VIDEO"],
            ],
        },
        {
            title: "Digital Marketing Pro",
            description: "Master SEO, social media marketing, content strategy, and paid advertising to grow your business online.",
            price: 69, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
            rating: 4.5, students: 9800, catIdx: 4, instIdx: 4,
            lessons: [
                ["Marketing Fundamentals", "25:00", "VIDEO"],
                ["SEO Optimization", "80:00", "VIDEO"],
                ["Social Media Strategy", "65:00", "VIDEO"],
                ["Content Marketing", "55:00", "VIDEO"],
                ["Quiz: Marketing Concepts", "20:00", "QUIZ"],
            ],
        },
        {
            title: "Photography Essentials",
            description: "Capture stunning photos with any camera. Learn composition, lighting, editing, and build a professional portfolio.",
            price: 59, image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800",
            rating: 4.8, students: 3400, catIdx: 5, instIdx: 5,
            lessons: [
                ["Camera Basics", "35:00", "VIDEO"],
                ["Composition Techniques", "50:00", "VIDEO"],
                ["Lighting Mastery", "60:00", "VIDEO"],
                ["Photo Editing with Lightroom", "85:00", "VIDEO"],
            ],
        },
    ];

    let firstCourseId = null;
    for (const course of coursesData) {
        const courseId = crypto.randomUUID();
        if (!firstCourseId) firstCourseId = courseId;

        await connection.execute(
            `INSERT INTO courses (id, title, description, price, image, rating, students, published, category_id, instructor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?)`,
            [courseId, course.title, course.description, course.price, course.image, course.rating, course.students, categoryIds[course.catIdx], instructorIds[course.instIdx]]
        );

        for (let i = 0; i < course.lessons.length; i++) {
            const [title, duration, type] = course.lessons[i];
            await connection.execute(
                "INSERT INTO lessons (id, title, duration, type, sort_order, course_id) VALUES (?, ?, ?, ?, ?, ?)",
                [crypto.randomUUID(), title, duration, type, i + 1, courseId]
            );
        }
    }
    console.log(`✅ Created ${coursesData.length} courses with lessons`);

    // Sample enrollment + review
    if (firstCourseId) {
        await connection.execute(
            "INSERT INTO enrollments (id, user_id, course_id, progress) VALUES (?, ?, ?, ?)",
            [crypto.randomUUID(), studentId, firstCourseId, 35]
        );
        console.log("✅ Created sample enrollment");

        await connection.execute(
            "INSERT INTO reviews (id, user_id, course_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
            [crypto.randomUUID(), studentId, firstCourseId, 5, "Excellent course! Very well structured and the instructor explains everything clearly."]
        );
        console.log("✅ Created sample review");
    }

    console.log("\n🎉 Database seeded successfully!");
    await connection.end();
}

seed().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
