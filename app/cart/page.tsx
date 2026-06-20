'use client';

import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Trash2, ArrowRight, BookOpen, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/contexts/ToastContext';

export default function CartPage() {
    const { cartItems, removeFromCart, cartCount, cartTotal } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const handleCheckout = (courseId: string) => {
        if (!user) {
            showToast('Vui lòng đăng nhập để thanh toán', 'info');
            router.push('/login');
            return;
        }
        router.push(`/checkout?courseId=${courseId}`);
    };

    const handleRemove = (id: string, title: string) => {
        removeFromCart(id);
        showToast(`Đã xóa "${title}" khỏi giỏ hàng`, 'info');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-blue-100 rounded-xl">
                        <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
                        <p className="text-sm text-gray-500">{cartCount} khóa học</p>
                    </div>
                </div>

                {cartItems.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="h-10 w-10 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Giỏ hàng đang trống</h2>
                        <p className="text-gray-500 mb-8">Hãy thêm khóa học bạn muốn học vào giỏ hàng</p>
                        <Link href="/courses">
                            <Button className="cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Khám phá khóa học
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map(item => (
                                <Card key={item.id} className="rounded-2xl border-0 shadow-sm overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="flex gap-4 p-4">
                                            {/* Thumbnail */}
                                            <div className="relative w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                                {item.image ? (
                                                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full">
                                                        <BookOpen className="h-8 w-8 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/courses/${item.id}`}>
                                                    <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                                                        {item.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm text-gray-500 mt-1">bởi {item.instructor}</p>
                                                <p className="text-base font-bold text-blue-600 mt-2">
                                                    {Number(item.price).toLocaleString('vi-VN')}đ
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => handleRemove(item.id, item.title)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Xóa khỏi giỏ hàng"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <Button
                                                    onClick={() => handleCheckout(item.id)}
                                                    size="sm"
                                                    className="cursor-pointer text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 whitespace-nowrap"
                                                >
                                                    Mua ngay
                                                    <ArrowRight className="h-3 w-3 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="lg:col-span-1">
                            <Card className="rounded-2xl border-0 shadow-sm sticky top-24">
                                <CardHeader>
                                    <CardTitle className="text-lg">Tóm tắt đơn hàng</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        {cartItems.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-gray-500 line-clamp-1 flex-1 mr-2">{item.title}</span>
                                                <span className="font-medium flex-shrink-0">{Number(item.price).toLocaleString('vi-VN')}đ</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t pt-3 flex justify-between font-bold text-base">
                                        <span>Tổng cộng</span>
                                        <span className="text-blue-600">{cartTotal.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <p className="text-xs text-gray-400 text-center">
                                        Mỗi khóa học sẽ được thanh toán riêng lẻ
                                    </p>
                                    <Link href="/courses">
                                        <Button variant="outline" className="w-full cursor-pointer mt-2">
                                            Tiếp tục mua sắm
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
