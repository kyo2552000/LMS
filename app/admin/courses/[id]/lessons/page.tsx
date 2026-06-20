'use client';

import { useEffect, useState, useCallback, use, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Loader2, AlertCircle, Check, X, Plus, ArrowLeft, Video, HelpCircle, FileText, Search, PlayCircle, AlignLeft, ClipboardList, Upload } from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import QuizBuilder from '@/components/QuizBuilder';

export default function AdminLessonsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: courseId } = use(params);
    const table = 'lessons';

    const [rows, setRows] = useState<Record<string, any>[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 15;
    const [loading, setLoading] = useState(true);
    const [courseName, setCourseName] = useState('Đang tải...');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [searchQuery, setSearchQuery] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editData, setEditData] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'video_url' | 'docx_url') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingField(field);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                setEditData(prev => ({ ...prev, [field]: data.url }));
                setMessage({ type: 'success', text: 'Tải file lên thành công!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Lỗi tải file' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Lỗi mạng khi tải file' });
        } finally {
            setUploadingField(null);
            e.target.value = '';
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [courseRes, lessonsRes] = await Promise.all([
                fetch(`/api/courses/${courseId}`),
                fetch(`/api/admin/${table}?course_id=${courseId}&page=1&limit=500`)
            ]);

            if (courseRes.ok) {
                const cData = await courseRes.json();
                setCourseName(cData.course?.title || cData.title || 'Khóa học');
            }

            if (lessonsRes.ok) {
                const lData = await lessonsRes.json();
                const sortedRows = (lData.rows || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
                setRows(sortedRows);
                setTotal(lData.total || 0);
            } else {
                setMessage({ type: 'error', text: 'Lỗi khi tải danh sách bài giảng' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Lỗi mạng khi tải bài giảng' });
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const deleteLesson = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài giảng này? Toàn bộ bình luận và tiến độ học viên của bài này sẽ bị mất!')) return;
        try {
            const res = await fetch(`/api/admin/${table}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error('Delete failed');

            setMessage({ type: 'success', text: 'Xóa bài giảng thành công!' });
            fetchData();
        } catch {
            setMessage({ type: 'error', text: 'Xóa bài giảng thất bại' });
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
            course_id: courseId,
            type: 'VIDEO',
            sort_order: rows.length + 1,
            duration: '00:00:00'
        });
    };

    const cancelModal = () => {
        setEditingId(null);
        setIsCreating(false);
        setEditData({});
    };

    const saveChanges = async () => {
        if (!editData.title || !(String(editData.title).trim())) {
            setMessage({ type: 'error', text: 'Tiêu đề không được để trống' });
            return;
        }

        setSaving(true);
        const filteredData = { ...editData };
        delete filteredData.id;
        delete filteredData.created_at;
        delete filteredData.updated_at;
        
        if (filteredData.sort_order) {
            filteredData.sort_order = parseInt(String(filteredData.sort_order), 10);
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

            setMessage({ type: 'success', text: isCreating ? 'Bài giảng đã được thêm!' : 'Bài giảng đã được cập nhật!' });
            cancelModal();
            fetchData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Lỗi khi lưu bài giảng' });
        } finally {
            setSaving(false);
        }
    };

    const filteredRows = useMemo(() => {
        return rows.filter((row) => 
            row.title?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [rows, searchQuery]);

    const totalPages = Math.ceil(filteredRows.length / limit);
    const paginatedRows = filteredRows.slice((page - 1) * limit, page * limit);

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'VIDEO': return <PlayCircle className="w-3.5 h-3.5" />;
            case 'TEXT': return <AlignLeft className="w-3.5 h-3.5" />;
            case 'QUIZ': return <HelpCircle className="w-3.5 h-3.5" />;
            case 'ASSIGNMENT': return <ClipboardList className="w-3.5 h-3.5" />;
            default: return <FileText className="w-3.5 h-3.5" />;
        }
    };

    const getTypeStyles = (type: string) => {
        switch(type) {
            case 'VIDEO': return 'bg-red-50 text-red-600 border-red-200';
            case 'TEXT': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'QUIZ': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'ASSIGNMENT': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/admin/courses">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full cursor-pointer">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold text-slate-500">Quản trị Khóa học</h1>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">{courseName}</h2>
                    <p className="text-slate-500 mt-1">{rows.length} bài giảng / tài liệu</p>
                </div>
                <Button onClick={startCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm bài giảng mới
                </Button>
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
                        type="text"
                        placeholder="Tìm kiếm bài giảng..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                </div>
            </div>

            <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                            <p>Đang tải nội dung bài giảng...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 w-20 text-center">Thứ tự</th>
                                        <th className="px-6 py-4">Bài giảng</th>
                                        <th className="px-6 py-4">Loại hình</th>
                                        <th className="px-6 py-4">Thời lượng</th>
                                        <th className="px-6 py-4 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedRows.map((row) => (
                                        <tr key={row.id as string} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-200 bg-slate-50 text-slate-600 font-bold">
                                                    {String(row.sort_order || 0)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-slate-900 block">{String(row.title)}</span>
                                                {row.type === 'VIDEO' && Boolean(row.video_url) && (
                                                    <span className="text-[11px] text-slate-400 mt-1 block truncate max-w-xs">{String(row.video_url)}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold border ${getTypeStyles(row.type)}`}>
                                                    {getTypeIcon(row.type)}
                                                    {String(row.type || 'VIDEO')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-600 font-medium">
                                                    {String(row.duration || '00:00:00')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Button size="sm" variant="ghost" onClick={() => startEdit(row)} className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 cursor-pointer" title="Sửa">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => deleteLesson(row.id as string)} className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 cursor-pointer" title="Xóa">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedRows.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-500">
                                                Không có bài giảng nào. Bấm "Thêm bài giảng mới" để bắt đầu.
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

            {/* Edit / Create Modal */}
            {(editingId !== null || isCreating) && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border-0 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {isCreating ? <Plus className="h-5 w-5 text-indigo-600" /> : <Edit className="h-5 w-5 text-indigo-600" />}
                                {isCreating ? 'Thêm Bài Giảng' : 'Cập Nhật Bài Giảng'}
                            </h3>
                            <button onClick={cancelModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
                                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Tiêu đề Bài Giảng *</label>
                                    <input
                                        type="text"
                                        value={String(editData.title || '')}
                                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Ví dụ: Bài 1: Nhập môn..."
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Thứ tự</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={String(editData.sort_order || 0)}
                                        onChange={(e) => setEditData({ ...editData, sort_order: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Loại bài giảng</label>
                                    <select
                                        value={editData.type || 'VIDEO'}
                                        onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="VIDEO">Video YouTube / Vimeo</option>
                                        <option value="TEXT">Văn bản / HTML</option>
                                        <option value="QUIZ">Trắc nghiệm</option>
                                        <option value="ASSIGNMENT">Bài tập lớn</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Thời lượng (Giờ : Phút : Giây)</label>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={(String(editData.duration || '00:00:00').split(':')[0] || '00').padStart(2, '0')}
                                            onChange={(e) => {
                                                const parts = String(editData.duration || '00:00:00').split(':');
                                                const min = parts.length > 1 ? parts[1] : '00';
                                                const sec = parts.length > 2 ? parts[2] : '00';
                                                setEditData({ ...editData, duration: `${e.target.value}:${min}:${sec}` });
                                            }}
                                            className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm bg-white"
                                        >
                                            {Array.from({ length: 24 }).map((_, i) => (
                                                <option key={`h-${i}`} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <span className="font-bold text-slate-400">:</span>
                                        <select
                                            value={(String(editData.duration || '00:00:00').split(':')[1] || '00').padStart(2, '0')}
                                            onChange={(e) => {
                                                const parts = String(editData.duration || '00:00:00').split(':');
                                                const hr = parts[0] || '00';
                                                const sec = parts.length > 2 ? parts[2] : '00';
                                                setEditData({ ...editData, duration: `${hr}:${e.target.value}:${sec}` });
                                            }}
                                            className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm bg-white"
                                        >
                                            {Array.from({ length: 60 }).map((_, i) => (
                                                <option key={`m-${i}`} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <span className="font-bold text-slate-400">:</span>
                                        <select
                                            value={(String(editData.duration || '00:00:00').split(':')[2] || '00').padStart(2, '0')}
                                            onChange={(e) => {
                                                const parts = String(editData.duration || '00:00:00').split(':');
                                                const hr = parts[0] || '00';
                                                const min = parts.length > 1 ? parts[1] : '00';
                                                setEditData({ ...editData, duration: `${hr}:${min}:${e.target.value}` });
                                            }}
                                            className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm bg-white"
                                        >
                                            {Array.from({ length: 60 }).map((_, i) => (
                                                <option key={`s-${i}`} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {editData.type === 'VIDEO' && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">
                                        Đường dẫn Video (URL Embed) hoặc Tải lên *
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={String(editData.video_url || '')}
                                            onChange={(e) => setEditData({ ...editData, video_url: e.target.value })}
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="https://www.youtube.com/embed/..."
                                        />
                                        <div className="relative shrink-0">
                                            <input 
                                                type="file" 
                                                accept="video/*" 
                                                onChange={(e) => uploadFile(e, 'video_url')}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                title="Tải video lên"
                                                disabled={uploadingField === 'video_url'}
                                            />
                                            <Button disabled={uploadingField === 'video_url'} variant="outline" className="cursor-pointer bg-slate-100 hover:bg-slate-200 border-slate-300">
                                                {uploadingField === 'video_url' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                                {uploadingField === 'video_url' ? 'Đang tải...' : 'Tải Video Lên'}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">Sử dụng định dạng embed của YouTube hoặc tải lên video (Tối đa 500MB).</p>
                                </div>
                            )}

                            {editData.type === 'QUIZ' ? (
                                <div className="border border-slate-300 rounded-md overflow-hidden">
                                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-300">
                                        <label className="text-xs font-semibold text-slate-700 uppercase">Soạn bộ câu hỏi trắc nghiệm</label>
                                    </div>
                                    <div className="p-3 max-h-[300px] overflow-y-auto">
                                        <QuizBuilder
                                            value={String(editData.content || '')}
                                            onChange={(val: string) => setEditData({ ...editData, content: val })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(editData.type === 'TEXT' || editData.type === 'ASSIGNMENT') && (
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">
                                                Tài liệu đính kèm (DOCX, PDF, PPTX...)
                                            </label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={String(editData.docx_url || '')}
                                                    readOnly
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 focus:outline-none"
                                                    placeholder="Tự động điền khi tải file lên..."
                                                />
                                                <div className="relative shrink-0">
                                                    <input 
                                                        type="file" 
                                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                        onChange={(e) => uploadFile(e, 'docx_url')}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        title="Tải tài liệu lên"
                                                        disabled={uploadingField === 'docx_url'}
                                                    />
                                                    <Button disabled={uploadingField === 'docx_url'} variant="outline" className="cursor-pointer bg-slate-100 hover:bg-slate-200 border-slate-300">
                                                        {uploadingField === 'docx_url' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                                        {uploadingField === 'docx_url' ? 'Đang tải...' : 'Tải Tài Liệu'}
                                                    </Button>
                                                </div>
                                                {editData.docx_url && (
                                                    <Button onClick={() => setEditData({ ...editData, docx_url: '' })} variant="ghost" className="text-red-500 hover:text-red-600 px-2 cursor-pointer">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">
                                            Nội dung / Mô tả (Tùy chọn)
                                        </label>
                                        <textarea
                                            value={String(editData.content || '')}
                                            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[140px]"
                                        />
                                    </div>
                                </div>
                            )}
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
