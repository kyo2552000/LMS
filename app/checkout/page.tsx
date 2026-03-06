'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2, ShoppingCart, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CourseInfo {
    id: string;
    title: string;
    price: number;
    image: string;
    level: string;
}

function CheckoutForm() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('courseId');

    const [course, setCourse] = useState<CourseInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    // Fetch course info
    useEffect(() => {
        if (!courseId) return;
        fetch(`/api/courses/${courseId}`)
            .then((res) => res.json())
            .then((data) => setCourse(data.course || data))
            .catch(() => setError('Failed to load course'))
            .finally(() => setLoading(false));
    }, [courseId]);

    const handleCreateOrder = async () => {
        if (!courseId) return;
        setCreating(true);
        setError('');

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
            } else {
                setOrderId(data.orderId);
            }
        } catch {
            setError('Failed to create order');
        } finally {
            setCreating(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user || !courseId || !course) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <p className="text-gray-500">Không tìm thấy khóa học</p>
            </div>
        );
    }

    return (
        <div className="py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href={`/courses/${courseId}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Quay lại khóa học
                </Link>

                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {orderId ? 'Hoàn tất thanh toán' : 'Thanh toán'}
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Order Info */}
                    <div className="space-y-6">
                        {/* Course Card */}
                        <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex">
                                    {course.image && (
                                        <div className="relative w-32 h-28 flex-shrink-0">
                                            <Image src={course.image} alt={course.title} fill className="object-cover" />
                                        </div>
                                    )}
                                    <div className="p-4 flex-1">
                                        <h3 className="font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                                        <p className="text-xs text-gray-400 mt-1">Level: {course.level}</p>
                                        <p className="text-xl font-bold text-blue-600 mt-2">${course.price}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Summary */}
                        <Card className="rounded-2xl border-0 shadow-md">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Tổng tiền</span>
                                        <span className="font-medium">${course.price}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Giảm giá</span>
                                        <span className="font-medium text-green-600">$0.00</span>
                                    </div>
                                    <div className="flex justify-between py-2 text-lg font-bold">
                                        <span>Tổng tiền</span>
                                        <span className="text-blue-600">${course.price}</span>
                                    </div>
                                </div>

                                {orderId && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                        <div className="flex items-center space-x-2 text-amber-700">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-sm font-medium">Order #{orderId.slice(0, 8)}</span>
                                        </div>
                                        <p className="text-xs text-amber-600 mt-1">
                                            Đang chờ xác nhận thanh toán từ admin
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Right: QR Payment */}
                    <div>
                        <Card className="rounded-2xl border-0 shadow-md">
                            <CardContent className="p-6 text-center">
                                <h3 className="font-semibold text-gray-900 mb-2">Thanh toán qua QR</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Quét mã QR để thanh toán
                                </p>

                                {/* QR Code */}
                                <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-gray-200 inline-block mb-6">
                                    <Image
                                        src="/qr2.jpg"
                                        alt="Payment QR Code"
                                        width={270}
                                        height={270}
                                        className="mx-auto"
                                    />
                                </div>

                                <div className="text-left space-y-2 mb-6 p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Số tiền:</span>{' '}
                                        <span className="text-blue-600 font-bold">${course.price}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Nội dung:</span>{' '}
                                        <code className="bg-white px-2 py-0.5 rounded text-xs border">
                                            EDULEARN {orderId ? orderId.slice(0, 8).toUpperCase() : courseId?.slice(0, 8).toUpperCase()}
                                        </code>
                                    </p>
                                </div>

                                {!orderId ? (
                                    <Button
                                        onClick={handleCreateOrder}
                                        disabled={creating}
                                        className="w-full cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-12 text-base"
                                    >
                                        {creating ? (
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        ) : (
                                            <ShoppingCart className="h-5 w-5 mr-2" />
                                        )}
                                        Đặt hàng — ${course.price}
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-green-700">Đặt hàng thành công!</p>
                                            <p className="text-xs text-green-600 mt-1">
                                                Sau khi thanh toán, admin sẽ xác nhận đơn hàng của bạn.
                                            </p>
                                        </div>
                                        <Link href="/orders">
                                            <Button variant="outline" className="w-full cursor-pointer">
                                                Xem đơn hàng của tôi
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                <div className="mt-4 text-xs text-gray-400 space-y-1">
                                    <p>• Quét mã QR để chuyển khoản đúng số tiền</p>
                                    <p>• Ghi mã đơn hàng trong nội dung chuyển khoản</p>
                                    <p>• Admin sẽ xác nhận thanh toán trong vòng 24 giờ</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        }>
            <CheckoutForm />
        </Suspense>
    );
}
