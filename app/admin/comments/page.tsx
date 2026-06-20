'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    MessageSquare, Search, Trash2, Loader2, Check,
    AlertCircle, Eye, EyeOff, Flag, ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Pagination from '@/components/Pagination';

interface Comment {
    id: string;
    content: string;
    status: 'VISIBLE' | 'HIDDEN' | 'FLAGGED';
    user_name: string;
    user_avatar: string;
    course_title: string;
    created_at: string;
    likes: number;
}

const STATUS_CONFIG = {
    VISIBLE: { label: 'Hiện', icon: Eye, class: 'bg-green-50 text-green-700 border-green-200' },
    HIDDEN:  { label: 'Ẩn',   icon: EyeOff, class: 'bg-gray-50 text-gray-600 border-gray-200' },
    FLAGGED: { label: 'Vi phạm', icon: Flag, class: 'bg-red-50 text-red-600 border-red-200' },
};

export default function AdminCommentsPage() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const limit = 15;

    const fetchComments = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page), limit: String(limit),
            search, status: filterStatus,
        });
        const res = await fetch(`/api/admin/comments?${params}`);
        const data = await res.json();
        setComments(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
    }, [page, search, filterStatus]);

    useEffect(() => { fetchComments(); }, [fetchComments]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const updateStatus = async (id: string, status: string) => {
        const res = await fetch('/api/admin/comments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        });
        const data = await res.json();
        if (res.ok) {
            setMessage({ type: 'success', text: 'Cập nhật trạng thái thành công!' });
            fetchComments();
        } else {
            setMessage({ type: 'error', text: data.error || 'Lỗi cập nhật' });
        }
    };

    const deleteComment = async (id: string) => {
        if (!confirm('Xóa bình luận này?')) return;
        const res = await fetch('/api/admin/comments', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (res.ok) {
            setMessage({ type: 'success', text: 'Đã xóa bình luận!' });
            fetchComments();
        }
    };

    const totalPages = Math.ceil(total / limit);
    const visibleCount = comments.filter(c => c.status === 'VISIBLE').length;
    const hiddenCount = comments.filter(c => c.status === 'HIDDEN').length;
    const flaggedCount = comments.filter(c => c.status === 'FLAGGED').length;

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Bình Luận</h1>
                    <p className="text-slate-500 mt-1">Kiểm duyệt {total} bình luận trên hệ thống</p>
                </div>
                {/* Stats */}
                <div className="flex gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => { setFilterStatus(filterStatus === key ? '' : key); setPage(1); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${filterStatus === key ? `${cfg.class} border-${cfg.class.split(' ')[0].split('-')[1]}-200` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                            <cfg.icon className="h-4 w-4" />
                            {cfg.label}
                        </button>
                    ))}
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    {message.text}
                </div>
            )}

            {/* Search */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6">
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        placeholder="Tìm trong bình luận, người dùng..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
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
                                    <th className="px-6 py-4">Người dùng</th>
                                    <th className="px-6 py-4">Nội dung</th>
                                    <th className="px-6 py-4">Khóa học</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4">Ngày</th>
                                    <th className="px-6 py-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {comments.length > 0 ? comments.map(cm => {
                                    const cfg = STATUS_CONFIG[cm.status];
                                    return (
                                        <tr key={cm.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded border border-slate-200 bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-slate-600 text-[10px] font-bold">{cm.user_name?.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">{cm.user_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-[250px]">
                                                <p className="text-sm text-slate-700 line-clamp-2">{cm.content}</p>
                                            </td>
                                            <td className="px-6 py-4 max-w-[180px]">
                                                <p className="text-xs font-medium text-slate-500 truncate">{cm.course_title}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative group/status inline-block">
                                                    <button className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer ${cfg.class}`}>
                                                        <cfg.icon className="h-3.5 w-3.5" />
                                                        {cfg.label}
                                                        <ChevronDown className="h-3 w-3 ml-1" />
                                                    </button>
                                                    <div className="absolute left-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-36 z-10 hidden group-hover/status:block">
                                                        {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                                                            <button key={k} onClick={() => updateStatus(cm.id, k)}
                                                                className={`flex items-center gap-2 w-full px-4 py-2 text-xs hover:bg-slate-50 cursor-pointer text-slate-700 ${k === cm.status ? 'font-bold bg-slate-50' : ''}`}>
                                                                <c.icon className="h-4 w-4" />{c.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {new Date(cm.created_at).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => deleteComment(cm.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                                        title="Xóa bình luận"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-slate-500">
                                            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                            <p className="text-sm font-medium">Không có bình luận nào</p>
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
