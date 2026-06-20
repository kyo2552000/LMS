'use client';



import { useEffect, useState, useCallback } from 'react';
import { GraduationCap, Search, Trash2, Loader2, Check, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/Pagination';

interface Enrollment {
    id: string;
    user_name: string;
    user_email: string;
    course_title: string;
    course_image: string | null;
    status: 'ACTIVE' | 'COMPLETED';
    progress: number;
    enrolled_at: string;
    completed_at: string | null;
}

const STATUS_CONFIG = {
    ACTIVE:    { label: 'Đang học',   color: 'text-indigo-700',  bg: 'bg-indigo-100',  dot: 'bg-indigo-500', bar: 'bg-indigo-500', border: 'border-indigo-200' },
    COMPLETED: { label: 'Hoàn thành', color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500', bar: 'bg-emerald-500', border: 'border-emerald-200' },
};

export default function AdminEnrollmentsPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const limit = 15;

    const fetchEnrollments = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search.trim()) params.set('search', search.trim());
        if (filterStatus) params.set('status', filterStatus);
        const res = await fetch(`/api/admin/enrollments?${params}`);
        const data = await res.json();
        setEnrollments(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
    }, [page, search, filterStatus]);

    useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);
    useEffect(() => {
        if (message) { const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t); }
    }, [message]);

    const deleteEnrollment = async (id: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa đăng ký học này?')) return;
        const res = await fetch(`/api/admin/enrollments`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (res.ok) { setMessage({ type: 'success', text: 'Đã xóa lượt đăng ký!' }); fetchEnrollments(); }
        else { setMessage({ type: 'error', text: 'Xóa thất bại' }); }
    };

    const totalPages = Math.ceil(total / limit);
    const completedCount = enrollments.filter(e => e.status === 'COMPLETED').length;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Đăng Ký Học</h1>
                    <p className="text-slate-500 mt-1">{total.toLocaleString()} lượt đăng ký trong hệ thống</p>
                </div>
                <Button variant="outline" onClick={fetchEnrollments} className="rounded-lg border border-slate-200 cursor-pointer h-10 px-4">
                    <RefreshCw className="h-4 w-4 mr-2 text-slate-500" />
                    Làm mới
                </Button>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0"><GraduationCap className="h-6 w-6 text-indigo-600" /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Tổng đăng ký</p>
                        <p className="text-xl font-bold text-slate-900">{total.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 flex-shrink-0"><Check className="h-6 w-6 text-emerald-600" /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Hoàn thành</p>
                        <p className="text-xl font-bold text-slate-900">{completedCount}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 flex-shrink-0"><TrendingUp className="h-6 w-6 text-amber-600" /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Tỉ lệ hoàn thành</p>
                        <p className="text-xl font-bold text-slate-900">{total > 0 ? Math.round((completedCount / total) * 100) : 0}%</p>
                    </div>
                </div>
            </div>

            {/* Toast Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {(['', 'ACTIVE', 'COMPLETED'] as const).map(s => (
                        <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                filterStatus === s
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}>
                            {s === '' ? 'Tất cả' : STATUS_CONFIG[s]?.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Tìm học viên, khóa học..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>

            {/* Table */}
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
                                        <th className="px-6 py-4">Học viên</th>
                                        <th className="px-6 py-4">Khóa học</th>
                                        <th className="px-6 py-4">Tiến độ</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4">Ngày đăng ký</th>
                                        <th className="px-6 py-4 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {enrollments.length > 0 ? enrollments.map(e => {
                                        const sc = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.ACTIVE;
                                        const progress = Math.round(Number(e.progress) || 0);
                                        return (
                                            <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold flex-shrink-0">
                                                            {e.user_name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-900 truncate">{e.user_name}</p>
                                                            <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{e.user_email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-slate-700 font-medium text-sm truncate max-w-[200px]">{e.course_title}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 min-w-[120px]">
                                                        <div className="flex-1 h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${sc.bar} transition-all`} style={{ width: `${progress}%` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700 w-8 text-right">{progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold border ${sc.bg} ${sc.color} ${sc.border}`}>
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    {new Date(e.enrolled_at).toLocaleDateString('vi-VN')}
                                                    {e.completed_at && <p className="text-emerald-600 font-medium mt-0.5">{new Date(e.completed_at).toLocaleDateString('vi-VN')}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button size="sm" variant="ghost" onClick={() => deleteEnrollment(e.id)}
                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Xóa đăng ký">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-slate-500">
                                                <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                                <p className="font-medium">Không tìm thấy lượt đăng ký nào</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {totalPages > 1 && (
                        <div className="border-t border-slate-200 p-4 bg-white">
                            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
