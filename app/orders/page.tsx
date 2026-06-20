'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/contexts/CartContext';
import { Loader2, ShoppingBag, CheckCircle2, Clock, ArrowRight, PlayCircle, Tag, Trash2, BookOpen, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Order {
    id: string;
    course_id: string;
    course_title: string;
    course_image: string;
    amount: number;
    discount_amount: number;
    status: string;
    created_at: string;
    paid_at: string | null;
}

const STATUS_CONFIG = {
    PAID: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    PENDING: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700', icon: Clock },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: Clock },
};

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { cartItems, removeFromCart: removeCartItem, cartCount, cartTotal } = useCart();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'cart' | 'all' | 'paid' | 'pending'>('cart');

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!user) return;
        fetch('/api/orders')
            .then(r => r.json())
            .then(data => setOrders(data.orders || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) return null;

    const filtered = orders.filter(o => {
        if (tab === 'paid') return o.status === 'PAID';
        if (tab === 'pending') return o.status === 'PENDING';
        return true;
    });

    const totalSpent = orders.filter(o => o.status === 'PAID').reduce((s, o) => s + parseFloat(String(o.amount)), 0);

    const tabs = [
        { key: 'cart', label: 'Giỏ hàng', count: cartCount },
        { key: 'all', label: 'Tất cả' },
        { key: 'paid', label: 'Đã thanh toán' },
        { key: 'pending', label: 'Chờ xác nhận' },
    ] as const;

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng & Đơn hàng</h1>
                    <p className="text-gray-500 mt-1">Quản lý giỏ hàng và theo dõi đơn hàng của bạn</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Trong giỏ', value: cartCount, color: 'text-blue-600' },
                        { label: 'Đã thanh toán', value: orders.filter(o => o.status === 'PAID').length, color: 'text-green-600' },
                        { label: 'Đã chi', value: `${totalSpent.toLocaleString('vi-VN')}đ`, color: 'text-purple-600' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all flex items-center gap-1.5 ${tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t.label}
                            {'count' in t && t.count > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none font-bold">
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ===== CART TAB ===== */}
                {tab === 'cart' && (
                    cartItems.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                            <ShoppingCart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <h3 className="font-semibold text-gray-700 mb-2">Giỏ hàng đang trống</h3>
                            <p className="text-sm text-gray-400 mb-5">Thêm khóa học bạn muốn vào giỏ hàng</p>
                            <Link href="/courses">
                                <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors inline-flex items-center gap-2">
                                    Khám phá khóa học <ArrowRight className="h-4 w-4" />
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cartItems.map(item => (
                                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="flex items-center p-5 gap-4">
                                        {/* Thumbnail */}
                                        <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                            {item.image ? (
                                                <Image src={item.image} alt={item.title} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BookOpen className="h-6 w-6 text-gray-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/courses/${item.id}`}>
                                                <h3 className="font-semibold text-gray-900 truncate text-sm hover:text-blue-600 transition-colors">{item.title}</h3>
                                            </Link>
                                            <p className="text-xs text-gray-400 mt-0.5">bởi {item.instructor}</p>
                                            <p className="text-base font-bold text-blue-600 mt-1">{Number(item.price).toLocaleString('vi-VN')}đ</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => removeCartItem(item.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                title="Xóa khỏi giỏ"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <Button
                                                size="sm"
                                                onClick={() => router.push(`/checkout?courseId=${item.id}`)}
                                                className="cursor-pointer text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                            >
                                                Mua ngay <ArrowRight className="h-3 w-3 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Cart total */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{cartCount} khóa học trong giỏ</p>
                                    <p className="text-lg font-bold text-gray-900 mt-0.5">{cartTotal.toLocaleString('vi-VN')}đ</p>
                                </div>
                                <p className="text-xs text-gray-400 text-right max-w-[160px]">Mỗi khóa học sẽ được thanh toán riêng lẻ</p>
                            </div>
                        </div>
                    )
                )}

                {/* ===== ORDER TABS ===== */}
                {tab !== 'cart' && (
                    filtered.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                            <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <h3 className="font-semibold text-gray-700 mb-2">Chưa có đơn hàng nào</h3>
                            <p className="text-sm text-gray-400 mb-5">Bắt đầu học bằng cách mua một khóa học</p>
                            <Link href="/courses">
                                <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors inline-flex items-center gap-2">
                                    Khám phá khóa học <ArrowRight className="h-4 w-4" />
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map(order => {
                                const statusCfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
                                const StatusIcon = statusCfg.icon;
                                const discount = parseFloat(String(order.discount_amount || 0));
                                const originalPrice = discount > 0 ? parseFloat(String(order.amount)) + discount : null;

                                return (
                                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="flex items-center p-5 gap-4">
                                            {/* Course thumbnail */}
                                            <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                {order.course_image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={order.course_image} alt={order.course_title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ShoppingBag className="h-6 w-6 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate text-sm">{order.course_title}</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    #{order.id.slice(0, 8).toUpperCase()} • {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                                </p>
                                                {discount > 0 && (
                                                    <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                                                        <Tag className="h-3 w-3" /> Giảm {discount.toLocaleString('vi-VN')}đ
                                                    </p>
                                                )}
                                            </div>

                                            {/* Price & Status */}
                                            <div className="text-right flex-shrink-0">
                                                <div className="flex items-baseline gap-1 justify-end">
                                                    <p className="text-lg font-bold text-gray-900">{parseFloat(String(order.amount)).toLocaleString('vi-VN')}đ</p>
                                                    {originalPrice && (
                                                        <span className="text-xs text-gray-400 line-through">{originalPrice.toLocaleString('vi-VN')}đ</span>
                                                    )}
                                                </div>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${statusCfg.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusCfg.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Bottom row */}
                                        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50/50">
                                            {order.paid_at ? (
                                                <p className="text-xs text-green-600">
                                                    ✅ Thanh toán lúc {new Date(order.paid_at).toLocaleString('vi-VN')}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-amber-600">⏳ Chờ xác nhận từ admin</p>
                                            )}

                                            {order.status === 'PAID' && (
                                                <Link href={`/courses/${order.course_id}/learn`}>
                                                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 cursor-pointer transition-colors">
                                                        <PlayCircle className="h-3.5 w-3.5" /> Tiếp tục học
                                                    </button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
