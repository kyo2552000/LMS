'use client';


import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Loader2, Check, AlertCircle, Clock, CheckCircle2,
    Search, RefreshCw, Eye, XCircle, RotateCcw, ShoppingCart,
    DollarSign, TrendingUp
} from 'lucide-react';
import Pagination from '@/components/Pagination';

interface Order {
    id: string;
    user_name: string;
    user_email: string;
    course_title: string;
    course_image: string | null;
    /** MySQL DECIMAL thường serialize ra JSON là string */
    amount: number | string;
    discount_amount?: number | string | null;
    status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
    created_at: string;
    paid_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    PAID:      { label: 'Đã thanh toán', color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
    PENDING:   { label: 'Chờ xử lý',     color: 'text-amber-700',   bg: 'bg-amber-100',   dot: 'bg-amber-400' },
    CANCELLED: { label: 'Đã hủy',        color: 'text-slate-600',   bg: 'bg-slate-100',   dot: 'bg-slate-400' },
    REFUNDED:  { label: 'Hoàn tiền',     color: 'text-rose-700',    bg: 'bg-rose-100',    dot: 'bg-rose-500' },
};

function toMoneyNumber(v: number | string | null | undefined): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function formatCurrency(v: number | string | null | undefined) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(toMoneyNumber(v));
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const limit = 15;

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (search.trim()) params.set('search', search.trim());
            if (filterStatus) params.set('status', filterStatus);
            const res = await fetch(`/api/orders?${params}`);
            const data = await res.json();
            setOrders(data.orders || []);
            setTotal(data.pagination?.total ?? data.total ?? 0);
        } catch {
            setMessage({ type: 'error', text: 'Lỗi khi tải đơn hàng' });
        } finally {
            setLoading(false);
        }
    }, [page, search, filterStatus]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    useEffect(() => {
        if (message) { const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t); }
    }, [message]);

    const updateStatus = async (orderId: string, newStatus: 'PAID' | 'CANCELLED' | 'REFUNDED' | 'PENDING') => {
        if (!confirm(`Bạn có chắc muốn chuyển đơn hàng sang trạng thái "${STATUS_CONFIG[newStatus]?.label}"?`)) return;
        setUpdating(orderId);
        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: newStatus }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: data.message || 'Cập nhật thành công' });
            fetchOrders();
            if (detailOrder?.id === orderId) setDetailOrder(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (err) {
            setMessage({ type: 'error', text: (err as Error).message || 'Cập nhật thất bại' });
        } finally {
            setUpdating(null);
        }
    };

    // Stats
    const totalRevenue = orders
        .filter(o => o.status === 'PAID')
        .reduce((sum, o) => sum + toMoneyNumber(o.amount), 0);
    const pendingCount  = orders.filter(o => o.status === 'PENDING').length;
    const totalPages    = Math.ceil(total / limit);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Đơn Hàng</h1>
                    <p className="text-slate-500 mt-1">{total.toLocaleString()} đơn hàng trong hệ thống</p>
                </div>
                <Button variant="outline" onClick={fetchOrders} className="rounded-lg border border-slate-200 cursor-pointer h-10 px-4">
                    <RefreshCw className="h-4 w-4 mr-2 text-slate-500" />
                    Làm mới
                </Button>
            </div>

            {/* Toast Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Mini Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 flex-shrink-0"><DollarSign className="h-6 w-6 text-emerald-600" /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Doanh thu (Trang này)</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 flex-shrink-0"><Clock className="h-6 w-6 text-amber-600" /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Chờ xác nhận</p>
                        <p className="text-xl font-bold text-slate-900">{pendingCount}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0"><TrendingUp className="h-6 w-6 text-indigo-600" /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Tổng đơn</p>
                        <p className="text-xl font-bold text-slate-900">{total.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {(['', 'PAID', 'PENDING', 'CANCELLED', 'REFUNDED'] as const).map(s => (
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
                    <input
                        type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Tìm theo tên, email, khóa học..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Order Detail Modal */}
            {detailOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white rounded-xl shadow-2xl border-0 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-indigo-500"/>Chi tiết đơn hàng</h3>
                            <button onClick={() => setDetailOrder(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><XCircle className="h-5 w-5"/></button>
                        </div>
                        <div className="p-6 space-y-3 text-sm overflow-y-auto flex-1">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Mã đơn hàng</p>
                                <code className="font-mono text-sm text-slate-800">#{detailOrder.id.toUpperCase()}</code>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Khách hàng</p>
                                    <p className="font-semibold text-slate-900">{detailOrder.user_name}</p>
                                    <p className="text-xs text-slate-500">{detailOrder.user_email}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Trạng thái</p>
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold border mt-1 ${STATUS_CONFIG[detailOrder.status]?.bg} ${STATUS_CONFIG[detailOrder.status]?.color} border-${STATUS_CONFIG[detailOrder.status]?.bg.split('-')[1]}-200`}>
                                        {STATUS_CONFIG[detailOrder.status]?.label}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Khóa học</p>
                                <p className="font-semibold text-slate-900">{detailOrder.course_title}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">Thanh toán</p>
                                    <p className="font-bold text-emerald-800 text-lg">{formatCurrency(detailOrder.amount)}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Giảm giá</p>
                                    <p className="font-semibold text-slate-700 text-lg">{formatCurrency(detailOrder.discount_amount || 0)}</p>
                                </div>
                            </div>
                        </div>
                        {/* Action buttons */}
                        <div className="p-4 border-t border-slate-100 flex flex-wrap gap-2 shrink-0">
                            {detailOrder.status === 'PENDING' && (
                                <Button onClick={() => updateStatus(detailOrder.id, 'PAID')} disabled={updating === detailOrder.id}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer w-full">
                                    {updating === detailOrder.id ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <CheckCircle2 className="h-4 w-4 mr-2"/>}
                                    Xác nhận thanh toán
                                </Button>
                            )}
                            <div className="flex w-full gap-2">
                                {detailOrder.status === 'PENDING' && (
                                    <Button onClick={() => updateStatus(detailOrder.id, 'CANCELLED')} disabled={updating === detailOrder.id} variant="outline"
                                        className="flex-1 border-slate-300 text-slate-700 cursor-pointer">
                                        <XCircle className="h-4 w-4 mr-2"/>Hủy đơn
                                    </Button>
                                )}
                                {detailOrder.status === 'PAID' && (
                                    <Button onClick={() => updateStatus(detailOrder.id, 'REFUNDED')} disabled={updating === detailOrder.id} variant="outline"
                                        className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer">
                                        <RotateCcw className="h-4 w-4 mr-2"/>Hoàn tiền
                                    </Button>
                                )}
                                <Button variant="ghost" onClick={() => setDetailOrder(null)} className="flex-1 cursor-pointer">Đóng</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Table */}
            <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4"/>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Mã đơn</th>
                                        <th className="px-6 py-4">Khách hàng</th>
                                        <th className="px-6 py-4">Khóa học</th>
                                        <th className="px-6 py-4">Số tiền</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4">Ngày tạo</th>
                                        <th className="px-6 py-4 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {orders.length > 0 ? orders.map((order) => {
                                        const sCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <code className="text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded font-mono text-slate-700">
                                                        #{order.id.slice(0, 8).toUpperCase()}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-slate-900">{order.user_name}</p>
                                                    <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{order.user_email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-slate-700 max-w-[180px] truncate font-medium">{order.course_title}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-900 block">{formatCurrency(order.amount)}</span>
                                                    {toMoneyNumber(order.discount_amount) > 0 && (
                                                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 inline-block border border-emerald-100">-{formatCurrency(order.discount_amount)}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold border ${sCfg.bg} ${sCfg.color} border-${sCfg.bg.split('-')[1]}-200`}>
                                                        {sCfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                                    {order.paid_at && <p className="text-emerald-600 font-medium mt-0.5">{new Date(order.paid_at).toLocaleDateString('vi-VN')}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        {/* Quick confirm PENDING */}
                                                        {order.status === 'PENDING' && (
                                                            <Button size="sm" onClick={() => updateStatus(order.id, 'PAID')}
                                                                disabled={updating === order.id}
                                                                className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer text-xs font-semibold mr-2 shadow-sm">
                                                                {updating === order.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <><CheckCircle2 className="h-3 w-3 mr-1"/>Xác nhận</>}
                                                            </Button>
                                                        )}
                                                        {/* View Detail */}
                                                        <Button size="sm" variant="ghost" onClick={() => setDetailOrder(order)}
                                                            className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 cursor-pointer" title="Chi tiết">
                                                            <Eye className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-500">
                                                Không tìm thấy đơn hàng nào.
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
