'use client';


import { useEffect, useState, useCallback } from 'react';
import { Star, Search, Trash2, Loader2, Check, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/Pagination';

interface Review {
    id: string;
    rating: number;
    comment: string;
    user_name: string;
    user_avatar: string | null;
    course_title: string;
    created_at: string;
}

function StarDisplay({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
            ))}
            <span className="ml-1 text-xs font-bold text-slate-600">{rating}.0</span>
        </div>
    );
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRating, setFilterRating] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const limit = 15;

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search.trim()) params.set('search', search.trim());
        if (filterRating) params.set('rating', filterRating);
        const res = await fetch(`/api/admin/reviews?${params}`);
        const data = await res.json();
        setReviews(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
    }, [page, search, filterRating]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);
    useEffect(() => {
        if (message) { const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t); }
    }, [message]);

    const deleteReview = async (id: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa đánh giá này?')) return;
        const res = await fetch(`/api/admin/reviews`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (res.ok) {
            setMessage({ type: 'success', text: 'Đã xóa đánh giá!' });
            fetchReviews();
        } else {
            setMessage({ type: 'error', text: 'Xóa thất bại' });
        }
    };

    const totalPages = Math.ceil(total / limit);
    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    const fiveStarCount = reviews.filter(r => r.rating === 5).length;
    const lowRatingCount = reviews.filter(r => r.rating <= 2).length;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Đánh Giá</h1>
                    <p className="text-slate-500 mt-1">{total.toLocaleString()} đánh giá từ học viên</p>
                </div>
                <Button variant="outline" onClick={fetchReviews} className="rounded-lg border border-slate-200 cursor-pointer h-10 px-4">
                    <RefreshCw className="h-4 w-4 mr-2 text-slate-500" />
                    Làm mới
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đánh giá trung bình</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{avgRating.toFixed(1)}<span className="text-sm text-slate-400 font-normal">/5.0</span></p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">5 sao</p>
                        <p className="text-2xl font-bold text-amber-500 mt-1">{fiveStarCount}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đánh giá thấp</p>
                        <p className="text-2xl font-bold text-red-500 mt-1">{lowRatingCount}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng đánh giá</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{total.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-6 p-5 bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 flex-shrink-0">
                        <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Đánh giá trung bình</p>
                        <p className="text-xl font-bold text-slate-900">{avgRating.toFixed(1)} <span className="text-sm text-slate-400 font-normal">/ 5.0</span></p>
                    </div>
                </div>
                <div className="h-12 w-px bg-slate-200 hidden sm:block" />
                <div className="flex flex-wrap gap-2">
                    {[5, 4, 3, 2, 1].map(r => (
                        <button key={r} onClick={() => { setFilterRating(filterRating === String(r) ? '' : String(r)); setPage(1); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer border ${
                                filterRating === String(r) ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                            }`}>
                            <Star className={`h-4 w-4 ${filterRating === String(r) ? 'fill-amber-500 text-amber-500' : 'fill-slate-300 text-slate-300'}`} />{r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6">
                {filterRating && (
                    <button onClick={() => setFilterRating('')} className="text-sm text-slate-500 border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 cursor-pointer font-medium">
                        Xóa lọc ×
                    </button>
                )}
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Tìm trong nội dung, tên học viên..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                </div>
            </div>

            {/* Toast */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span>{message.text}</span>
                </div>
            )}

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
                                        <th className="px-6 py-4">Đánh giá</th>
                                        <th className="px-6 py-4">Nội dung</th>
                                        <th className="px-6 py-4">Khóa học</th>
                                        <th className="px-6 py-4">Ngày</th>
                                        <th className="px-6 py-4 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {reviews.length > 0 ? reviews.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold flex-shrink-0">
                                                        {r.user_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-slate-900 text-sm truncate max-w-[120px]">{r.user_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><StarDisplay rating={r.rating} /></td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-700 text-sm line-clamp-2 max-w-[250px]">{r.comment || <span className="text-slate-400 italic">Không có bình luận</span>}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-medium text-slate-500 truncate max-w-[180px]">{r.course_title}</p>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {new Date(r.created_at).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" variant="ghost" onClick={() => deleteReview(r.id)}
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Xóa đánh giá">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-slate-500">
                                                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                                <p className="font-medium">Không có đánh giá nào</p>
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
