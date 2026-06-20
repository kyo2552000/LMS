'use client';

import { useEffect, useState, useCallback, use, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Loader2, AlertCircle, Check, X, Plus, ArrowLeft, HelpCircle, FileText, Search, PlayCircle, AlignLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import QuizBuilder from '@/components/QuizBuilder';

export default function InstructorLessonsPage({ params }: { params: Promise<{ id: string }> }) {
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
        } catch {
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
                fetch(`/api/instructor/lessons?course_id=${courseId}&page=1&limit=500`)
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

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t); } }, [message]);

    const startEdit = (row: Record<string, any>) => { setIsCreating(false); setEditingId(row.id as string); setEditData({ ...row }); };
    const startCreate = () => { setEditingId(null); setIsCreating(true); setEditData({ course_id: courseId, type: 'VIDEO', sort_order: rows.length + 1, duration: '00:00:00' }); };
    const cancelModal = () => { setEditingId(null); setIsCreating(false); setEditData({}); };

    const saveChanges = async () => {
        if (!editData.title || !(String(editData.title).trim())) return setMessage({ type: 'error', text: 'Tiêu đề không được để trống' });
        setSaving(true);
        const filteredData = { ...editData };
        delete filteredData.id; delete filteredData.created_at; delete filteredData.updated_at;
        if (filteredData.sort_order) filteredData.sort_order = parseInt(String(filteredData.sort_order), 10);
        try {
            const res = await fetch(`/api/instructor/lessons`, {
                method: isCreating ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isCreating ? { data: filteredData } : { id: editingId, data: filteredData }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            setMessage({ type: 'success', text: isCreating ? 'Bài giảng đã được thêm!' : 'Bài giảng đã được cập nhật!' });
            cancelModal(); fetchData();
        } catch (err: any) { setMessage({ type: 'error', text: err.message || 'Lỗi khi lưu bài giảng' }); }
        finally { setSaving(false); }
    };

    const deleteLesson = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài giảng này? Toàn bộ bình luận và tiến độ học viên của bài này sẽ bị mất!')) return;
        try {
            const res = await fetch(`/api/instructor/lessons/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            setMessage({ type: 'success', text: 'Xóa bài giảng thành công!' });
            fetchData();
        } catch { setMessage({ type: 'error', text: 'Xóa bài giảng thất bại' }); }
    };

    const filteredRows = useMemo(() => rows.filter(row => row.title?.toLowerCase().includes(searchQuery.toLowerCase())), [rows, searchQuery]);
    const totalPages = Math.ceil(filteredRows.length / limit);
    const paginatedRows = filteredRows.slice((page - 1) * limit, page * limit);

    const getTypeIcon = (type: string) => { switch(type) { case 'VIDEO': return <PlayCircle className="w-3.5 h-3.5" />; case 'TEXT': return <AlignLeft className="w-3.5 h-3.5" />; case 'QUIZ': return <HelpCircle className="w-3.5 h-3.5" />; case 'ASSIGNMENT': return <ClipboardList className="w-3.5 h-3.5" />; default: return <FileText className="w-3.5 h-3.5" />; } };
    const getTypeStyles = (type: string) => { switch(type) { case 'VIDEO': return 'bg-red-50 text-red-600 border-red-200'; case 'TEXT': return 'bg-blue-50 text-blue-600 border-blue-200'; case 'QUIZ': return 'bg-amber-50 text-amber-600 border-amber-200'; case 'ASSIGNMENT': return 'bg-emerald-50 text-emerald-600 border-emerald-200'; default: return 'bg-gray-50 text-gray-600 border-gray-200'; } };

    return (
        <div className="p-8">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/instructor/courses">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full cursor-pointer">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold text-slate-500">Giảng viên / Khóa học</h1>
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

            {message && <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}<span>{message.text}</span></div>}

            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6">
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400" /></div>
                    <input type="text" placeholder="Tìm kiếm bài giảng..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                </div>
            </div>

            <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    {loading ? <div className="flex flex-col items-center justify-center py-20 text-slate-500"><Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" /><p>Đang tải nội dung bài giảng...</p></div> : <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200"><tr><th className="px-6 py-4 w-20 text-center">Thứ tự</th><th className="px-6 py-4">Bài giảng</th><th className="px-6 py-4">Loại hình</th><th className="px-6 py-4">Thời lượng</th><th className="px-6 py-4 text-right">Hành động</th></tr></thead><tbody className="divide-y divide-slate-200">{paginatedRows.length > 0 ? paginatedRows.map((row) => (<tr key={row.id} className="hover:bg-slate-50 transition-colors group"><td className="px-6 py-4 text-center font-bold text-slate-400">{row.sort_order || 0}</td><td className="px-6 py-4"><div className="font-medium text-slate-900">{row.title}</div><div className="text-xs text-slate-500 mt-1 line-clamp-2">{row.description}</div></td><td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getTypeStyles(row.type)}`}>{getTypeIcon(row.type)}{row.type}</span></td><td className="px-6 py-4 text-slate-500">{row.duration || '-'}</td><td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><button onClick={() => startEdit(row)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit className="h-4 w-4" /></button><button onClick={() => deleteLesson(row.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button></div></td></tr>)) : <tr><td colSpan={5} className="py-16 text-center text-slate-400">Chưa có bài giảng nào.</td></tr>}</tbody></table></div>}
                    {totalPages > 1 && <div className="border-t border-slate-200 p-4 bg-white"><Pagination page={page} totalPages={totalPages} total={filteredRows.length} onPageChange={setPage} /></div>}
                </CardContent>
            </Card>

            { (editingId || isCreating) && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-900">{isCreating ? 'Tạo bài giảng mới' : 'Chỉnh sửa bài giảng'}</h2><button onClick={cancelModal} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button></div>
                        <div className="p-6 space-y-4">
                            <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Tiêu đề *</label><input value={editData.title || ''} onChange={e => setEditData(f => ({ ...f, title: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm" /></div>
                            <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Mô tả</label><textarea value={editData.description || ''} onChange={e => setEditData(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm resize-none" /></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Loại</label><select value={editData.type || 'VIDEO'} onChange={e => setEditData(f => ({ ...f, type: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm"><option value="VIDEO">VIDEO</option><option value="TEXT">TEXT</option><option value="QUIZ">QUIZ</option><option value="ASSIGNMENT">ASSIGNMENT</option></select></div><div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Thứ tự</label><input type="number" value={editData.sort_order || 1} onChange={e => setEditData(f => ({ ...f, sort_order: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm" /></div></div>
                            <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Video URL</label><input value={editData.video_url || ''} onChange={e => setEditData(f => ({ ...f, video_url: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm" /></div>
                            <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Tải video</label><input type="file" accept="video/*" onChange={(e) => uploadFile(e, 'video_url')} className="w-full text-sm" /></div>
                            <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Tài liệu DOCX</label><input value={editData.docx_url || ''} onChange={e => setEditData(f => ({ ...f, docx_url: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm" /></div>
                            <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Tải DOCX</label><input type="file" accept=".docx,.doc" onChange={(e) => uploadFile(e, 'docx_url')} className="w-full text-sm" /></div>
                            {editData.type === 'QUIZ' && <div className="rounded-xl border border-slate-200 p-4"><QuizBuilder value={editData.content || ''} onChange={(value) => setEditData(f => ({ ...f, content: value }))} /></div>}
                            {(editData.type !== 'QUIZ') && <div><label className="text-sm font-semibold text-slate-700 mb-1.5 block">Nội dung</label><textarea value={editData.content || ''} onChange={e => setEditData(f => ({ ...f, content: e.target.value }))} rows={6} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm resize-none" /></div>}
                        </div>
                        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100"><Button onClick={saveChanges} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{isCreating ? 'Tạo bài giảng' : 'Lưu thay đổi'}</Button><Button variant="outline" onClick={cancelModal} className="cursor-pointer">Hủy</Button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
