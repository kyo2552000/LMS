'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Loader2, AlertCircle, Check, X, Save, Plus, PlayCircle, FileText, CheckSquare, ClipboardList } from 'lucide-react';
import Pagination from '@/components/Pagination';

interface Column {
    COLUMN_NAME: string;
    DATA_TYPE: string;
    IS_NULLABLE: string;
    COLUMN_KEY: string;
}

export default function AdminLessonsPage() {
    const table = 'lessons';
    const [rows, setRows] = useState<Record<string, unknown>[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);

    // Modal state for Edit & Create
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editData, setEditData] = useState<Record<string, unknown>>({});
    const [isUploading, setIsUploading] = useState(false);

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
            setMessage({ type: 'error', text: 'Lỗi khi tải bài học' });
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchData();
        // Fetch courses list
        const fetchCourses = async () => {
            try {
                // Fetch up to 500 courses for dropdown
                const res = await fetch('/api/admin/courses?limit=500');
                const data = await res.json();
                if (data.rows) {
                    setCourses(data.rows.map((r: any) => ({ id: r.id, title: r.title })));
                }
            } catch (err) {
                console.error('Lỗi khi tải danh sách khóa học:', err);
            }
        };
        fetchCourses();
    }, [fetchData]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const deleteLesson = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài học này?')) return;
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
            setMessage({ type: 'success', text: 'Bài học đã được xóa!' });
            fetchData();
        } catch (err: unknown) {
            const e = err as { message?: string };
            setMessage({ type: 'error', text: e.message || 'Xóa thất bại' });
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
        setEditData({
            type: 'VIDEO',
            sort_order: 0,
            course_id: courses.length > 0 ? courses[0].id : ''
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                const htmlLink = `\n\n<p><a href="${data.url}" target="_blank" class="text-blue-600 underline hover:text-blue-800 font-medium flex items-center gap-1 mt-4">📥 Download Attached File: ${data.name}</a></p>`;
                setEditData(prev => ({
                    ...prev,
                    content: (prev.content || '') + htmlLink
                }));
                setMessage({ type: 'success', text: `File ${data.name} đã được tải lên thành công!` });
            } else {
                setMessage({ type: 'error', text: "Lỗi khi tải file" + data.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Lỗi khi tải file" });
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
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

        // Ensure sort_order is a valid number, not empty string
        if (filteredData.sort_order === '' || filteredData.sort_order === null || filteredData.sort_order === undefined) {
            filteredData.sort_order = 0;
        } else {
            filteredData.sort_order = parseInt(String(filteredData.sort_order), 10) || 0;
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

            setMessage({ type: 'success', text: isCreating ? 'Bài học đã được tạo thành công!' : 'Bài học đã được cập nhật thành công!' });
            cancelModal();
            fetchData();
        } catch (err: unknown) {
            const e = err as { message?: string };
            setMessage({ type: 'error', text: e.message || 'Lỗi khi lưu' });
        }
    };

    const totalPages = Math.ceil(total / limit);

    // Filter columns for form
    const displayCols = columns.filter((c) => !['password'].includes(c.COLUMN_NAME));

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'VIDEO': return <PlayCircle className="h-4 w-4 text-blue-500 mr-2" />;
            case 'TEXT': return <FileText className="h-4 w-4 text-gray-500 mr-2" />;
            case 'QUIZ': return <CheckSquare className="h-4 w-4 text-purple-500 mr-2" />;
            case 'ASSIGNMENT': return <ClipboardList className="h-4 w-4 text-orange-500 mr-2" />;
            default: return <PlayCircle className="h-4 w-4 text-blue-500 mr-2" />;
        }
    };

    const getCourseTitle = (courseId: string) => {
        const c = courses.find(course => course.id === courseId);
        return c ? c.title : 'Khóa học không xác định';
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Bài học</h1>
                    <p className="text-gray-500 mt-1">{total} bài học trong cơ sở dữ liệu</p>
                </div>
                <Button onClick={startCreate} className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo bài học
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
                                    <span>{isCreating ? 'Tạo bài học' : 'Cập nhật bài học'}</span>
                                </h3>
                                <button onClick={cancelModal} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                {displayCols.map((col) => {
                                    if (col.COLUMN_NAME === 'id' || col.COLUMN_NAME === 'created_at' || col.COLUMN_NAME === 'updated_at') return null;
                                    if (col.COLUMN_NAME === 'video_url' && editData.type !== 'VIDEO') return null;

                                    const isTextarea = col.COLUMN_NAME === 'content' || col.COLUMN_NAME === 'video_url';
                                    return (
                                        <div key={col.COLUMN_NAME} className={`space-y-1.5 ${isTextarea ? 'col-span-1 sm:col-span-2' : ''}`}>
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{col.COLUMN_NAME}</label>

                                            {col.COLUMN_NAME === 'content' ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={String(editData[col.COLUMN_NAME] ?? '')}
                                                        onChange={(e) => setEditData({ ...editData, [col.COLUMN_NAME]: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                                                        placeholder="Nhập nội dung văn bản hoặc HTML cho TEXT. Không bắt buộc đối với loại VIDEO."
                                                    />
                                                    {editData.type === 'TEXT' && (
                                                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                            <div>
                                                                <p className="text-xs font-semibold text-blue-800">Tải lên tài liệu</p>
                                                                <p className="text-[10px] text-blue-600 mt-0.5">File sẽ được thêm dưới dạng liên kết tải xuống bên trong nội dung văn bản.</p>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <input
                                                                    type="file"
                                                                    onChange={handleFileUpload}
                                                                    disabled={isUploading}
                                                                    className="text-xs file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-50 w-[200px]"
                                                                />
                                                                {isUploading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : col.COLUMN_NAME === 'type' ? (
                                                <select
                                                    value={String(editData[col.COLUMN_NAME] || 'VIDEO')}
                                                    onChange={(e) => setEditData({ ...editData, [col.COLUMN_NAME]: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                >
                                                    <option value="VIDEO">VIDEO</option>
                                                    <option value="TEXT">VĂN BẢN</option>
                                                    <option value="QUIZ">TRẮC NGHIỆM</option>
                                                    <option value="ASSIGNMENT">BÀI TẬP</option>
                                                </select>
                                            ) : col.COLUMN_NAME === 'course_id' ? (
                                                <select
                                                    value={String(editData[col.COLUMN_NAME] || '')}
                                                    onChange={(e) => setEditData({ ...editData, [col.COLUMN_NAME]: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                >
                                                    <option disabled value="">Chọn khóa học</option>
                                                    {courses.map((course) => (
                                                        <option key={course.id} value={course.id}>{course.title}</option>
                                                    ))}
                                                </select>
                                            ) : isTextarea ? (
                                                <input
                                                    type="text"
                                                    value={String(editData[col.COLUMN_NAME] ?? '')}
                                                    onChange={(e) => setEditData({ ...editData, [col.COLUMN_NAME]: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : (
                                                <input
                                                    type={col.COLUMN_NAME === 'sort_order' ? 'number' : 'text'}
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
                                    <Save className="h-4 w-4 mr-2" /> {isCreating ? 'Tạo bài học' : 'Lưu thay đổi'}
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
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase w-20">Thứ tự</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Tiêu đề & Loại</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase w-48">Khóa học</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Thời lượng</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 text-xs uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id as string} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-gray-900 bg-gray-100 rounded-md px-2 py-1 text-xs">
                                                    {String(row.sort_order || '0')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    {getTypeIcon(String(row.type))}
                                                    <div>
                                                        <span className="font-medium text-gray-900 line-clamp-1">{String(row.title)}</span>
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider">{String(row.type)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-medium text-blue-600 line-clamp-2">
                                                    {getCourseTitle(String(row.course_id))}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {String(row.duration || '—')}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => startEdit(row)}
                                                        className="h-7 px-2 text-blue-600 hover:bg-blue-50 cursor-pointer"
                                                        title="Sửa bài học"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteLesson(row.id as string)}
                                                        className="h-7 px-2 text-red-500 hover:bg-red-50 cursor-pointer"
                                                        title="Xóa bài học"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {rows.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-gray-400">Không tìm thấy bài học</td>
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
