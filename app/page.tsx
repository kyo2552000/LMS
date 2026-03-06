import HeroSection from '@/components/HeroSection';
import CourseCard from '@/components/CourseCard';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { Course, Category } from '@/types';

async function getFeaturedCourses(): Promise<Course[]> {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT c.*, cat.name as category_name, cat.icon as category_icon, cat.color as category_color,
              u.name as instructor_name, u.avatar as instructor_avatar
       FROM courses c
       JOIN categories cat ON c.category_id = cat.id
       JOIN users u ON c.instructor_id = u.id
       WHERE c.published = TRUE
       ORDER BY c.students DESC
       LIMIT 6`
    );

    // Get lessons for each course
    for (const row of rows) {
      const [lessons] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM lessons WHERE course_id = ? ORDER BY sort_order ASC",
        [row.id]
      );
      row.lessons = lessons;
      row.category = row.category_name;
      row.instructor = row.instructor_name;
    }

    return rows as unknown as Course[];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM categories ORDER BY name ASC"
    );
    return rows as unknown as Category[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [featuredCourses, categories] = await Promise.all([
    getFeaturedCourses(),
    getCategories(),
  ]);

  return (
    <>
      <HeroSection />

      {/* Featured Courses */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Khóa học nổi bật
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Khám phá các khóa học phổ biến nhất của chúng tôi được giảng dạy bởi các chuyên gia hàng đầu
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/courses">
              <button className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl cursor-pointer">
                Xem tất cả khóa học
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Khám phá theo danh mục
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tìm các khóa học trong lĩnh vực bạn quan tâm
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/courses?category=${category.name}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                      {category.icon}
                    </div>
                    <h3 className="font-semibold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {category.name}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
