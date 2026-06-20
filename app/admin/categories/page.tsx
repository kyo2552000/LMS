'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    FolderOpen, Plus, Search, Edit2, Trash2, Loader2,
    Check, AlertCircle, X, BookOpen, Sparkles, Layers3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    course_count: number;
    created_at: string;
}

const COLOR_OPTIONS = [
    { value: 'bg-blue-500', label: 'Xanh dương' },
    { value: 'bg-purple-500', label: 'Tím' },
    { value: 'bg-pink-500', label: 'Hồng' },
    { value: 'bg-green-500', label: 'Xanh lá' },
    { value: 'bg-orange-500', label: 'Cam' },
    { value: 'bg-red-500', label: 'Đỏ' },
    { value: 'bg-indigo-500', label: 'Chàm' },
    { value: 'bg-amber-500', label: 'Vàng' },
    { value: 'bg-teal-500', label: 'Ngọc lam' },
];

const emptyForm = {
    id: '',
    name: '',
    slug: '',
    description: '',
    icon: '📁',
    color: 'bg-blue-500',
};

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [modal, setModal] = useState<'add' | 'edit' | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
    const totalCourses = categories.reduce((sum, cat) => sum + Number(cat.course_count || 0), 0);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/admin/categories?search=${encodeURIComponent(search)}&limit=100`);
        const data = await res.json();
        setCategories(data.rows || []);
        setLoading(false);
    }, [search]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const openAdd = () => { setForm(emptyForm); setModal('add'); };
    const openEdit = (cat: Category) => {
        setForm({ id: cat.id, name: cat.name, slug: cat.slug || '', description: cat.description || '', icon: cat.icon, color: cat.color });
        setModal('edit');
    };

    const handleSave = async () => {
        if (!form.name.trim()) return setMessage({ type: 'error', text: 'Tên danh mục là bắt buộc' });
        setSaving(true);
        try {
            const method = modal === 'add' ? 'POST' : 'PUT';
            const res = await fetch('/api/admin/categories', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: modal === 'add' ? 'Tạo danh mục thành công!' : 'Cập nhật thành công!' });
            setModal(null);
            fetchCategories();
        } catch (e: unknown) {
            setMessage({ type: 'error', text: (e as { message?: string }).message || 'Lỗi không xác định' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deleteConfirm.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: 'Xóa danh mục thành công!' });
            setDeleteConfirm(null);
            fetchCategories();
        } catch (e: unknown) {
            setMessage({ type: 'error', text: (e as { message?: string }).message || 'Lỗi không xác định' });
            setDeleteConfirm(null);
        }
    };

    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setForm(f => ({ ...f, name, slug }));
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Danh Mục</h1>
                    <p className="text-slate-500 mt-1">{categories.length} danh mục khóa học • {totalCourses} khóa học đang được phân loại</p>
                </div>
                <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm danh mục
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng danh mục</p>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">{categories.length}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <FolderOpen className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng khóa học</p>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">{totalCourses}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Layers3 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nổi bật</p>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">{categories.filter(c => Number(c.course_count || 0) > 0).length}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <Sparkles className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6">
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        placeholder="Tìm kiếm danh mục..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map(cat => (
                        <Card key={cat.id} className="rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group bg-white">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded border flex items-center justify-center text-2xl ${cat.color} bg-opacity-20 border-slate-200`}>
                                        {cat.icon}
                                    </div>
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="ghost" onClick={() => openEdit(cat)} className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 cursor-pointer" title="Chỉnh sửa">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(cat)} className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 cursor-pointer" title="Xóa bỏ">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1">{cat.name}</h3>
                                {cat.description ? (
                                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px]">{cat.description}</p>
                                ) : (
                                    <div className="min-h-[32px] mb-4"></div>
                                )}
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-4 border-t border-slate-100 font-medium">
                                    <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                                    <span>{cat.course_count} khóa học</span>
                                    {cat.slug && <span className="ml-auto font-mono text-[10px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">/{cat.slug}</span>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {categories.length === 0 && (
                        <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-24 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                            <FolderOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-sm font-medium">Chưa có danh mục nào</p>
                        </div>
                    )}
                </div>
            )}

            {modal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-xl bg-white rounded-xl shadow-2xl border-0 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {modal === 'add' ? <Plus className="h-5 w-5 text-indigo-600" /> : <Edit2 className="h-5 w-5 text-indigo-600" />}
                                {modal === 'add' ? 'Thêm mới danh mục' : 'Chỉnh sửa danh mục'}
                            </h3>
                            <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Tên danh mục *</label>
                                <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Tên danh mục..." className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Slug</label>
                                <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white focus-within:ring-1 focus-within:ring-indigo-500">
                                    <span className="px-3 py-2 bg-slate-50 text-slate-400 text-sm border-r border-slate-300">/</span>
                                    <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="ten-danh-muc" className="flex-1 px-3 py-2 text-sm focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Mô tả chi tiết</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" placeholder="Nhập mô tả cho danh mục khóa học..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Biểu tượng (Emoji)</label>
                                    <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="📁" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 text-2xl" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Màu sắc chủ đạo</label>
                                    <div className="flex gap-2 flex-wrap pt-1">
                                        {COLOR_OPTIONS.map(c => (
                                            <button key={c.value} onClick={() => setForm(f => ({ ...f, color: c.value }))} title={c.label}
                                                className={`w-7 h-7 rounded-full cursor-pointer ${c.value} ring-2 transition-all ${form.color === c.value ? 'ring-slate-900 scale-110 shadow-md' : 'ring-transparent hover:scale-110'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <Button variant="outline" onClick={() => setModal(null)} className="border-slate-300 text-slate-700 cursor-pointer">
                                Hủy bỏ
                            </Button>
                            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer w-32">
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Lưu thay đổi'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm bg-white rounded-xl shadow-2xl border-0 overflow-hidden p-6">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 className="h-8 w-8 text-red-500" /></div>
                        <h3 className="text-center text-xl font-bold text-slate-900 mb-2">Xóa danh mục</h3>
                        <p className="text-center text-sm text-slate-500 mb-8">Bạn có chắc chắn muốn xóa danh mục <span className="font-bold text-slate-900">{deleteConfirm.name}</span>? Hành động này không thể hoàn tác.</p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 border-slate-300 text-slate-700 cursor-pointer">Hủy</Button>
                            <Button onClick={handleDelete} className="flex-1 bg-red-600 text-white hover:bg-red-700 cursor-pointer">Xóa vĩnh viễn</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
