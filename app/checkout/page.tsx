'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import { Loader2, ShoppingCart, CheckCircle, ArrowLeft, Tag, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface CourseInfo {
    id: string;
    title: string;
    price: number;
    image: string;
    level: string;
    instructor_name?: string;
    instructor?: string;
}

interface CouponResult {
    valid: boolean;
    coupon: { code: string; discount_type: string; discount_value: number; description?: string };
    discountAmount: number;
    finalPrice: number;
}

function CheckoutForm() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { removeFromCart } = useCart();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('courseId');

    const [course, setCourse] = useState<CourseInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponInput, setCouponInput] = useState('');
    const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
    const [couponError, setCouponError] = useState('');
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!courseId) return;
        fetch(`/api/courses/${courseId}`)
            .then(r => r.json())
            .then(data => setCourse(data.course || data))
            .catch(() => setError('Failed to load course'))
            .finally(() => setLoading(false));

        fetch('/api/coupons')
            .then(r => r.json())
            .then(data => {
                if(data.coupons) setAvailableCoupons(data.coupons);
            })
            .catch(() => {});
    }, [courseId]);

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setValidatingCoupon(true);
        setCouponError('');
        setCouponResult(null);

        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponInput, coursePrice: course?.price }),
            });
            const data = await res.json();
            if (!res.ok) {
                setCouponError(data.error || 'Mã không hợp lệ');
            } else {
                setCouponResult(data);
                setCouponCode(couponInput.trim().toUpperCase());
            }
        } catch {
            setCouponError('Lỗi kiểm tra mã giảm giá');
        } finally {
            setValidatingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setCouponResult(null);
        setCouponCode('');
        setCouponInput('');
        setCouponError('');
    };

    const handleCreateOrder = async () => {
        if (!courseId) return;
        setCreating(true);
        setError('');

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, couponCode: couponCode || undefined }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Đặt hàng thất bại');
            } else {
                setOrderId(data.orderId);
                // Remove from cart since order is created
                removeFromCart(courseId);
            }
        } catch {
            setError('Lỗi kết nối. Thử lại!');
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

    const originalPrice = parseFloat(String(course.price)) || 0;
    const discountAmount = couponResult?.discountAmount || 0;
    const finalPrice = couponResult?.finalPrice ?? originalPrice;

    return (
        <div className="py-12 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
                <Link href={`/courses/${courseId}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại khóa học
                </Link>

                <h1 className="text-2xl font-bold text-gray-900 mb-8">
                    {orderId ? '✅ Đặt hàng thành công' : 'Thanh toán'}
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Summary */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Course Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex">
                                {course.image && (
                                    <div className="relative w-36 h-28 flex-shrink-0">
                                        <Image src={course.image} alt={course.title} fill className="object-cover" />
                                    </div>
                                )}
                                <div className="p-4 flex-1">
                                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">{course.title}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Level: {course.level}</p>
                                    <p className="text-xs text-gray-400">by {course.instructor_name || course.instructor}</p>
                                    <p className="text-xl font-bold text-blue-600 mt-2">{originalPrice.toLocaleString('vi-VN')}đ</p>
                                </div>
                            </div>
                        </div>

                        {/* Coupon Input */}
                        {!orderId && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-blue-500" /> Mã giảm giá
                                </h3>

                                {couponResult ? (
                                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                                        <div>
                                            <p className="text-sm font-bold text-green-700">{couponResult.coupon.code}</p>
                                            <p className="text-xs text-green-600">
                                                Giảm {couponResult.coupon.discount_type === 'PERCENTAGE'
                                                    ? `${couponResult.coupon.discount_value}%`
                                                    : `${couponResult.coupon.discount_value.toLocaleString('vi-VN')}đ`}
                                                {couponResult.coupon.description && ` — ${couponResult.coupon.description}`}
                                            </p>
                                        </div>
                                        <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500 cursor-pointer">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            value={couponInput}
                                            onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                            placeholder="Nhập mã giảm giá..."
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono"
                                        />
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={validatingCoupon || !couponInput.trim()}
                                            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                        >
                                            {validatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                            Áp dụng
                                        </button>
                                    </div>
                                )}

                                {couponError && (
                                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" /> {couponError}
                                    </p>
                                )}

                                {/* Available Coupons Box */}
                                {!couponResult && availableCoupons.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-slate-500 font-semibold mb-2">🎈 Mã ưu đãi có sẵn:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {availableCoupons.map((c) => (
                                                <button
                                                    key={c.code}
                                                    onClick={() => {
                                                        setCouponInput(c.code);
                                                    }}
                                                    className="text-left px-3 py-2 bg-indigo-50 border border-indigo-100/50 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer group shadow-sm hover:shadow"
                                                >
                                                    <span className="font-extrabold text-indigo-700 text-xs block tracking-wide">{c.code}</span>
                                                    <span className="text-[11px] text-indigo-600 mt-0.5 block max-w-[180px] truncate font-medium">
                                                        {c.description || (c.discount_type === 'PERCENTAGE' ? `Giảm ${c.discount_value}%` : `Giảm ${Number(c.discount_value).toLocaleString('vi-VN')}đ`)}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Order Summary */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Giá gốc</span>
                                    <span className="font-medium">{originalPrice.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Giảm giá</span>
                                    <span className={`font-medium ${discountAmount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {discountAmount > 0 ? `-${discountAmount.toLocaleString('vi-VN')}đ` : '0đ'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 text-base font-bold">
                                    <span>Tổng thanh toán</span>
                                    <span className="text-blue-600">{finalPrice.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
                            </div>
                        )}
                    </div>

                    {/* Right: QR + Action */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center sticky top-24">
                            {orderId ? (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Đặt hàng thành công!</h3>
                                        <p className="text-xs text-gray-400 mt-1">Mã đơn: #{orderId.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                  
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
                                        <p className="text-xs text-amber-700 font-medium">⏳ Chờ xác nhận thanh toán</p>
                                        <p className="text-xs text-amber-600 mt-1">Admin sẽ xác nhận trong vòng 24 giờ sau khi bạn chuyển khoản</p>
                                    </div>
                                    <Link href="/orders">
                                        <button className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer transition-colors">
                                            Xem đơn hàng của tôi
                                        </button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 bg-blue-50 text-blue-700 py-1.5 px-3 rounded-lg w-max mx-auto text-sm">Thanh toán qua mã QR (Tự động)</h3>
                                    
                                    <div className="bg-white p-3 rounded-xl inline-block border-2 border-dashed border-blue-200 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-1">
                                            <span className="flex h-3 w-3 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                            </span>
                                        </div>
                                        {/* VietQR automatically generates a QR code with the EXACT amount and transfer content */}
                                        <img 
                                            src={`https://img.vietqr.io/image/970422-0368511900-compact2.png?amount=${finalPrice}&addInfo=EDULEARN ${courseId?.slice(0, 8).toUpperCase()}&accountName=BUI NAM HUY`} 
                                            alt="QR Payment Auto" 
                                            width={240} 
                                            height={240} 
                                            className="mx-auto rounded-lg" 
                                        />
                                    </div>

                                    <div className="text-left text-sm text-gray-600 bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-inner space-y-2.5">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 border-dashed">
                                            <span className="font-medium text-slate-500">Ngân hàng:</span> 
                                            <span className="font-bold text-slate-900">MBBank</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 border-dashed">
                                            <span className="font-medium text-slate-500">Số tài khoản:</span> 
                                            <span className="font-bold text-slate-900">0368511900</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 border-dashed">
                                            <span className="font-medium text-slate-500">Chủ tài khoản:</span> 
                                            <span className="font-bold text-slate-900">BUI NAM HUY</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 border-dashed">
                                            <span className="font-medium text-slate-500">Số tiền chuyển:</span> 
                                            <span className="text-blue-600 font-black text-base">{finalPrice.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="font-medium text-slate-500">Nội dung (Bắt buộc):</span> 
                                            <code className="bg-white px-2 py-1 rounded-md border border-slate-200 font-bold text-slate-800 tracking-wide">EDULEARN {courseId?.slice(0, 8).toUpperCase()}</code>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCreateOrder}
                                        disabled={creating}
                                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                                        Đặt hàng — {finalPrice.toLocaleString('vi-VN')}đ
                                    </button>

                                    <div className="text-xs text-gray-400 space-y-1 text-left">
                                        <p>• Quét QR để chuyển khoản đúng số tiền</p>
                                        <p>• Ghi mã đơn hàng trong nội dung</p>
                                        <p>• Admin xác nhận trong 24 giờ</p>
                                    </div>
                                </div>
                            )}
                        </div>
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
