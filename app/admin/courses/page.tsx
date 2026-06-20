'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Loader2, AlertCircle, Check, X, Save, Plus, Search, BookOpen, Star, Users, CheckCircle2, ListVideo, ImageIcon, Clock, Sparkles } from 'lucide-react';
import Pagination from '@/components/Pagination';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminCoursesPage() {
    const table = 'courses';
    const [rows, setRows] = useState<Record<string, any>[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    
    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

    // Modal state for Edit & Create
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editData, setEditData] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);

    const limit = 15;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/${table}?page=1&limit=500`);
            const data = await res.json();
            setRows(data.rows || []);
            setTotal(data.total || 0);
        } catch {
            setMessage({ type: 'error', text: 'Lỗi khi tải danh sách khóa học' });
        } finally {
            setLoading(false);
        }
    }, [table]);

    useEffect(() => {
        fetchData();
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                setCategories(data.categories || (Array.isArray(data) ? data : []));
            } catch (err) {
                console.error('Lỗi khi tải danh sách danh mục', err);
            }
        };
        fetchCategories();
    }, [fetchData]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const deleteCourse = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa khóa học này? Lưu ý: Hành động này không thể hoàn tác và sẽ xóa cả bài giảng bên trong.')) return;
        try {
            const res = await fetch(`/api/admin/${table}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            setMessage({ type: 'success', text: 'Xóa khóa học thành công!' });
            fetchData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Xóa khóa học thất bại' });
        }
    };

    const startEdit = (row: Record<string, any>) => {
        setIsCreating(false);
        setEditingId(row.id as string);
        setEditData({ ...row });
    };

    const startCreate = () => {
        setEditingId(null);
        setIsCreating(true);
        setEditData({ 
            type: 'PAID', 
            level: 'BEGINNER', 
            published: 0, 
            price: 0, 
            title: '',
            description: '',
            slug: '',
            image: '',
            category_id: categories.length > 0 ? categories[0].id : '' 
        });
    };

    const cancelModal = () => {
        setEditingId(null);
        setIsCreating(false);
        setEditData({});
    };

    const saveChanges = async () => {
        if (!editData.title || !editData.category_id) {
            setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ tiêu đề và danh mục.' });
            return;
        }

        setSaving(true);
        const filteredData = { ...editData };
        delete filteredData.id;
        delete filteredData.created_at;
        delete filteredData.updated_at;

        if (!filteredData.slug && filteredData.title) {
            filteredData.slug = String(filteredData.title).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }

        try {
            const res = await fetch(`/api/admin/${table}`, {
                method: isCreating ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isCreating ? { data: filteredData } : { id: editingId, data: filteredData }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }

            setMessage({ type: 'success', text: isCreating ? 'Khóa học đã được thêm thành công!' : 'Khóa học đã được cập nhật thành công!' });
            cancelModal();
            fetchData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Lỗi khi lưu khóa học' });
        } finally {
            setSaving(false);
        }
    };

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const matchesSearch = row.title?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab = 
                activeTab === 'ALL' ? true :
                activeTab === 'PUBLISHED' ? Boolean(row.published) === true :
                activeTab === 'DRAFT' ? Boolean(row.published) === false : true;
            return matchesSearch && matchesTab;
        });
    }, [rows, searchQuery, activeTab]);

    const totalPages = Math.ceil(filteredRows.length / limit);
    const paginatedRows = filteredRows.slice((page - 1) * limit, page * limit);
    const publishedCount = rows.filter(r => Boolean(r.published)).length;
    const draftCount = rows.filter(r => !Boolean(r.published)).length;
    const freeCount = rows.filter(r => r.type === 'FREE').length;
    const paidCount = rows.filter(r => r.type === 'PAID').length;

    const getLevelBadge = (level: string) => {
        const styles: Record<string, string> = {
            BEGINNER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            INTERMEDIATE: 'bg-blue-50 text-blue-700 border-blue-200',
            ADVANCED: 'bg-purple-50 text-purple-700 border-purple-200',
        };
        const labels: Record<string, string> = {
            BEGINNER: 'Cơ bản',
            INTERMEDIATE: 'Trung cấp',
            ADVANCED: 'Nâng cao',
        };
        return <span className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${styles[level] || 'bg-slate-100 text-slate-700'}`}>{labels[level] || level}</span>;
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Khóa Học</h1>
                    <p className="text-slate-500 mt-1">{rows.length} khóa học trong hệ thống</p>
                </div>
                <Button onClick={startCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm khóa học mới
                </Button>
            </div>

            {/* Thống kê đơn giản */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng khóa học</p>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">{rows.length}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <BookOpen className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đã xuất bản</p>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">{publishedCount}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bản nháp</p>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">{draftCount}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Miễn phí</p>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">{freeCount}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Sparkles className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trả phí</p>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">{paidCount}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
                            <Clock className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm font-medium ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex space-x-2">
                    {([
                        { id: 'ALL', label: 'Tất cả' },
                        { id: 'PUBLISHED', label: 'Đã xuất bản' },
                        { id: 'DRAFT', label: 'Bản nháp' },
                    ] as const).map((tab) => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? 'default' : 'outline'}
                            onClick={() => { setActiveTab(tab.id); setPage(1); }}
                            className={`h-9 text-sm rounded-lg ${activeTab === tab.id ? 'bg-slate-800 hover:bg-slate-900' : 'text-slate-600'}`}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>
                
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm khóa học..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                </div>
            </div>

            {/* List Table */}
            <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Khóa học</th>
                                        <th className="px-6 py-4">Tương tác</th>
                                        <th className="px-6 py-4">Phân loại / Giá</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {paginatedRows.length > 0 ? paginatedRows.map((row) => (
                                        <tr key={row.id as string} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-12 w-20 rounded border border-slate-200 bg-slate-100 flex-shrink-0 overflow-hidden">
                                                        {row.image ? (
                                                            <Image src={row.image} alt={row.title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <ImageIcon className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 line-clamp-1 max-w-[250px]">{row.title}</p>
                                                        <p className="text-[11px] text-slate-500 mt-1">Danh mục: {categories.find(c => c.id === row.category_id)?.name || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-xs space-y-1">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-amber-500" /> {Number(row.rating || 0).toFixed(1)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5 text-blue-500" /> {row.students || 0} học viên
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <div>{getLevelBadge(row.level || 'BEGINNER')}</div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold border ${row.type === 'FREE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                                                            {row.type === 'FREE' ? 'Miễn phí' : 'Trả phí'}
                                                        </span>
                                                    </div>
                                                    <div className="font-medium text-slate-900 mt-1">
                                                        {row.type === 'FREE' ? (
                                                            <span className="text-emerald-600 text-xs uppercase font-bold tracking-wide">Miễn phí</span>
                                                        ) : (
                                                            <span>{Number(row.price || 0).toLocaleString('vi-VN')} đ</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {Boolean(row.published) ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Xuất bản
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                        Bản nháp
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Link href={`/admin/courses/${row.id}/lessons`}>
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600" title="Bài giảng">
                                                            <ListVideo className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button size="sm" variant="ghost" onClick={() => startEdit(row)} className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600" title="Sửa">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => deleteCourse(row.id as string)} className="h-8 w-8 p-0 text-slate-500 hover:text-red-600" title="Xóa">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-500">
                                                Không tìm thấy khóa học nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {totalPages > 1 && (
                        <div className="border-t border-slate-200 p-4 bg-white">
                            <Pagination page={page} totalPages={totalPages} total={filteredRows.length} onPageChange={setPage} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit Modal */}
            {(editingId !== null || isCreating) && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border-0 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {isCreating ? <Plus className="h-5 w-5 text-indigo-600" /> : <Edit className="h-5 w-5 text-indigo-600" />}
                                {isCreating ? 'Thêm Khóa Học' : 'Chỉnh Sửa Khóa Học'}
                            </h3>
                            <button onClick={cancelModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cột trái */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Tên khóa học *</label>
                                        <input
                                            type="text"
                                            value={editData.title || ''}
                                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Đường dẫn (Slug)</label>
                                        <input
                                            type="text"
                                            value={editData.slug || ''}
                                            onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Danh mục *</label>
                                        <select
                                            value={editData.category_id || ''}
                                            onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value="" disabled>-- Chọn --</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Mô tả</label>
                                        <textarea
                                            value={editData.description || ''}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[120px]"
                                        />
                                    </div>
                                </div>

                                {/* Cột phải */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Ảnh bìa (URL)</label>
                                        {editData.image && (
                                            <div className="mb-2 relative h-32 w-full rounded border border-slate-200 overflow-hidden">
                                                <Image src={editData.image} alt="Preview" fill className="object-cover" />
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            value={editData.image || ''}
                                            onChange={(e) => setEditData({ ...editData, image: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Loại</label>
                                            <select
                                                value={editData.type || 'PAID'}
                                                onChange={(e) => setEditData({ ...editData, type: e.target.value, price: e.target.value === 'FREE' ? 0 : editData.price })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                            >
                                                <option value="PAID">Trả phí</option>
                                                <option value="FREE">Miễn phí</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Giá bán</label>
                                            <input
                                                type="number"
                                                disabled={editData.type === 'FREE'}
                                                value={editData.price || ''}
                                                onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Cấp độ</label>
                                        <select
                                            value={editData.level || 'BEGINNER'}
                                            onChange={(e) => setEditData({ ...editData, level: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value="BEGINNER">Cơ bản</option>
                                            <option value="INTERMEDIATE">Trung cấp</option>
                                            <option value="ADVANCED">Nâng cao</option>
                                        </select>
                                    </div>
                                    <div className="pt-2">
                                        <label className="flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={Boolean(editData.published)}
                                                onChange={(e) => setEditData({...editData, published: e.target.checked ? 1 : 0})}
                                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="ml-2 text-sm font-medium text-slate-700">Trạng thái xuất bản (Hiển thị cho học viên)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <Button onClick={cancelModal} variant="outline" className="border-slate-300 text-slate-700 cursor-pointer">
                                Hủy bỏ
                            </Button>
                            <Button onClick={saveChanges} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer w-32">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
