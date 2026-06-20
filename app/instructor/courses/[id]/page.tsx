'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Save, Trash2 } from 'lucide-react';

interface CourseForm {
  title: string;
  description: string;
  category_id: string;
  image: string;
  level: string;
  type: string;
  price: number;
  published: number;
}

export default function InstructorEditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<CourseForm>({
    title: '',
    description: '',
    category_id: '',
    image: '',
    level: 'BEGINNER',
    type: 'PAID',
    price: 0,
    published: 0,
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'INSTRUCTOR')) router.push('/');
  }, [authLoading, user, router]);

  useEffect(() => {
    const load = async () => {
      if (!user || user.role !== 'INSTRUCTOR') return;
      const { id } = await params;
      try {
        const [courseRes, categoriesRes] = await Promise.all([
          fetch(`/api/courses/${id}`),
          fetch('/api/categories'),
        ]);
        const courseData = await courseRes.json();
        const catData = await categoriesRes.json();
        const course = courseData.course || courseData;
        setCategories(catData.categories || (Array.isArray(catData) ? catData : []));
        setForm({
          title: course.title || '',
          description: course.description || '',
          category_id: course.category_id || '',
          image: course.image || '',
          level: course.level || 'BEGINNER',
          type: course.type || 'PAID',
          price: Number(course.price || 0),
          published: Number(course.published || 0),
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params, user]);

  const save = async () => {
    setSaving(true);
    try {
      const { id } = await params;
      const res = await fetch(`/api/instructor/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu thất bại');
      router.push('/instructor/courses');
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm('Xóa khóa học này?')) return;
    setDeleting(true);
    try {
      const { id } = await params;
      const res = await fetch(`/api/instructor/courses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa thất bại');
      router.push('/instructor/courses');
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/instructor/courses">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Chỉnh sửa khóa học</h1>
          <p className="text-slate-500 mt-1">Cập nhật thông tin khóa học của bạn.</p>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-200">
        <CardContent className="p-6 space-y-4">
          <div><label className="text-sm font-semibold text-slate-700 mb-1 block">Tiêu đề *</label><input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl" /></div>
          <div><label className="text-sm font-semibold text-slate-700 mb-1 block">Mô tả</label><textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl resize-none" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-semibold text-slate-700 mb-1 block">Danh mục *</label><select value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white"><option value="">Chọn danh mục</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
            <div><label className="text-sm font-semibold text-slate-700 mb-1 block">Hình ảnh</label><input value={form.image} onChange={(e) => setForm(f => ({ ...f, image: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-sm font-semibold text-slate-700 mb-1 block">Level</label><select value={form.level} onChange={(e) => setForm(f => ({ ...f, level: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white"><option value="BEGINNER">BEGINNER</option><option value="INTERMEDIATE">INTERMEDIATE</option><option value="ADVANCED">ADVANCED</option></select></div>
            <div><label className="text-sm font-semibold text-slate-700 mb-1 block">Loại</label><select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white"><option value="PAID">PAID</option><option value="FREE">FREE</option></select></div>
            <div><label className="text-sm font-semibold text-slate-700 mb-1 block">Giá</label><input type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl" /></div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Lưu thay đổi</Button>
            <Button onClick={remove} disabled={deleting} variant="outline" className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" />Xóa khóa học</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
