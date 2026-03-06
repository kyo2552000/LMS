'use client';

import { use, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, Star, PlayCircle, FileText, HelpCircle, BookOpen, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Course } from '@/types';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        // Map DB fields
        data.category = data.category_name || data.category;
        data.instructor = data.instructor_name || data.instructor;
        setCourse(data);
      } catch {
        setCourse(null);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
            <div className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
        <Link href="/courses">
          <Button className="cursor-pointer">Back to Courses</Button>
        </Link>
      </div>
    );
  }

  const handleBuy = () => {
    if (course?.isEnrolled) {
      router.push(`/courses/${course.id}/learn`);
    } else {
      router.push(`/checkout?courseId=${course?.id}`);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <PlayCircle className="h-5 w-5 text-blue-500" />;
      case 'quiz':
        return <HelpCircle className="h-5 w-5 text-purple-500" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <PlayCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Header */}
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {course.image ? (
                <Image
                  src={course.image}
                  alt={course.title || 'Course image'}
                  fill
                  className="object-cover"
                />
              ) : (
                <BookOpen className="h-24 w-24 text-gray-300 dark:text-gray-600" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <span className="inline-block px-4 py-2 rounded-full bg-blue-500/90 backdrop-blur-sm text-sm font-semibold mb-4">
                  {course.category}
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">{course.title}</h1>
                <p className="text-lg opacity-90">bởi {course.instructor}</p>
              </div>
            </div>

            {/* Description */}
            <Card className="rounded-2xl shadow-md border-0">
              <CardHeader>
                <CardTitle>Giới thiệu khóa học</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{course.description}</p>
              </CardContent>
            </Card>

            {/* Course Content */}
            <Card className="rounded-2xl shadow-md border-0">
              <CardHeader>
                <CardTitle>Nội dung khóa học</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        if (course.isEnrolled) {
                          router.push(`/courses/${course.id}/learn?lesson=${lesson.id}`);
                        }
                      }}
                      className={`flex items-center space-x-4 p-4 rounded-xl border transition-colors ${course.isEnrolled ? 'hover:bg-accent/50 cursor-pointer' : 'bg-gray-50 dark:bg-gray-900/50 opacity-75'
                        }`}
                    >
                      <div className="flex-shrink-0 relative">
                        {getLessonIcon(lesson.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{index + 1}. {lesson.title}</h4>
                          <span className="text-sm text-muted-foreground">{lesson.duration || '00:00'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{lesson.type.toLowerCase()}</p>
                      </div>
                      {!course.isEnrolled && (
                        <Lock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 rounded-2xl shadow-xl border-0">
              <CardHeader>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  ${course.price}
                </div>
                <Button
                  onClick={handleBuy}
                  className={`w-full cursor-pointer text-lg py-6 ${course.isEnrolled
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                    }`}
                >
                  {course.isEnrolled ? 'Continue Learning' : `Buy Now — $${course.price}`}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span>Đánh giá</span>
                  </div>
                  <span className="font-semibold">{course.rating} / 5.0</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span>Học viên</span>
                  </div>
                  <span className="font-semibold">{Number(course.students).toLocaleString('en-US')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <PlayCircle className="h-5 w-5" />
                    <span>Bài học</span>
                  </div>
                  <span className="font-semibold">{course.lessons.length}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span>Tổng thời lượng</span>
                  </div>
                  <span className="font-semibold">
                    {Math.round(
                      course.lessons.reduce((acc, lesson) => {
                        const [hours, minutes] = lesson.duration.split(':').map(Number);
                        return acc + hours * 60 + minutes;
                      }, 0) / 60
                    )}h
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
