'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Loader2, AlertCircle, Check, X, Save, Image as ImageIcon, Plus } from 'lucide-react';
import Pagination from '@/components/Pagination';
import Image from 'next/image';

interface Column {
    COLUMN_NAME: string;
    DATA_TYPE: string;
    IS_NULLABLE: string;
    COLUMN_KEY: string;
}

export default function AdminCoursesPage() {
    const table = 'courses';
    const [rows, setRows] = useState<Record<string, unknown>[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

    // Modal state for Edit & Create
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editData, setEditData] = useState<Record<string, unknown>>({});

    const limit = 15;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/${table}?page=${page}&limit=${limit}`);
            const data = await res.json();
            setRows(data.rows || []);
            setColumns(data.columns || []);
            setTotal(data.total || 0);
        } catch {
            setMessage({ type: 'error', text: 'Lỗi khi tải danh sách khóa học' });
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchData();
        // Fetch categories list
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                setCategories(data);
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
        if (!confirm('Bạn có chắc chắn muốn xóa khóa học này?')) return;
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
        } catch (err: unknown) {
            const e = err as { message?: string };
            setMessage({ type: 'error', text: e.message || 'Xóa khóa học thất bại' });
        }
    };

    const startEdit = (row: Record<string, unknown>) => {
        setIsCreating(false);
        setEditingId(row.id as string);
        setEditData({ ...row });
    };

    const startCreate = () => {
        setEditingId(null);
        setIsCreating(true);
        setEditData({ level: 'BEGINNER', published: 0, category_id: categories.length > 0 ? categories[0].id : '' });
    };

    const cancelModal = () => {
        setEditingId(null);
        setIsCreating(false);
        setEditData({});
    };

    const saveChanges = async () => {
        const filteredData = { ...editData };
        delete filteredData.id;
        delete filteredData.created_at;
        delete filteredData.updated_at;

        // Common API fetch function logic
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
        } catch (err: unknown) {
            const e = err as { message?: string };
            setMessage({ type: 'error', text: e.message || 'Lỗi khi lưu khóa học' });
        }
    };

    const totalPages = Math.ceil(total / limit);
    const displayCols = columns.filter(
        (c) => !['password', 'content', 'video_url', 'instructor_id'].includes(c.COLUMN_NAME)
    );

    const getLevelBadge = (level: string) => {
        const styles: Record<string, string> = {
            BEGINNER: 'bg-green-100 text-green-700',
            INTERMEDIATE: 'bg-blue-100 text-blue-700',
            ADVANCED: 'bg-red-100 text-red-700',
        };
        return styles[level] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Khóa Học</h1>
                    <p className="text-gray-500 mt-1">{total} khóa học trong cơ sở dữ liệu</p>
                </div>
                <Button onClick={startCreate} className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Khóa Học
                </Button>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`mb-4 p-3 rounded-lg flex items-center space-x-2 text-sm ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                >
                    {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Edit / Create Modal */}
            {(editingId || isCreating) && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center space-x-2">
                                    {isCreating ? <Plus className="h-5 w-5 text-blue-500" /> : <Edit className="h-5 w-5 text-blue-500" />}
                                    <span>{isCreating ? 'Thêm Khóa Học' : 'Chỉnh Sửa Khóa Học'}</span>
                                </h3>
                                <button onClick={cancelModal} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                {displayCols.map((col) => {
                                    if (col.COLUMN_NAME === 'id' || col.COLUMN_NAME === 'created_at' || col.COLUMN_NAME === 'updated_at') return null;
                                    const isTextarea = col.COLUMN_NAME === 'description';
                                    return (
                                        <div key={col.COLUMN_NAME} className={`space-y-1.5 ${isTextarea ? 'col-span-1 sm:col-span-2' : ''}`}>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{col.COLUMN_NAME}</label>
                                            {isTextarea ? (
                                                <textarea
                                                    value={String(editData[col.COLUMN_NAME] ?? '')}
                                                    onChange={(e) => setEditData({ ...editData, [col.COLUMN_NAME]: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                                />
                                            ) : col.COLUMN_NAME === 'level' ? (
                                                <select
                                                    value={String(editData[col.COLUMN_NAME] || 'BEGINNER')}
                                                    onChange={(e) => setEditData({ ...editData, [col.COLUMN_NAME]: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                >
                                                    <option value="BEGINNER">Mới bắt đầu</option>
                                                    <option value="INTERMEDIATE">Trung cấp</option>
                                                    <option value="ADVANCED">Nâng cao</option>
                                                </select>
                                            ) : col.COLUMN_NAME === 'published' ? (
                                                <select
                                                    value={editData[col.COLUMN_NAME] ? '1' : '0'}
                                                    onChange={(e) => setEditData({ ...editData, [col.COLUMN_NAME]: e.target.value === '1' ? 1 : 0 })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                >
                                                    <option value="0">Bản nháp</option>
                                                    <option value="1">Công khai</option>
                                                </select>
                                            ) : col.COLUMN_NAME === 'category_id' ? (
                                                <select
                                                    value={String(editData[col.COLUMN_NAME] || '')}
                                                    onChange={(e) => setEditData({ ...editData, [col.COLUMN_NAME]: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                >
                                                    <option disabled value="">Chọn danh mục</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={String(editData[col.COLUMN_NAME] ?? '')}
                                                    onChange={(e) => setEditData({ ...editData, [col.COLUMN_NAME]: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    onClick={saveChanges}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                >
                                    <Save className="h-4 w-4 mr-2" /> {isCreating ? 'Thêm khóa học' : 'Lưu thay đổi'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={cancelModal}
                                    className="cursor-pointer"
                                >
                                    Hủy
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Table */}
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Khóa học</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Giá</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Cấp độ</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Trạng thái</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Thống kê</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 text-xs uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id as string} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                                        {row.image ? (
                                                            <Image src={String(row.image)} alt="Course" fill className="object-cover" />
                                                        ) : (
                                                            <ImageIcon className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-900 line-clamp-1">{String(row.title)}</span>
                                                        <span className="text-xs text-gray-500 mt-0.5 line-clamp-1 truncate max-w-[200px]">{String(row.description)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-blue-600">${String(row.price)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider ${getLevelBadge(String(row.level))}`}>
                                                    {String(row.level || 'Unknown')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 inline-flex rounded-full text-xs font-medium ${row.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {row.published ? 'Đã xuất bản' : 'Bản nháp'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs text-gray-500">
                                                    <div>{Number(row.students || 0)} học viên</div>
                                                    <div>{Number(row.rating || 0).toFixed(1)} đánh giá</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => startEdit(row)}
                                                        className="h-7 px-2 text-blue-600 hover:bg-blue-50 cursor-pointer"
                                                        title="Sửa khóa học"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteCourse(row.id as string)}
                                                        className="h-7 px-2 text-red-500 hover:bg-red-50 cursor-pointer"
                                                        title="Xóa khóa học"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {rows.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-gray-400">Không tìm thấy khóa học</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
                </CardContent>
            </Card>
        </div>
    );
}
