'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import Pagination from '@/components/Pagination';

interface Order {
    id: string;
    user_name: string;
    user_email: string;
    course_title: string;
    amount: number;
    status: string;
    payment_method: string;
    created_at: string;
    paid_at: string | null;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);

    const limit = 15;

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/orders?page=${page}&limit=${limit}`);
            const data = await res.json();
            setOrders(data.orders || []);
            setTotal(data.total || 0);
        } catch {
            setMessage({ type: 'error', text: 'Lỗi khi tải đơn hàng' });
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const toggleStatus = async (orderId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
        setUpdating(orderId);

        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: newStatus }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setMessage({
                type: 'success',
                text: newStatus === 'PAID'
                    ? 'Thanh toán thành công! Học viên đã được ghi danh.'
                    : 'Đơn hàng đã được chuyển sang trạng thái chờ xử lý.',
            });
            fetchOrders();
        } catch (err: unknown) {
            const e = err as { message?: string };
            setMessage({ type: 'error', text: e.message || 'Cập nhật thất bại' });
        } finally {
            setUpdating(null);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Đơn hàng</h1>
                <p className="text-gray-500 mt-1">{total} đơn hàng</p>
            </div>

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
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Mã đơn hàng</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Khách hàng</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Khóa học</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Số tiền</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Trạng thái</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Ngày</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 text-xs uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                                    #{order.id.slice(0, 8).toUpperCase()}
                                                </code>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{order.user_name}</p>
                                                <p className="text-xs text-gray-400">{order.user_email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-gray-700 max-w-[200px] truncate">{order.course_title}</p>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">
                                                ${order.amount}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'PAID'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                >
                                                    {order.status === 'PAID' ? (
                                                        <CheckCircle className="h-3 w-3" />
                                                    ) : (
                                                        <Clock className="h-3 w-3" />
                                                    )}
                                                    <span>{order.status === 'PAID' ? 'Đã thanh toán' : 'Chờ xử lý'}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">
                                                {new Date(order.created_at).toLocaleString()}
                                                {order.paid_at && (
                                                    <p className="text-green-500">Đã thanh toán: {new Date(order.paid_at).toLocaleString()}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => toggleStatus(order.id, order.status)}
                                                    disabled={updating === order.id}
                                                    className={`h-7 px-3 text-xs cursor-pointer ${order.status === 'PENDING'
                                                        ? 'bg-green-500 hover:bg-green-600 text-white'
                                                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                                                        }`}
                                                >
                                                    {updating === order.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : order.status === 'PENDING' ? (
                                                        <>
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Xác Nhận Đơn Hàng
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Hoàn Tác Đơn Hàng
                                                        </>
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-gray-400">Chưa có đơn hàng</td>
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
