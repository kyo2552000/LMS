'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Users, CheckCircle2, Loader2, Plus, ArrowRight, Star, Layers3, Eye
} from 'lucide-react';
import { Course } from '@/types';

interface InstructorCourse extends Course {
  student_count?: number;
  lesson_count?: number;
  completion_rate?: number;
  published?: number;
}

export default function InstructorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'INSTRUCTOR')) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const load = async () => {
      if (!user || user.role !== 'INSTRUCTOR') return;
      setLoading(true);
      try {
        const res = await fetch('/api/dashboard?limit=100');
        const data = await res.json();
        setCourses(data.courses || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const published = courses.filter(c => Boolean(c.published)).length;
    const totalStudents = courses.reduce((sum, c) => sum + Number((c as InstructorCourse).students || c.student_count || 0), 0);
    const totalLessons = courses.reduce((sum, c) => sum + Number(c.lesson_count || c.lessons?.length || 0), 0);
    return { totalCourses, published, totalStudents, totalLessons };
  }, [courses]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-blue-600 font-semibold uppercase tracking-widest mb-2">Instructor Dashboard</p>
            <h1 className="text-4xl font-black text-slate-900">Xin chào, {user?.name}</h1>
            <p className="text-slate-500 mt-2">Quản lý khóa học, bài học và tiến độ học viên tại một nơi.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/instructor/courses/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                <Plus className="h-4 w-4 mr-2" /> Tạo khóa học
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="cursor-pointer">
                Xem dashboard học viên <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Khóa học', value: stats.totalCourses, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
            { label: 'Đã xuất bản', value: stats.published, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Học viên', value: stats.totalStudents, icon: Users, color: 'text-purple-600 bg-purple-50' },
            { label: 'Bài học', value: stats.totalLessons, icon: Layers3, color: 'text-amber-600 bg-amber-50' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="rounded-2xl shadow-sm border border-slate-200">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{s.label}</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{s.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="rounded-2xl shadow-sm border border-slate-200">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Khóa học của tôi</h2>
                <p className="text-sm text-slate-500 mt-1">Quản lý nhanh từng khóa học và nội dung tương ứng.</p>
              </div>
              <div className="flex gap-2">
                <Link href="/instructor/courses">
                  <Button variant="outline" className="cursor-pointer">Mở trang quản lý</Button>
                </Link>
                <Link href="/instructor/courses?tab=DRAFT">
                  <Button variant="outline" className="cursor-pointer">Xem bản nháp</Button>
                </Link>
              </div>
            </div>

            <div className="p-6">
              {courses.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Chưa có khóa học nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {courses.slice(0, 6).map((course) => (
                    <div key={course.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white hover:shadow-md transition-shadow">
                      <div className="relative h-40 bg-slate-100">
                        {course.image ? (
                          <Image src={course.image} alt={course.title} fill className="object-cover" />
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-300">
                            <BookOpen className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-slate-900 line-clamp-1">{course.title}</h3>
                            <p className="text-sm text-slate-500 mt-1">{course.lesson_count || course.lessons?.length || 0} bài học</p>
                          </div>
                          <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${Boolean(course.published) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {Boolean(course.published) ? 'Xuất bản' : 'Bản nháp'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Học viên</p>
                            <p className="font-black text-slate-900">{Number((course as InstructorCourse).students || course.student_count || 0)}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Rating</p>
                            <p className="font-black text-slate-900 flex items-center justify-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" /> {Number(course.rating || 0).toFixed(1)}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Tiến độ</p>
                            <p className="font-black text-slate-900">{Number(course.completion_rate || 0)}%</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href={`/instructor/courses/${course.id}/lessons`} className="flex-1">
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white cursor-pointer">
                              Quản lý bài học <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                          <Link href={`/courses/${course.id}`}>
                            <Button variant="outline" className="cursor-pointer">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
