/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Seed dữ liệu mẫu vào DB edulearn (xóa sạch bảng nghiệp vụ rồi nạp lại).
 *
 * Chuẩn bị máy mới:
 *   1) Copy `.env.example` → `.env.local`, chỉnh DB_HOST / DB_USER / DB_PASSWORD / DB_NAME.
 *   2) npm run db:setup   → chạy init.sql + seed
 *      hoặc: npm run db:init sau đó npm run db:seed
 *
 * Chỉ chạy lại seed (giữ nguyên schema): npm run db:seed
 */
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { getMysqlOptions } = require("./db-config");

async function seed() {
    const connection = await mysql.createConnection(getMysqlOptions({ withDatabase: true }));

    console.log("🌱 Connected to MySQL. Seeding database...\n");

    // Clean tables
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
    await connection.execute("TRUNCATE TABLE favorites");
    await connection.execute("TRUNCATE TABLE chat_messages");
    await connection.execute("TRUNCATE TABLE lesson_progress");
    await connection.execute("TRUNCATE TABLE reviews");
    await connection.execute("TRUNCATE TABLE orders");
    await connection.execute("TRUNCATE TABLE coupon_usage");
    await connection.execute("TRUNCATE TABLE coupons");
    await connection.execute("TRUNCATE TABLE comments");
    await connection.execute("TRUNCATE TABLE enrollments");
    await connection.execute("TRUNCATE TABLE lessons");
    await connection.execute("TRUNCATE TABLE courses");
    await connection.execute("TRUNCATE TABLE categories");
    await connection.execute("TRUNCATE TABLE role_permissions");
    await connection.execute("TRUNCATE TABLE permissions");
    await connection.execute("TRUNCATE TABLE users");
    await connection.execute("TRUNCATE TABLE roles");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.log("🧹 Cleaned existing data");

    // ─── Insert Permissions ───────────────────────────────────────────────────
    const permissionIds = {};
    const permissionsData = [
        // Users
        ["users.view", "Xem danh sách người dùng", "Users"],
        ["users.create", "Tạo người dùng mới", "Users"],
        ["users.edit", "Chỉnh sửa người dùng", "Users"],
        ["users.delete", "Xóa người dùng", "Users"],
        ["users.ban", "Khóa/mở khóa người dùng", "Users"],
        // Courses
        ["courses.view", "Xem danh sách khóa học", "Courses"],
        ["courses.create", "Tạo khóa học mới", "Courses"],
        ["courses.edit", "Chỉnh sửa khóa học", "Courses"],
        ["courses.delete", "Xóa khóa học", "Courses"],
        ["courses.publish", "Xuất bản/ẩn khóa học", "Courses"],
        // Categories
        ["categories.view", "Xem danh mục", "Categories"],
        ["categories.create", "Tạo danh mục", "Categories"],
        ["categories.edit", "Sửa danh mục", "Categories"],
        ["categories.delete", "Xóa danh mục", "Categories"],
        // Orders
        ["orders.view", "Xem đơn hàng", "Orders"],
        ["orders.edit", "Chỉnh sửa trạng thái đơn hàng", "Orders"],
        ["orders.delete", "Xóa đơn hàng", "Orders"],
        // Coupons
        ["coupons.view", "Xem mã giảm giá", "Coupons"],
        ["coupons.create", "Tạo mã giảm giá", "Coupons"],
        ["coupons.edit", "Sửa mã giảm giá", "Coupons"],
        ["coupons.delete", "Xóa mã giảm giá", "Coupons"],
        // Comments
        ["comments.view", "Xem bình luận", "Comments"],
        ["comments.moderate", "Kiểm duyệt bình luận", "Comments"],
        ["comments.delete", "Xóa bình luận", "Comments"],
        // Roles
        ["roles.view", "Xem vai trò", "Roles"],
        ["roles.create", "Tạo vai trò mới", "Roles"],
        ["roles.edit", "Sửa vai trò", "Roles"],
        ["roles.delete", "Xóa vai trò", "Roles"],
        // Dashboard
        ["dashboard.view", "Xem tổng quan admin", "Dashboard"],
        ["dashboard.analytics", "Xem phân tích", "Dashboard"],
        // Settings
        ["settings.view", "Xem cài đặt", "Settings"],
        ["settings.edit", "Sửa cài đặt hệ thống", "Settings"],
    ];

    for (const [name, description, module] of permissionsData) {
        const id = crypto.randomUUID();
        await connection.execute(
            "INSERT INTO permissions (id, name, description, module) VALUES (?, ?, ?, ?)",
            [id, name, description, module]
        );
        permissionIds[name] = id;
    }
    console.log(`✅ Created ${permissionsData.length} permissions`);

    // ─── Insert Roles ─────────────────────────────────────────────────────────
    const rolesData = [
        {
            name: "Super Admin",
            description: "Quản trị viên cấp cao với toàn quyền truy cập và quản lý hệ thống",
            color: "purple",
            icon: "crown",
            permissions: Object.keys(permissionIds), // all permissions
        },
        {
            name: "Admin",
            description: "Quản trị viên hệ thống với quyền quản lý toàn diện",
            color: "red",
            icon: "shield",
            permissions: [
                "users.view", "users.create", "users.edit", "users.delete", "users.ban",
                "courses.view", "courses.create", "courses.edit", "courses.delete", "courses.publish",
                "categories.view", "categories.create", "categories.edit", "categories.delete",
                "orders.view", "orders.edit", "orders.delete",
                "coupons.view", "coupons.create", "coupons.edit", "coupons.delete",
                "comments.view", "comments.moderate", "comments.delete",
                "roles.view",
                "dashboard.view", "dashboard.analytics",
                "settings.view", "settings.edit",
            ],
        },
        {
            name: "Student",
            description: "Học viên thông thường có thể đăng ký và học các khóa học",
            color: "green",
            icon: "graduation-cap",
            permissions: [
                "courses.view",
                "comments.view",
                "dashboard.view",
            ],
        },
        {
            name: "Guest",
            description: "Khách thăm với quyền chỉ đọc nội dung công khai",
            color: "gray",
            icon: "user",
            permissions: [
                "courses.view",
            ],
        },
    ];

    const roleIds = {};
    for (const role of rolesData) {
        const id = crypto.randomUUID();
        await connection.execute(
            "INSERT INTO roles (id, name, description, color, icon) VALUES (?, ?, ?, ?, ?)",
            [id, role.name, role.description, role.color, role.icon]
        );
        roleIds[role.name] = id;

        // Link permissions
        for (const permName of role.permissions) {
            const permId = permissionIds[permName];
            if (permId) {
                await connection.execute(
                    "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                    [id, permId]
                );
            }
        }
    }
    console.log(`✅ Created ${rolesData.length} roles with permissions`);

    // ─── Insert Categories ────────────────────────────────────────────────────
    const categoryIds = [];
    const categoriesData = [
        ["Web Development", "web-development", "Lập trình web với các công nghệ hiện đại", "💻", "bg-blue-500"],
        ["Data Science", "data-science", "Khoa học dữ liệu và Machine Learning", "📊", "bg-purple-500"],
        ["Design", "design", "Thiết kế UI/UX và đồ hoạ", "🎨", "bg-pink-500"],
        ["Business", "business", "Kinh doanh và quản trị doanh nghiệp", "💼", "bg-green-500"],
        ["Marketing", "marketing", "Marketing kỹ thuật số và tăng trưởng", "📢", "bg-orange-500"],
        ["Photography", "photography", "Nhiếp ảnh và chỉnh sửa ảnh chuyên nghiệp", "📸", "bg-red-500"],
    ];

    for (const [name, slug, description, icon, color] of categoriesData) {
        const id = crypto.randomUUID();
        await connection.execute(
            "INSERT INTO categories (id, name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)",
            [id, name, slug, description, icon, color]
        );
        categoryIds.push(id);
    }
    console.log(`✅ Created ${categoriesData.length} categories`);

    // ─── Insert Users ─────────────────────────────────────────────────────────
    // Admin
    const adminId = crypto.randomUUID();
    const adminPw = await bcrypt.hash("Admin@123456", 10);
    await connection.execute(
        "INSERT INTO users (id, email, name, password, role, role_id, status, bio, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [adminId, "admin@gmail.com", "admin", adminPw, "ADMIN", roleIds["Admin"], "ACTIVE", "System administrator.", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"]
    );
    console.log("✅ Created admin user (admin@gmail.com / Admin@123456)");

    // Instructors
    const instructorIds = [];
    const instructorsData = [
        ["sarah.johnson@edulearn.com", "Sarah Johnson", "INSTRUCTOR", "Full-stack developer với 10+ năm kinh nghiệm.", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"],
        ["michael.chen@edulearn.com", "Dr. Michael Chen", "INSTRUCTOR", "Tiến sĩ Khoa học Máy tính, chuyên về ML và AI.", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"],
        ["emma.davis@edulearn.com", "Emma Davis", "INSTRUCTOR", "Trưởng nhóm UX designer. Đam mê trải nghiệm người dùng.", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"],
        ["robert.williams@edulearn.com", "Robert Williams", "INSTRUCTOR", "MBA, nhà khởi nghiệp và cố vấn kinh doanh.", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200"],
        ["lisa.anderson@edulearn.com", "Lisa Anderson", "INSTRUCTOR", "Chuyên gia marketing kỹ thuật số.", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200"],
        ["james.wilson@edulearn.com", "James Wilson", "INSTRUCTOR", "Nhiếp ảnh gia chuyên nghiệp.", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200"],
    ];

    for (const [email, name, role, bio, avatar] of instructorsData) {
        const id = crypto.randomUUID();
        const hashedPw = await bcrypt.hash("instructor123", 10);
        await connection.execute(
            "INSERT INTO users (id, email, name, password, role, role_id, status, bio, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [id, email, name, hashedPw, role, roleIds["Student"], "ACTIVE", bio, avatar]
        );
        instructorIds.push(id);
    }
    console.log(`✅ Created ${instructorsData.length} instructors`);

    // Students
    const studentsData = [
        ["alice.cooper@student.com", "Alice Cooper", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"],
        ["bob.smith@student.com", "Bob Smith", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"],
        ["carol.davis@student.com", "Carol Davis", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"],
        ["david.wilson@student.com", "David Wilson", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"],
        ["emma.johnson@student.com", "Emma Johnson", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"],
        ["frank.miller@student.com", "Frank Miller", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"],
        ["grace.lee@student.com", "Grace Lee", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"],
        ["henry.brown@student.com", "Henry Brown", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"],
        ["isabella.white@student.com", "Isabella White", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"],
        ["jack.harris@student.com", "Jack Harris", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"],
        ["karen.martin@student.com", "Karen Martin", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"],
        ["liam.garcia@student.com", "Liam Garcia", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"],
        ["mia.rodriguez@student.com", "Mia Rodriguez", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"],
        ["noah.taylor@student.com", "Noah Taylor", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"],
        ["olivia.anderson@student.com", "Olivia Anderson", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"],
        ["peter.thomas@student.com", "Peter Thomas", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"],
        ["quinn.jackson@student.com", "Quinn Jackson", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"],
        ["rachel.white@student.com", "Rachel White", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"],
        ["samuel.harris@student.com", "Samuel Harris", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"],
        ["tina.clark@student.com", "Tina Clark", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"],
        ["uma.lewis@student.com", "Uma Lewis", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"],
        ["victor.walker@student.com", "Victor Walker", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"],
        ["wendy.hall@student.com", "Wendy Hall", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"],
        ["xavier.young@student.com", "Xavier Young", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"],
    ];

    const studentIds = [];
    for (const [email, name, avatar] of studentsData) {
        const id = crypto.randomUUID();
        const pw = await bcrypt.hash("student123", 10);
        await connection.execute(
            "INSERT INTO users (id, email, name, password, role, role_id, status, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [id, email, name, pw, "STUDENT", roleIds["Student"], "ACTIVE", avatar]
        );
        studentIds.push(id);
    }

    // Guest user
    const guestId = crypto.randomUUID();
    const guestPw = await bcrypt.hash("guest123", 10);
    await connection.execute(
        "INSERT INTO users (id, email, name, password, role, role_id, status, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [guestId, "guest@yolohub.com", "guest_user", guestPw, "STUDENT", roleIds["Guest"], "ACTIVE", "default"]
    );
    console.log(`✅ Created ${studentsData.length + 1} students/guests`);

    // ─── Insert Courses ───────────────────────────────────────────────────────
    const coursesData = [
        {
            title: "Machine Learning with Python",
            slug: "machine-learning-with-python",
            description: "Học Machine Learning từ đầu với Python. Build real-world AI models.",
            price: 129000, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
            rating: 4.9, students: 8900, catIdx: 1, instIdx: 1, published: false, type: "PAID",
            lessons: [
                ["Giới thiệu Machine Learning", "20:00", "VIDEO", "https://www.youtube.com/embed/ukzFI9rgwfU", "<h3>Machine Learning là gì?</h3><p>Machine Learning (ML) là một nhánh của trí tuệ nhân tạo, cho phép máy tính tự học từ dữ liệu mà không cần lập trình rõ ràng.</p><ul><li>Supervised Learning</li><li>Unsupervised Learning</li><li>Reinforcement Learning</li></ul>"],
                ["Python cho Data Science", "75:30", "VIDEO", "https://www.youtube.com/embed/rfscVS0vtbw", "<h3>Tại sao Python?</h3><p>Python là ngôn ngữ phổ biến nhất cho Data Science nhờ hệ sinh thái thư viện phong phú: NumPy, Pandas, Matplotlib, Scikit-learn.</p>"],
                ["Mô hình dự đoán", "110:20", "VIDEO", "https://www.youtube.com/embed/nKW8Ndu7Mjw", "<p>Trong bài này bạn sẽ xây dựng mô hình dự đoán đầu tiên sử dụng Linear Regression và Decision Tree.</p>"],
                ["Đánh giá và Optimization mô hình", "85:00", "VIDEO", "https://www.youtube.com/embed/V6yNghLalV0", "<p>Hiểu về cross-validation, hyperparameter tuning, overfitting và underfitting.</p>"],
                ["Project thực tế", "180:00", "ASSIGNMENT", null, "<h3>Bài tập lớn</h3><p>Xây dựng một mô hình ML hoàn chỉnh để dự đoán giá nhà. Yêu cầu: sử dụng dataset Boston Housing, áp dụng feature engineering, và đánh giá model.</p>"],
            ],
        },
        {
            title: "Mobile App Development with Flutter",
            slug: "mobile-app-development-with-flutter",
            description: "Xây dựng ứng dụng di động đa nền tảng với Flutter và Dart.",
            price: 990000, image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
            rating: 4.7, students: 5200, catIdx: 0, instIdx: 0, published: true, type: "PAID",
            lessons: [
                ["Giới thiệu Flutter", "15:00", "VIDEO", "https://www.youtube.com/embed/1ukSR1GRtMU", "<h3>Flutter là gì?</h3><p>Flutter là framework UI của Google cho phép xây dựng ứng dụng đa nền tảng (iOS, Android, Web) từ một codebase duy nhất.</p>"],
                ["Dart Fundamentals", "45:00", "VIDEO", "https://www.youtube.com/embed/Ej_Pcr4uC2Q", "<p>Dart là ngôn ngữ lập trình chính thức cho Flutter. Bài này cover: variables, functions, classes, async/await.</p>"],
                ["Xây dựng UI với Widgets", "60:00", "VIDEO", "https://www.youtube.com/embed/x0uinJvhNxI", "<p>Widgets là building blocks cơ bản trong Flutter. Mọi thứ trên màn hình đều là Widget.</p>"],
                ["State Management", "80:00", "VIDEO", "https://www.youtube.com/embed/d_m5csmrf7I", "<p>Quản lý state hiệu quả với Provider, Riverpod và BLoC pattern.</p>"],
                ["Kết nối API & Firebase", "70:00", "VIDEO", "https://www.youtube.com/embed/8OHdcGJ5hFo", "<p>Tích hợp REST API, Firebase Realtime Database và Firestore trong ứng dụng Flutter.</p>"],
            ],
        },
        {
            title: "UI/UX Design Fundamentals với Figma",
            slug: "ui-ux-design-fundamentals",
            description: "Học thiết kế UI/UX chuyên nghiệp từ cơ bản đến nâng cao với Figma. Miễn phí!",
            price: 0, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
            rating: 4.7, students: 6700, catIdx: 2, instIdx: 2, published: true, type: "FREE",
            lessons: [
                ["Nguyên tắc thiết kế UI", "30:00", "VIDEO", "https://www.youtube.com/embed/wIuVvCuiJhU", "<h3>4 Nguyên tắc thiết kế</h3><ul><li><strong>Contrast</strong> - Tạo sự khác biệt</li><li><strong>Repetition</strong> - Lặp lại nhất quán</li><li><strong>Alignment</strong> - Căn chỉnh</li><li><strong>Proximity</strong> - Nhóm liên quan</li></ul>"],
                ["Làm quen với Figma", "35:00", "VIDEO", "https://www.youtube.com/embed/FTFaQWZBqQ8", "<p>Figma là công cụ thiết kế UI/UX hàng đầu, miễn phí và chạy trên trình duyệt.</p>"],
                ["Design Systems & Components", "45:00", "VIDEO", "https://www.youtube.com/embed/Dtd40cHQQlk", "<p>Xây dựng Design System giúp đảm bảo tính nhất quán trong toàn bộ sản phẩm.</p>"],
                ["Prototype tương tác", "50:00", "VIDEO", "https://www.youtube.com/embed/iBkXf6u8Mzc", "<p>Tạo prototype interactive để test flow người dùng trước khi code.</p>"],
                ["Quiz: UI/UX cơ bản", "15:00", "QUIZ", null, null],
            ],
        },
        {
            title: "Python for Data Science Masterclass",
            slug: "python-for-data-science-masterclass",
            description: "Làm chủ Python cho phân tích dữ liệu, trực quan hóa và ML.",
            price: 890000, image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
            rating: 4.8, students: 12500, catIdx: 1, instIdx: 1, published: true, type: "PAID",
            lessons: [
                ["Python cơ bản", "40:00", "VIDEO", "https://www.youtube.com/embed/kqtD5dpn9C8", "<h3>Python Basics</h3><p>Variables, data types, conditions, loops và functions. Nền tảng vững chắc cho Data Science.</p>"],
                ["NumPy & Pandas", "60:00", "VIDEO", "https://www.youtube.com/embed/QUT1VHiLmmI", "<p>NumPy cho tính toán số học, Pandas cho xử lý dữ liệu dạng bảng. Hai thư viện không thể thiếu.</p>"],
                ["Data Visualization", "55:00", "VIDEO", "https://www.youtube.com/embed/UO98lJQ3QGI", "<p>Trực quan hóa dữ liệu với Matplotlib và Seaborn để khám phá insight từ data.</p>"],
                ["Scikit-learn ML cơ bản", "70:00", "VIDEO", "https://www.youtube.com/embed/pqNCD_5r0IU", "<p>Xây dựng model ML đầu tiên: Classification, Regression, Clustering với scikit-learn.</p>"],
                ["Quiz: Python Data Science", "20:00", "QUIZ", null, null],
                ["Capstone Project", "120:00", "ASSIGNMENT", null, "<h3>Capstone Project</h3><p>Phân tích bộ dữ liệu thực tế, xây dựng pipeline ML hoàn chỉnh từ EDA đến Model Deployment.</p>"],
            ],
        },
        {
            title: "Complete React.js Development Bootcamp",
            slug: "complete-react-js-development-bootcamp",
            description: "Khóa học React.js toàn diện từ cơ bản đến nâng cao, hooks, Redux.",
            price: 790000, image: "https://images.unsplash.com/photo-1633356122544-f134324a6cca?w=800",
            rating: 4.8, students: 9800, catIdx: 0, instIdx: 0, published: true, type: "PAID",
            lessons: [
                ["React Fundamentals", "50:00", "VIDEO", "https://www.youtube.com/embed/SqcY0GlETPk", "<h3>React là gì?</h3><p>React là thư viện JavaScript phổ biến nhất để xây dựng giao diện người dùng. Được phát triển bởi Facebook (Meta).</p><p>Trong bài này: JSX, Components, Props, State.</p>"],
                ["React Hooks: useState & useEffect", "45:00", "VIDEO", "https://www.youtube.com/embed/O6P86uwfdR0", "<p>React Hooks giúp quản lý state và side effects trong functional components một cách elegant.</p>"],
                ["React Router", "35:00", "VIDEO", "https://www.youtube.com/embed/Ul3y1LXxzdU", "<p>Routing trong React SPA. Tạo multi-page experience với React Router DOM v6.</p>"],
                ["State Management với Redux", "90:00", "VIDEO", "https://www.youtube.com/embed/poQXNp9ItL4", "<p>Redux Toolkit - công cụ quản lý global state mạnh mẽ cho ứng dụng React lớn.</p>"],
                ["Quiz: React.js", "20:00", "QUIZ", null, null],
                ["Project: Full-stack App", "150:00", "ASSIGNMENT", null, "<h3>Full-stack Project</h3><p>Xây dựng ứng dụng Todo App hoàn chỉnh: React frontend + Node.js backend + MySQL database.</p>"],
            ],
        },
        {
            title: "Node.js & Express API Development",
            slug: "nodejs-express-api-development",
            description: "Xây dựng RESTful API chuyên nghiệp với Node.js, Express, JWT và MySQL.",
            price: 699000, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
            rating: 4.7, students: 7200, catIdx: 0, instIdx: 0, published: true, type: "PAID",
            lessons: [
                ["Giới thiệu Node.js và NPM", "20:00", "VIDEO", "https://www.youtube.com/embed/TlB_eWDSMt4", "<h3>Node.js Runtime</h3><p>Node.js cho phép chạy JavaScript bên ngoài trình duyệt, mở ra thế giới backend development.</p>"],
                ["Express.js Framework cơ bản", "35:00", "VIDEO", "https://www.youtube.com/embed/SccSCuHhOw0", "<p>Express là web framework phổ biến nhất cho Node.js. Minimal, flexible, và powerful.</p>"],
                ["RESTful API Design", "40:00", "VIDEO", "https://www.youtube.com/embed/pKd0Rpw7O48", "<p>Thiết kế API chuẩn REST: HTTP methods, status codes, URL patterns, request/response format.</p>"],
                ["Xác thực với JWT", "50:00", "VIDEO", "https://www.youtube.com/embed/mbsmsi7l3r4", "<p>JSON Web Token - Giải pháp xác thực stateless phổ biến cho REST APIs.</p>"],
                ["Kết nối MySQL với Sequelize", "45:00", "VIDEO", "https://www.youtube.com/embed/ExTZYpyAn6s", "<p>ORM Sequelize giúp tương tác database dễ dàng hơn với JavaScript objects.</p>"],
                ["Quiz: Node.js & Express", "15:00", "QUIZ", null, null],
            ],
        },
        {
            title: "HTML & CSS cho người mới bắt đầu",
            slug: "html-css-cho-nguoi-moi-bat-dau",
            description: "Khóa học miễn phí: HTML cơ bản, CSS styling, Flexbox và Grid layout.",
            price: 0, image: "https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800",
            rating: 4.6, students: 15200, catIdx: 0, instIdx: 0, published: true, type: "FREE",
            lessons: [
                ["HTML là gì? Cấu trúc trang web", "18:00", "VIDEO", "https://www.youtube.com/embed/qz0aGYrrlhU", "<h3>HTML - HyperText Markup Language</h3><p>HTML là ngôn ngữ đánh dấu dùng để tạo cấu trúc cho trang web. Mỗi trang web đều bắt đầu từ HTML.</p>"],
                ["Các thẻ HTML phổ biến", "25:00", "VIDEO", "https://www.youtube.com/embed/UB1O30fR-EE", "<p>Heading, paragraph, links, images, lists, tables - những thẻ HTML bạn sẽ dùng hàng ngày.</p>"],
                ["CSS cơ bản - Styling trang web", "30:00", "VIDEO", "https://www.youtube.com/embed/1PnVor36_40", "<p>CSS giúp trang web trở nên đẹp mắt: colors, fonts, spacing, backgrounds.</p>"],
                ["CSS Flexbox Layout", "35:00", "VIDEO", "https://www.youtube.com/embed/fYq5PXgSsbE", "<p>Flexbox - hệ thống layout 1 chiều, giải quyết hầu hết các bài toán bố cục trong CSS.</p>"],
                ["CSS Grid Layout", "35:00", "VIDEO", "https://www.youtube.com/embed/jV8B24rSN5o", "<p>CSS Grid - hệ thống layout 2 chiều mạnh mẽ cho các bố cục phức tạp.</p>"],
                ["Responsive Design & Media Queries", "28:00", "VIDEO", "https://www.youtube.com/embed/srvUrASNj0s", "<p>Tạo website hiển thị đẹp trên mọi thiết bị: desktop, tablet, mobile.</p>"],
                ["Quiz: HTML & CSS", "15:00", "QUIZ", null, null],
            ],
        },
        {
            title: "Digital Marketing toàn diện 2024",
            slug: "digital-marketing-toan-dien-2024",
            description: "SEO, Google Ads, Facebook Ads, Content Marketing và Email Marketing từ chuyên gia.",
            price: 799000, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
            rating: 4.7, students: 11200, catIdx: 4, instIdx: 4, published: true, type: "PAID",
            lessons: [
                ["Tổng quan Digital Marketing", "25:00", "VIDEO", "https://www.youtube.com/embed/bixR-KIJKYM", "<p>Digital Marketing bao gồm tất cả hoạt động marketing sử dụng thiết bị điện tử và internet.</p>"],
                ["SEO - Tối ưu công cụ tìm kiếm", "70:00", "VIDEO", "https://www.youtube.com/embed/DvwS7cV9GmQ", "<p>SEO giúp website xuất hiện trên top kết quả tìm kiếm Google một cách tự nhiên (organic).</p>"],
                ["Google Ads - Quảng cáo tìm kiếm", "60:00", "VIDEO", "https://www.youtube.com/embed/oQw8pn-xgZY", "<p>Chạy quảng cáo Google Search hiệu quả với chi phí tối ưu.</p>"],
                ["Facebook & Instagram Ads", "65:00", "VIDEO", "https://www.youtube.com/embed/JiOlNbRP_uo", "<p>Quảng cáo trên Facebook và Instagram: targeting, creative, budget optimization.</p>"],
                ["Content Marketing & Copywriting", "50:00", "VIDEO", "https://www.youtube.com/embed/L0xS3TVLRP0", "<p>Tạo nội dung hấp dẫn để thu hút và giữ chân khách hàng.</p>"],
                ["Email Marketing & Automation", "45:00", "VIDEO", "https://www.youtube.com/embed/qV8YFo8VEZ4", "<p>Xây dựng email list và tự động hóa chiến dịch email marketing.</p>"],
                ["Quiz: Digital Marketing", "20:00", "QUIZ", null, null],
            ],
        },
        {
            title: "Khởi nghiệp từ 0 - Startup Masterclass",
            slug: "khoi-nghiep-tu-0-startup-masterclass",
            description: "Từ ý tưởng đến doanh nghiệp thực sự: validate, MVP, gọi vốn và scale business.",
            price: 999000, image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
            rating: 4.8, students: 4300, catIdx: 3, instIdx: 3, published: true, type: "PAID",
            lessons: [
                ["Tư duy khởi nghiệp & Tìm kiếm ý tưởng", "30:00", "VIDEO", "https://www.youtube.com/embed/ZoqgAy3h4OM", "<p>Khởi nghiệp không chỉ là ý tưởng hay, mà là khả năng thực thi và kiên trì.</p>"],
                ["Validate ý tưởng với Lean Startup", "40:00", "VIDEO", "https://www.youtube.com/embed/RSaIOCHbuYw", "<p>Lean Startup: Build - Measure - Learn. Kiểm chứng ý tưởng nhanh nhất với chi phí thấp nhất.</p>"],
                ["Business Model Canvas", "45:00", "VIDEO", "https://www.youtube.com/embed/IP0cUBWTgpY", "<p>9 khối trong Business Model Canvas giúp bạn hình dung toàn bộ mô hình kinh doanh.</p>"],
                ["Tài chính cơ bản cho Startup", "50:00", "VIDEO", "https://www.youtube.com/embed/WEDIj9JBTC8", "<p>Cash flow, burn rate, runway - những con số quan trọng nhất cho startup.</p>"],
                ["Gọi vốn & Pitch to Investors", "55:00", "VIDEO", "https://www.youtube.com/embed/2b3xG_YjgvI", "<p>Cách xây dựng pitch deck và thuyết phục nhà đầu tư.</p>"],
                ["Quiz: Startup Knowledge", "20:00", "QUIZ", null, null],
            ],
        },
        {
            title: "Adobe Photoshop từ cơ bản đến nâng cao",
            slug: "adobe-photoshop-tu-co-ban-den-nang-cao",
            description: "Chỉnh sửa ảnh chuyên nghiệp, thiết kế graphic và retouching portrait.",
            price: 499000, image: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800",
            rating: 4.6, students: 5100, catIdx: 2, instIdx: 2, published: true, type: "PAID",
            lessons: [
                ["Giao diện Photoshop & Công cụ cơ bản", "25:00", "VIDEO", "https://www.youtube.com/embed/IyR_uYsRdPs", "<p>Làm quen với workspace, tools panel và các panel chính trong Photoshop.</p>"],
                ["Layers & Blending Modes", "40:00", "VIDEO", "https://www.youtube.com/embed/6pOSRDfLz2A", "<p>Layers là nền tảng của Photoshop. Hiểu cách layers hoạt động là key to success.</p>"],
                ["Selection Tools & Masking", "45:00", "VIDEO", "https://www.youtube.com/embed/YPSveMFAJAc", "<p>Chọn vùng chính xác với Quick Selection, Pen Tool, và Layer Masks.</p>"],
                ["Chỉnh sửa màu sắc & Adjustment Layers", "50:00", "VIDEO", "https://www.youtube.com/embed/2p7Q3VgPEJU", "<p>Color correction và color grading chuyên nghiệp với Curves, Levels, HSL.</p>"],
                ["Retouching Portrait chuyên nghiệp", "60:00", "VIDEO", "https://www.youtube.com/embed/9jlj8qNjLRc", "<p>Frequency Separation, Dodge & Burn - Kỹ thuật retouching da chuẩn studio.</p>"],
                ["Quiz: Photoshop Basics", "15:00", "QUIZ", null, null],
            ],
        },
        {
            title: "Nhiếp ảnh chuyên nghiệp - Từ Auto đến Manual",
            slug: "nhiep-anh-chuyen-nghiep-tu-auto-den-manual",
            description: "Làm chủ máy ảnh DSLR/Mirrorless: exposure triangle, composition và Lightroom.",
            price: 599000, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
            rating: 4.8, students: 6200, catIdx: 5, instIdx: 5, published: true, type: "PAID",
            lessons: [
                ["Hiểu máy ảnh: Anatomy & Controls", "25:00", "VIDEO", "https://www.youtube.com/embed/LxO-6rlihSg", "<p>Tìm hiểu các bộ phận và nút điều khiển trên máy ảnh DSLR/Mirrorless.</p>"],
                ["Exposure Triangle: Aperture, Shutter, ISO", "40:00", "VIDEO", "https://www.youtube.com/embed/YojL7UQTVhc", "<h3>Tam giác phơi sáng</h3><ul><li><strong>Aperture</strong> - Khẩu độ: kiểm soát ánh sáng và bokeh</li><li><strong>Shutter Speed</strong> - Tốc độ màn trập: freeze hoặc blur chuyển động</li><li><strong>ISO</strong> - Độ nhạy sáng: cân bằng noise và brightness</li></ul>"],
                ["Composition & Quy tắc 1/3", "35:00", "VIDEO", "https://www.youtube.com/embed/VArISvUuyr0", "<p>Rule of Thirds, leading lines, framing - các quy tắc bố cục kinh điển.</p>"],
                ["Lighting - Ánh sáng trong nhiếp ảnh", "50:00", "VIDEO", "https://www.youtube.com/embed/j_Sov3xmgwg", "<p>Ánh sáng là yếu tố quan trọng nhất trong nhiếp ảnh. Natural vs Artificial light.</p>"],
                ["Chụp Portrait & Street Photography", "60:00", "VIDEO", "https://www.youtube.com/embed/NP6dFJRTHDw", "<p>Kỹ thuật chụp chân dung đẹp và street photography chân thực.</p>"],
                ["Hậu kỳ với Adobe Lightroom", "55:00", "VIDEO", "https://www.youtube.com/embed/5lLxhCOE2LQ", "<p>Workflow hậu kỳ chuẩn: Import → Cull → Edit → Export trong Lightroom Classic.</p>"],
                ["Quiz: Nhiếp ảnh cơ bản", "15:00", "QUIZ", null, null],
            ],
        },
        {
            title: "Mobile Photography - Chụp ảnh đẹp bằng điện thoại",
            slug: "mobile-photography-chup-anh-dep-bang-dien-thoai",
            description: "Miễn phí! Chụp ảnh như professional chỉ bằng điện thoại với Snapseed, VSCO.",
            price: 0, image: "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800",
            rating: 4.6, students: 22000, catIdx: 5, instIdx: 5, published: true, type: "FREE",
            lessons: [
                ["Tối ưu camera settings trên điện thoại", "20:00", "VIDEO", "https://www.youtube.com/embed/5N2PjfEGFLk", "<p>Khai thác tối đa camera điện thoại: HDR, Pro mode, Night mode.</p>"],
                ["Composition & Bố cục ảnh đẹp", "25:00", "VIDEO", "https://www.youtube.com/embed/VArISvUuyr0", "<p>Áp dụng quy tắc bố cục cho mobile photography.</p>"],
                ["Ánh sáng tự nhiên - Golden Hour", "20:00", "VIDEO", "https://www.youtube.com/embed/GJDdoCFPjbA", "<p>Golden Hour và Blue Hour - thời điểm vàng để chụp ảnh đẹp nhất.</p>"],
                ["Chỉnh sửa ảnh với Snapseed & VSCO", "35:00", "VIDEO", "https://www.youtube.com/embed/DPLhEq5YEKM", "<p>Snapseed cho chỉnh sửa chi tiết, VSCO cho preset và film look.</p>"],
                ["Tạo feed Instagram đẹp", "25:00", "VIDEO", "https://www.youtube.com/embed/9NQAP1jwCeA", "<p>Xây dựng Instagram aesthetic: color palette, grid layout, storytelling.</p>"],
            ],
        },
    ];

    const courseIds = [];
    for (const course of coursesData) {
        const courseId = crypto.randomUUID();
        courseIds.push(courseId);

        await connection.execute(
            `INSERT INTO courses (id, title, slug, description, price, image, rating, students, published, type, category_id, instructor_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [courseId, course.title, course.slug, course.description, course.price, course.image, course.rating, course.students,
             course.published, course.type, categoryIds[course.catIdx], instructorIds[course.instIdx]]
        );

        for (let i = 0; i < course.lessons.length; i++) {
            const [title, duration, type, video_url, content] = course.lessons[i];
            await connection.execute(
                "INSERT INTO lessons (id, title, duration, type, video_url, content, sort_order, course_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [crypto.randomUUID(), title, duration, type, video_url || null, content || null, i + 1, courseId]
            );
        }
    }
    console.log(`✅ Created ${coursesData.length} courses with lessons`);

    // ─── Insert Enrollments ───────────────────────────────────────────────────
    // Mỗi học viên đăng ký 2-4 khóa
    for (let i = 0; i < studentIds.length; i++) {
        const numCourses = 2 + Math.floor(Math.random() * 3); // 2-4 courses
        const courseIndices = [];
        for (let j = 0; j < numCourses; j++) {
            let idx;
            do {
                idx = Math.floor(Math.random() * courseIds.length);
            } while (courseIndices.includes(idx));
            courseIndices.push(idx);
        }
        
        for (const idx of courseIndices) {
            const progress = Math.floor(Math.random() * 100);
            const enrolledAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
            const completedAt = progress === 100 ? enrolledAt : null;
            await connection.execute(
                "INSERT IGNORE INTO enrollments (id, user_id, course_id, progress, enrolled_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)",
                [crypto.randomUUID(), studentIds[i], courseIds[idx], progress, enrolledAt, completedAt]
            );
        }
    }
    console.log("✅ Created sample enrollments");

    // ─── Insert Reviews ───────────────────────────────────────────────────────
    const reviewsData = [
        ["Khóa học rất tuyệt vời! Giảng viên giải thích rõ ràng và dễ hiểu.", 5],
        ["Nội dung rất chuyên sâu, rất hài lòng với khóa học này.", 5],
        ["Giảng viên nhiệt tình, bài giảng dễ theo dõi.", 5],
        ["Tôi đã học được rất nhiều kỹ năng bổ ích.", 4],
        ["Khóa học này giúp tôi nâng cao kỹ năng chuyên môn.", 4],
        ["Rất đáng học, tôi sẽ giới thiệu cho bạn bè.", 5],
        ["Nội dung phù hợp cho người mới bắt đầu.", 4],
        ["Giảng viên rất nhiệt tình trả lời câu hỏi.", 5],
        ["Bài tập thực hành rất bổ ích.", 4],
        ["Khóa học giúp tôi có việc làm mới.", 5],
        ["Nội dung được cập nhật, theo xu hướng hiện tại.", 4],
        ["Tôi rất thích cách giảng dạy của giảng viên.", 5],
        ["Khóa học này là tiền đề tốt cho sự nghiệp của tôi.", 5],
        ["Giảng viên có kinh nghiệm thực tế rất sâu.", 4],
        ["Học xong khóa này, tôi có thể áp dụng vào công việc ngay.", 5],
        ["Nội dung chi tiết, không bỏ qua điểm nào.", 4],
        ["Giảng viên truyền đạt kiến thức một cách sinh động.", 5],
        ["Thời lượng khóa học phù hợp, không quá dài.", 4],
        ["Khóa học này nên là bắt buộc cho mọi người muốn phát triển.", 5],
        ["Tôi đã hoàn thành khóa học với kỹ năng tốt.", 4],
        ["Giảng viên giải thích rất kỹ từng khái niệm.", 5],
        ["Khóa học rất thực tiễn, không lý thuyết suông.", 4],
        ["Tôi sẽ theo dõi thêm các khóa học khác của giảng viên.", 5],
        ["Bài tập cuối khóa rất thử thách và bổ ích.", 4],
        ["Khóa học này vượt quá kỳ vọng của tôi.", 5],
        ["Nội dung được sắp xếp logic, dễ theo dõi.", 4],
    ];

    for (let i = 0; i < Math.min(studentIds.length, reviewsData.length); i++) {
        const [comment, rating] = reviewsData[i];
        const courseIdx = Math.floor(Math.random() * courseIds.length);
        await connection.execute(
            "INSERT IGNORE INTO reviews (id, user_id, course_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
            [crypto.randomUUID(), studentIds[i], courseIds[courseIdx], rating, comment]
        );
    }
    console.log(`✅ Created ${Math.min(studentIds.length, reviewsData.length)} reviews`);

    // ─── Insert Coupons ───────────────────────────────────────────────────────
    const couponsData = [
        {
            code: "WELCOME50",
            description: "Giảm 50% cho người dùng mới",
            discount_type: "PERCENTAGE",
            discount_value: 50,
            min_order_amount: 0,
            max_discount_amount: 200000,
            usage_limit: 100,
            status: "ACTIVE",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
            code: "SALE2026",
            description: "Khuyến mãi năm mới 2026 - giảm 30%",
            discount_type: "PERCENTAGE",
            discount_value: 30,
            min_order_amount: 50000,
            max_discount_amount: 500000,
            usage_limit: 200,
            status: "ACTIVE",
            expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
        {
            code: "FLAT100K",
            description: "Giảm thẳng 100.000đ cho đơn từ 300.000đ",
            discount_type: "FIXED",
            discount_value: 100000,
            min_order_amount: 300000,
            max_discount_amount: null,
            usage_limit: 50,
            status: "ACTIVE",
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        {
            code: "EXPIRED10",
            description: "Mã đã hết hạn - giảm 10%",
            discount_type: "PERCENTAGE",
            discount_value: 10,
            min_order_amount: 0,
            max_discount_amount: null,
            usage_limit: 500,
            status: "EXPIRED",
            expires_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
    ];

    for (const coupon of couponsData) {
        await connection.execute(
            `INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, status, expires_at, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [crypto.randomUUID(), coupon.code, coupon.description, coupon.discount_type, coupon.discount_value,
             coupon.min_order_amount, coupon.max_discount_amount, coupon.usage_limit, coupon.status, coupon.expires_at, adminId]
        );
    }
    console.log(`✅ Created ${couponsData.length} coupons`);

    // ─── Insert Orders ────────────────────────────────────────────────────────
    const paymentMethods = ["QR_TRANSFER", "BANK_TRANSFER", "MOMO", "CARD", "PAYPAL"];
    const paidAtSeed = new Date().toISOString().slice(0, 19).replace("T", " ");
    
    // Tạo 30+ orders
    for (let i = 0; i < Math.min(studentIds.length * 1.5, 30); i++) {
        const studentIdx = Math.floor(Math.random() * studentIds.length);
        const courseIdx = Math.floor(Math.random() * courseIds.length);
        const coursePrice = coursesData[courseIdx].price;
        
        if (coursePrice > 0) {
            const status = Math.random() > 0.15 ? "PAID" : "PENDING";
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            const orderDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
            const orderDateStr = orderDate.toISOString().slice(0, 19).replace("T", " ");
            
            await connection.execute(
                "INSERT IGNORE INTO orders (id, user_id, course_id, amount, discount_amount, status, payment_method, paid_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)",
                [crypto.randomUUID(), studentIds[studentIdx], courseIds[courseIdx], coursePrice, status, paymentMethod, status === "PAID" ? orderDateStr : null]
            );
        }
    }
    console.log("✅ Created sample orders (30+ PAID orders)");

    // ─── Insert Comments ──────────────────────────────────────────────────────
    const commentsTextData = [
        "Khóa học này rất hay, tôi đã học được nhiều kiến thức mới!",
        "Giảng viên giảng dạy rõ ràng, dễ hiểu. Recommended!",
        "Nội dung thiết kế rất chất lượng, tôi đã có thể làm portfolio sau khóa học này.",
        "Python khó nhưng giảng viên giải thích rất dễ hiểu.",
        "React course tốt nhất mà tôi từng học!",
        "Bài tập thực hành rất bổ ích, áp dụng được ngay.",
        "Giảng viên rất nhiệt tình trả lời câu hỏi của học viên.",
        "Khóa học giúp tôi nâng cao kỹ năng chuyên môn đáng kể.",
        "Tôi rất thích cách giảng dạy của giảng viên.",
        "Nội dung được cập nhật theo xu hướng hiện tại.",
        "Bài giảng được sắp xếp logic, dễ theo dõi.",
        "Giảng viên có kinh nghiệm thực tế rất sâu.",
        "Học xong khóa này, tôi có thể áp dụng vào công việc ngay.",
        "Các bài tập project rất thú vị và thử thách.",
        "Khóa học này vượt quá kỳ vọng của tôi.",
        "Nội dung chi tiết, không bỏ qua điểm nào quan trọng.",
        "Tôi sẽ giới thiệu khóa học này cho bạn bè.",
        "Giảng viên truyền đạt kiến thức một cách sinh động.",
        "Thời lượng khóa học phù hợp, không quá dài.",
        "Tôi có cơ hội việc làm mới nhờ khóa học này.",
        "Bài giảng video chất lượng cao, âm thanh rõ ràng.",
        "Nội dung rất thực tiễn, không lý thuyết suông.",
        "Tôi sẽ theo dõi thêm các khóa học khác của giảng viên.",
        "Bài tập cuối khóa rất thử thách và bổ ích.",
        "Cộng đồng học viên rất thân thiện và hỗ trợ nhau.",
        "Giảng viên giải thích rất kỹ từng khái niệm khó.",
        "Khóa học nên là bắt buộc cho mọi người muốn phát triển.",
        "Tôi đã hoàn thành khóa học với kỹ năng tốt hơn nhiều.",
        "Phần practice problem rất giúp ích.",
        "Khóa học này có tỉ lệ giá/chất lượng rất tốt.",
    ];

    for (let i = 0; i < commentsTextData.length; i++) {
        const studentIdx = i % studentIds.length;
        const courseIdx = Math.floor(Math.random() * courseIds.length);
        const content = commentsTextData[i];
        
        await connection.execute(
            "INSERT INTO comments (id, content, user_id, course_id, status) VALUES (?, ?, ?, ?, ?)",
            [crypto.randomUUID(), content, studentIds[studentIdx], courseIds[courseIdx], "VISIBLE"]
        );
    }

    // Instructors reply to some comments
    for (let i = 0; i < Math.min(5, commentsTextData.length); i++) {
        const instructorIdx = Math.floor(Math.random() * instructorIds.length);
        const replyContent = ["Cảm ơn bạn đã ủng hộ! Chúc bạn học tốt!", "Rất vui được nghe phản hồi tích cực từ bạn!", "Hãy tiếp tục cố gắng, bạn sẽ đạt được mục tiêu!"][i % 3];
        
        await connection.execute(
            "INSERT INTO comments (id, content, user_id, course_id, status) VALUES (?, ?, ?, ?, ?)",
            [crypto.randomUUID(), replyContent, instructorIds[instructorIdx], courseIds[Math.floor(Math.random() * courseIds.length)], "VISIBLE"]
        );
    }
    console.log(`✅ Created ${commentsTextData.length + 5} comments`);

    // ─── Insert Favorites ──────────────────────────────────────────────────────
    // Students favorite various courses
    for (let i = 0; i < studentIds.length; i++) {
        // Each student favorites 2-3 random courses
        const numFavs = 2 + Math.floor(Math.random() * 2);
        const shuffled = [...courseIds].sort(() => Math.random() - 0.5);
        for (let j = 0; j < Math.min(numFavs, shuffled.length); j++) {
            await connection.execute(
                "INSERT IGNORE INTO favorites (id, user_id, course_id) VALUES (?, ?, ?)",
                [crypto.randomUUID(), studentIds[i], shuffled[j]]
            );
        }
    }
    // Instructors also favorite some courses
    for (let i = 0; i < instructorIds.length; i++) {
        await connection.execute(
            "INSERT IGNORE INTO favorites (id, user_id, course_id) VALUES (?, ?, ?)",
            [crypto.randomUUID(), instructorIds[i], courseIds[(i + 2) % courseIds.length]]
        );
    }
    console.log("✅ Created sample favorites");

    console.log("\n🎉 Database seeded successfully!");
    console.log("👤 Admin: admin@gmail.com / Admin@123456");
    await connection.end();
}

module.exports = { seed };

if (require.main === module) {
    seed().catch((err) => {
        console.error("❌ Error:", err.message);
        process.exit(1);
    });
}
