'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ShoppingBag, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Order {
    id: string;
    course_id: string;
    course_title: string;
    course_image: string;
    amount: number;
    status: string;
    created_at: string;
    paid_at: string | null;
}

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!user) return;
        fetch('/api/orders')
            .then((res) => res.json())
            .then((data) => setOrders(data.orders || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="py-12 bg-background">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Đơn hàng của tôi
                    </h1>
                    <p className="text-muted-foreground">Theo dõi đơn hàng của bạn</p>
                </div>

                {orders.length === 0 ? (
                    <Card className="rounded-2xl border-0 shadow-md">
                        <CardContent className="py-16 text-center">
                            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đơn hàng</h3>
                            <p className="text-gray-500 mb-6">Bắt đầu học bằng cách mua một khóa học</p>
                            <Link href="/courses">
                                <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all cursor-pointer">
                                    Khám phá khóa học
                                    <ArrowRight className="h-4 w-4 inline ml-2" />
                                </button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Card key={order.id} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-0">
                                    <div className="flex items-center p-5">
                                        {/* Course Image */}
                                        <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 mr-4">
                                            {order.course_image ? (
                                                <img src={order.course_image} alt={order.course_title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <ShoppingBag className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Order Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{order.course_title}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Order #{order.id.slice(0, 8).toUpperCase()} • {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Price & Status */}
                                        <div className="text-right ml-4 flex-shrink-0">
                                            <p className="text-lg font-bold text-gray-900">${order.amount}</p>
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
                                                <span>{order.status === 'PAID' ? 'Paid' : 'Pending'}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Paid info */}
                                    {order.paid_at && (
                                        <div className="px-5 pb-4 pt-0">
                                            <p className="text-xs text-green-600">
                                                ✅ Thanh toán thành công vào {new Date(order.paid_at).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
