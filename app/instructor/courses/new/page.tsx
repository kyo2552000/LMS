'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Save, Sparkles } from 'lucide-react';

export default function InstructorCreateCoursePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
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
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data.categories || (Array.isArray(data) ? data : []));
      } catch {}
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.category_id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/instructor/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo khóa học thất bại');
      router.push(`/instructor/courses/${data.id}/lessons`);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/instructor/courses">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2"><Sparkles className="h-6 w-6 text-blue-500" /> Tạo khóa học mới</h1>
          <p className="text-slate-500 mt-1">Tạo khóa học riêng cho giảng viên.</p>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-200">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Tiêu đề *</label>
            <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl" placeholder="Nhập tiêu đề khóa học" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Mô tả</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl resize-none" placeholder="Mô tả ngắn về khóa học" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Danh mục *</label>
              <select value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
                <option value="">Chọn danh mục</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Hình ảnh</label>
              <input value={form.image} onChange={(e) => setForm(f => ({ ...f, image: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl" placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Level</label>
              <select value={form.level} onChange={(e) => setForm(f => ({ ...f, level: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Loại</label>
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
                <option value="PAID">PAID</option>
                <option value="FREE">FREE</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Giá</label>
              <input type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.category_id} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Tạo khóa học
            </Button>
            <Link href="/instructor/courses"><Button variant="outline">Hủy</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
