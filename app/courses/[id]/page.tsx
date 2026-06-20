'use client';

import { use, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, Star, PlayCircle, FileText, HelpCircle, BookOpen, Lock, ShoppingCart, CheckCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Course } from '@/types';
import { useCart } from '@/contexts/CartContext';
import CourseReviews from '@/components/CourseReviews';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart, isInCart } = useCart();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState('');
  const [inCart, setInCart] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        data.category = data.category_name || data.category;
        data.instructor = data.instructor_name || data.instructor;
        setCourse(data);
        setInCart(isInCart(data.id));
        if (data.isEnrolled) {
          const progressRes = await fetch(`/api/lesson-progress?courseId=${id}`);
          if (progressRes.ok) {
            const progressData = await progressRes.json();
            setCompletedCount(Number(progressData.completedCount || 0));
          }
        } else {
          setCompletedCount(0);
        }
      } catch {
        setCourse(null);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [id, isInCart]);

  if (loading) {
    return (
      <div className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
            <div className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
        <Link href="/courses">
          <Button className="cursor-pointer">Back to Courses</Button>
        </Link>
      </div>
    );
  }

  const handleBuy = () => {
    if (course?.isEnrolled) {
      router.push(`/courses/${course.id}/learn`);
    } else if (!course?.hasPendingOrder) {
      router.push(`/checkout?courseId=${course?.id}`);
    }
  };

  const handleFreeEnroll = async () => {
    if (!course) return;
    setEnrolling(true);
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/courses/${course.id}/learn`);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setCartMsg(data.error || 'Có lỗi xảy ra');
        setTimeout(() => setCartMsg(''), 3000);
      }
    } catch {
      setCartMsg('Lỗi kết nối. Vui lòng thử lại.');
      setTimeout(() => setCartMsg(''), 3000);
    } finally {
      setEnrolling(false);
    }
  };

  const handleAddToCart = () => {
    if (!course) return;
    const added = addToCart({
      id: course.id,
      title: course.title,
      price: Number(course.price),
      image: course.image,
      instructor: course.instructor,
    });
    if (added) {
      setInCart(true);
      setCartMsg('Đã thêm vào giỏ hàng!');
    } else {
      setCartMsg('Khóa học đã có trong giỏ hàng!');
    }
    setTimeout(() => setCartMsg(''), 3000);
  };

  const getLessonIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <PlayCircle className="h-5 w-5 text-blue-500" />;
      case 'quiz':
        return <HelpCircle className="h-5 w-5 text-purple-500" />;
      case 'assignment':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <PlayCircle className="h-5 w-5" />;
    }
  };


  const totalLessons = course?.lessons?.length || 0;
  const canViewProgress = !!course?.isEnrolled;
  const progressPercent = canViewProgress && totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isCompleted = canViewProgress ? progressPercent >= 100 : false;

  return (
    <div className="py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Header */}
            <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 flex items-center justify-center group border border-slate-200 dark:border-slate-700">
              {course.image ? (
                <Image
                  src={course.image}
                  alt={course.title || 'Course image'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
                />
              ) : (
                <BookOpen className="h-24 w-24 text-slate-600" />
              )}
              {/* Premium Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-95" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white z-10 w-full max-w-4xl">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md text-xs font-black uppercase tracking-widest mb-5 shadow-sm">
                  <Sparkles className="h-4 w-4" /> {course.category}
                </span>
                <h1 className="text-3xl lg:text-5xl font-black mb-6 leading-tight drop-shadow-2xl">{course.title}</h1>
                <p className="text-lg text-slate-300 font-medium flex items-center gap-3">
                  Bởi: <span className="text-white bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-inner font-bold">{course.instructor}</span>
                </p>
              </div>
            </div>

            {/* Description */}
            <Card className="rounded-2xl shadow-md border-0">
              <CardHeader>
                <CardTitle>Giới thiệu khóa học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">{course.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/80">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Tiến độ của bạn</p>
                    <p className="text-2xl font-black text-slate-900">{canViewProgress ? `${progressPercent}%` : '—'}</p>
                    <div className="h-2 mt-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" style={{ width: `${progressPercent}%` }} />
                    </div>
                    {!canViewProgress && <p className="text-xs text-slate-400 mt-2">Chỉ hiển thị sau khi mua khóa học.</p>}
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/80">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Bài đã hoàn thành</p>
                    <p className="text-2xl font-black text-slate-900">{canViewProgress ? `${completedCount}/${totalLessons}` : '—'}</p>
                    <p className="text-sm text-slate-500 mt-2">{canViewProgress ? (isCompleted ? 'Bạn đã hoàn thành toàn bộ khóa học.' : 'Tiếp tục học để hoàn thiện khóa học.') : 'Mua khóa học để theo dõi tiến độ.'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/80">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Trạng thái</p>
                    <p className={`text-2xl font-black ${isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>{canViewProgress ? (isCompleted ? 'Hoàn thành' : 'Đang học') : 'Khóa'}</p>
                    <p className="text-sm text-slate-500 mt-2">{course.isEnrolled ? 'Đã ghi danh vào khóa học' : 'Cần đăng ký để bắt đầu'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Content */}
            <Card className="rounded-2xl shadow-md border-0">
              <CardHeader>
                <CardTitle>Nội dung khóa học</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        if (course.isEnrolled) {
                          router.push(`/courses/${course.id}/learn?lesson=${lesson.id}`);
                        }
                      }}
                      className={`flex items-center space-x-4 p-4 rounded-xl border transition-colors ${course.isEnrolled ? 'hover:bg-accent/50 cursor-pointer' : 'bg-gray-50 dark:bg-gray-900/50 opacity-75'}`}
                    >
                      <div className="flex-shrink-0 relative">
                        {getLessonIcon(lesson.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{index + 1}. {lesson.title}</h4>
                          <span className="text-sm text-muted-foreground">{lesson.duration || '00:00'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{lesson.type.toLowerCase()}</p>
                      </div>
                      {!course.isEnrolled && (
                        <Lock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Course Reviews */}
            <CourseReviews courseId={course.id} isEnrolled={!!course.isEnrolled} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 rounded-3xl shadow-xl border-0 overflow-hidden bg-white/70 backdrop-blur-xl dark:bg-slate-900/80 ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 p-8 space-y-4">
                <div className="text-3xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  {((course as any).type === 'FREE' || Number(course.price) === 0) ? (
                    <span className="text-emerald-500 flex items-center gap-2"><Sparkles className="h-6 w-6" /> Miễn phí</span>
                  ) : (
                    <>{Number(course.price).toLocaleString('vi-VN')}đ</>
                  )}
                </div>

                {/* Toast message */}
                {cartMsg && (
                  <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl mb-2 ${cartMsg.includes('đã có') ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    {cartMsg}
                  </div>
                )}

                {/* State 1: Enrolled */}
                {course.isEnrolled && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-emerald-700 font-medium">Tiến độ khóa học</span>
                        <span className="font-black text-emerald-700">{progressPercent}%</span>
                      </div>
                      <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                    <Button
                      onClick={handleBuy}
                      className="w-full cursor-pointer text-lg py-6 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isCompleted ? <CheckCircle2 className="h-5 w-5 mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                      {isCompleted ? 'Xem lại khóa học' : 'Tiếp tục học'}
                    </Button>
                  </div>
                )}

                {/* State 2: Pending order */}
                {!course.isEnrolled && course.hasPendingOrder && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm font-medium">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      Đang chờ xác nhận thanh toán
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Bạn đã đặt hàng khóa học này. Vui lòng chờ admin xác nhận.
                    </p>
                    <Link href="/orders" className="block">
                      <Button variant="outline" className="w-full cursor-pointer">
                        Xem đơn hàng của tôi
                      </Button>
                    </Link>
                  </div>
                )}

                {/* State 3: Not purchased — FREE course */}
                {!course.isEnrolled && !course.hasPendingOrder && ((course as any).type === 'FREE' || Number(course.price) === 0) && (
                  <div className="space-y-3">
                    <Button
                      onClick={handleFreeEnroll}
                      disabled={enrolling}
                      className="w-full cursor-pointer text-lg py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    >
                      {enrolling ? (
                        <> Đang đăng ký...</>
                      ) : (
                        <> Học miễn phí ngay</>
                      )}
                    </Button>
                    <p className="text-xs text-center text-gray-400">Khóa học miễn phí — Không cần thanh toán</p>
                  </div>
                )}

                {/* State 3: Not purchased — PAID course */}
                {!course.isEnrolled && !course.hasPendingOrder && (course as any).type === 'PAID' && Number(course.price) > 0 && (
                  <div className="space-y-3">
                    <Button
                      onClick={handleBuy}
                      className="w-full cursor-pointer text-lg font-bold py-7 bg-slate-900 text-white hover:bg-blue-600 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center gap-2">Mua ngay — {Number(course.price).toLocaleString('vi-VN')}đ</span>
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                    </Button>
                    <Button
                      onClick={handleAddToCart}
                      variant="outline"
                      className={`w-full cursor-pointer py-5 border-2 ${inCart ? 'border-green-400 text-green-600 hover:bg-green-50' : 'border-gray-200 hover:border-blue-400 hover:text-blue-600'}`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {inCart ? 'Đã có trong giỏ hàng' : 'Thêm vào giỏ hàng'}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span>Đánh giá</span>
                  </div>
                  <span className="font-semibold">{Number(course.rating).toFixed(1)} / 5.0</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span>Học viên</span>
                  </div>
                  <span className="font-semibold">{Number(course.students).toLocaleString('en-US')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <PlayCircle className="h-5 w-5" />
                    <span>Bài học</span>
                  </div>
                  <span className="font-semibold">{course.lessons.length}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span>Tổng thời lượng</span>
                  </div>
                  <span className="font-semibold">
                    {Math.round(
                      course.lessons.reduce((acc, lesson) => {
                        const durationStr = lesson.duration || '0:0';
                        const parts = durationStr.split(':').map(Number);
                        // Handle HH:MM:SS or MM:SS
                        let mins = 0;
                        if (parts.length === 3) {
                          mins = parts[0] * 60 + parts[1];
                        } else if (parts.length === 2) {
                          mins = parts[0] + parts[1] / 60;
                        } else if (parts.length === 1) {
                          mins = parts[0];
                        }
                        return acc + mins;
                      }, 0) / 60
                    )}h
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
