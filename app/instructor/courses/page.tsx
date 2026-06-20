'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, BookOpen, CheckCircle2, Eye, PencilLine, Layers3, Edit3 } from 'lucide-react';

interface CourseItem {
  id: string;
  title: string;
  published?: number;
  lessons?: { id: string }[];
  students?: number;
  image?: string;
  completion_rate?: number;
}

export default function InstructorCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'INSTRUCTOR')) router.push('/');
  }, [authLoading, user, router]);

  useEffect(() => {
    const load = async () => {
      if (!user || user.role !== 'INSTRUCTOR') return;
      setLoading(true);
      try {
        const res = await fetch('/api/instructor/courses?page=1&limit=500');
        const data = await res.json();
        setCourses(data.rows || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Khóa học của giảng viên</h1>
          <p className="text-slate-500 mt-1">Tạo và quản lý khóa học, bài giảng ngay trong khu vực giảng viên.</p>
        </div>
        <Link href="/admin/courses">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
            <Plus className="h-4 w-4 mr-2" /> Tạo khóa học
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Tổng khóa học</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{courses.length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><BookOpen className="h-6 w-6" /></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Đã xuất bản</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{courses.filter(c => Boolean(c.published)).length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="h-6 w-6" /></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Bài giảng</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{courses.reduce((sum, c) => sum + (c.lessons?.length || 0), 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center"><Layers3 className="h-6 w-6" /></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {courses.map(course => (
          <Card key={course.id} className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{course.lessons?.length || 0} bài học</p>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${Boolean(course.published) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {Boolean(course.published) ? 'Xuất bản' : 'Bản nháp'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Học viên</p>
                  <p className="font-black text-slate-900">{course.students || 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Tiến độ</p>
                  <p className="font-black text-slate-900">{Number(course.completion_rate || 0)}%</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/instructor/courses/${course.id}`}>
                  <Button variant="outline" className="cursor-pointer">
                    <Edit3 className="h-4 w-4 mr-2" /> Sửa khóa học
                  </Button>
                </Link>
                <Link href={`/instructor/courses/${course.id}/lessons`} className="flex-1">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white cursor-pointer">
                    <PencilLine className="h-4 w-4 mr-2" /> Quản lý bài giảng
                  </Button>
                </Link>
                <Link href={`/courses/${course.id}`}>
                  <Button variant="outline" className="cursor-pointer">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
