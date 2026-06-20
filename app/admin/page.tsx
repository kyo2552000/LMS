'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users, BookOpen, FolderOpen, GraduationCap, Star, MessageSquare,
  Database, DollarSign, TrendingUp, ShoppingCart, Clock, ArrowUpRight, CheckCircle2, Heart,
} from 'lucide-react';
import Link from 'next/link';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  ComposedChart, Area, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

interface TableInfo {
  name: string;
  rows: number;
}

interface RecentOrder {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  user_name: string;
  course_title: string;
}

interface RecentEnrollment {
  id: string;
  enrolled_at: string;
  status: string;
  user_name: string;
  course_title: string;
}

const tableLabels: Record<string, string> = {
  users: 'Học viên',
  courses: 'Khóa học',
  categories: 'Danh mục',
  enrollments: 'Lượt tham gia',
  reviews: 'Đánh giá',
  lessons: 'Bài học',
  orders: 'Đơn hàng',
  chat_messages: 'Tin nhắn',
  lesson_progress: 'Lượt học',
};

const tableLinks: Record<string, string> = {
  users: '/admin/users',
  courses: '/admin/courses',
  categories: '/admin/categories',
  enrollments: '/admin/enrollments',
  reviews: '/admin/reviews',
  lessons: '/admin/lessons',
  orders: '/admin/orders',
  chat_messages: '/admin/chat',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [courseRevenue, setCourseRevenue] = useState<any[]>([]);
  const [topFavorites, setTopFavorites] = useState<any[]>([]);
  const [totalFavorites, setTotalFavorites] = useState(0);

  useEffect(() => {
    fetch('/api/admin')
      .then((res) => res.json())
      .then((data) => {
        setTables(data.tables || []);
        setTotalRevenue(data.totalRevenue || 0);
        setMonthRevenue(data.monthRevenue || 0);
        setRecentOrders(data.recentOrders || []);
        setRecentEnrollments(data.recentEnrollments || []);
        
        const rawChart = Array.isArray(data.revenueChartData) ? data.revenueChartData : [];
        setChartData(
          rawChart.map((d: { date?: string; total?: unknown; students?: unknown }) => ({
            date: d.date ?? '',
            total: Number(d.total ?? 0),
            students: Number(d.students ?? 0),
          }))
        );
        setCourseRevenue(data.courseRevenue?.map((d: any) => ({ ...d, total: Number(d.total) })) || []);
        setTopFavorites(data.topFavorites || []);
        setTotalFavorites(data.totalFavorites || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getCount = (name: string) => tables.find(t => t.name === name)?.rows || 0;
  
  // Tính tổng records cho overview
  const totalRecords = useMemo(() => tables.reduce((sum, table) => sum + table.rows, 0), [tables]);
  const monthlyRevenueRate = useMemo(() => {
    if (totalRevenue <= 0) return 0;
    return Math.round((monthRevenue / totalRevenue) * 100);
  }, [monthRevenue, totalRevenue]);
  const recentCompletedEnrollments = useMemo(() => recentEnrollments.filter((item) => item.status === 'COMPLETED').length, [recentEnrollments]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-white rounded-3xl animate-pulse shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Tổng quan hiệu suất kinh doanh, học viên và tiến độ vận hành hệ thống.</p>
      </div>

      {/* Tilted / Gradient Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* DOANH THU CARD - Gradient Bóng bẩy */}
        <Card className="rounded-[24px] border-0 shadow-lg shadow-emerald-500/20 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white overflow-hidden relative">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-100/90 text-[13px] font-semibold uppercase tracking-wider mb-2">Doanh thu tổng</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black tracking-tight">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-50 bg-white/10 w-max px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-semibold">Tháng này: {formatCurrency(monthRevenue)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-50 bg-white/10 w-max px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <ArrowUpRight className="w-4 h-4" />
                      <span className="text-xs font-semibold">{monthlyRevenueRate}% doanh thu</span>
                  </div>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HỌC VIÊN CARD */}
        <Card className="rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-[13px] font-semibold uppercase tracking-wider mb-2">Học viên</p>
                <p className="text-3xl font-black text-slate-800 tracking-tight">{getCount('users').toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-1.5 text-blue-600 bg-blue-50 w-max px-3 py-1.5 rounded-full">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-xs font-bold">{getCount('enrollments').toLocaleString()} lượt ghi danh</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm text-blue-600 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <Users className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KHÓA HỌC CARD */}
        <Card className="rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-[13px] font-semibold uppercase tracking-wider mb-2">Khóa học & Bài giảng</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{getCount('courses')}</p>
                    <span className="text-sm font-medium text-slate-400">cấp độ</span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-violet-600 bg-violet-50 w-max px-3 py-1.5 rounded-full">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs font-bold">{getCount('lessons')} video/bài giảng</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center border border-violet-100 shadow-sm text-violet-600 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <FolderOpen className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* YÊU THÍCH CARD */}
        <Card className="rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-[13px] font-semibold uppercase tracking-wider mb-2">Yêu thích & Đánh giá</p>
                <p className="text-3xl font-black text-slate-800 tracking-tight">{totalFavorites.toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-1.5 text-rose-600 bg-rose-50 w-max px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4" />
                    <span className="text-xs font-bold">{getCount('reviews')} đánh giá KH</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100 shadow-sm text-rose-500 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <Heart className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ + System Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* REVENUE CHART */}
        <Card className="rounded-[24px] border border-slate-100 shadow-sm bg-white lg:col-span-2 overflow-hidden flex flex-col">
          <CardContent className="p-6 pb-2 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Hiệu suất Doanh thu & Học viên</h3>
                <p className="text-sm text-slate-500 font-medium">Theo dõi song song tài chính và số lượng học viên ghi danh mỗi ngày.</p>
              </div>
            </div>
          </CardContent>
          <div className="flex-1 p-6 pl-0 pt-4 relative min-h-[300px]">
            {chartData.length === 0 && (
              <p className="absolute inset-0 z-10 flex items-center justify-center text-sm font-medium text-slate-400 bg-white/60 rounded-lg mx-6 px-4 text-center">
                Chưa có dữ liệu doanh thu hoặc ghi danh trong 30 ngày gần đây.
              </p>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (Number(v)/1000).toLocaleString() + 'k'} />
                <YAxis yAxisId="right" orientation="right" stroke="#6366f1" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <RechartsTooltip 
                    formatter={(value: any, name: any) => [name === 'total' ? formatCurrency(Number(value) || 0) : value, name === 'total' ? "Doanh thu" : "Học viên"]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area yAxisId="left" type="monotone" dataKey="total" name="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                <Bar yAxisId="right" dataKey="students" name="students" barSize={20} fill="#6366f1" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* THAO TÁC DATA NHANH */}
        <Card className="rounded-[24px] border border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 mix-blend-overlay"></div>
           <div className="text-center z-10 w-full">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4 border-4 border-white shadow-xl">
                    <Database className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Cơ sở dữ liệu</h3>
                <p className="text-slate-500 mt-1 max-w-xs mx-auto">Hệ thống đang lưu trữ Tổng cộng <strong className="text-indigo-600 px-1">{totalRecords.toLocaleString()}</strong> bản ghi an toàn.</p>
                
                <div className="mt-8 space-y-3">
                   {tables.slice(0, 4).map(t => {
                      const href = tableLinks[t.name];
                      return (
                        <Link key={t.name} href={href || '#'} className="flex items-center justify-between text-sm px-4 py-2 bg-slate-50 rounded-xl border border-slate-100/50 hover:bg-slate-100 transition-colors">
                            <span className="font-medium text-slate-600 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                {tableLabels[t.name] || t.name}
                            </span>
                            <span className="font-bold text-slate-800">{t.rows}</span>
                        </Link>
                      );
                   })}
                </div>

                <Link href="/admin/courses" className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-slate-900 border border-transparent rounded-xl px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer">
                    Thiết lập Dữ liệu 
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </Link>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* COURSE REVENUE DISTRIBUTION */}
        <Card className="rounded-[24px] border border-slate-100 shadow-sm bg-white overflow-hidden xl:col-span-1">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Phân Phối Doanh Thu</h3>
              <p className="text-sm text-slate-500 font-medium">Top 5 khóa học bán chạy nhất.</p>
            </div>
            {courseRevenue.length === 0 ? (
               <p className="p-10 text-center text-slate-400">Chưa có dữ liệu khóa học</p>
            ) : (
                <div className="p-4" style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={courseRevenue}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="total"
                          >
                            {courseRevenue.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                             formatter={(val: any) => formatCurrency(Number(val) || 0)} 
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                          />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
          </CardContent>
        </Card>

      {/* DỮ LIỆU GIAO DỊCH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:col-span-2">
        
        {/* RECENT ORDERS */}
        <Card className="rounded-[24px] border border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-emerald-50/30">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                Đơn hàng Mới nhất
              </h3>
              <Link href="/admin/orders" className="text-sm text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl cursor-pointer">
                Tất cả →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center font-medium">Chưa có giao dịch nào gần đây</p>
            ) : (
              <div className="p-6 space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 uppercase border border-slate-200 shadow-sm">
                            {order.user_name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[15px] font-bold text-slate-800 truncate">{order.user_name}</p>
                            <p className="text-[13px] text-slate-500 truncate max-w-[200px]">{order.course_title}</p>
                        </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-black text-emerald-600">{formatCurrency(order.amount)}</p>
                      <div className="flex items-center gap-1.5 mt-1 justify-end">
                        <span className={`inline-block w-2 h-2 rounded-full ${order.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-xs font-semibold text-slate-500">{order.status === 'PAID' ? 'Đã thanh toán' : 'Chờ xử lý'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RECENT ENROLLMENTS */}
        <Card className="rounded-[24px] border border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-blue-50/30">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Lượt Học Viên Ghi Danh
              </h3>
              <Link href="/admin/enrollments" className="text-sm text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-xl cursor-pointer">
                Tất cả →
              </Link>
            </div>
            {recentEnrollments.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center font-medium">Chưa có người dùng ghi danh mới</p>
            ) : (
              <div className="p-6 space-y-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-blue-700 font-medium flex items-center justify-between">
                  <span>Ghi danh hoàn thành gần đây</span>
                  <span className="font-black">{recentCompletedEnrollments}</span>
                </div>
                {recentEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[15px] font-bold text-slate-800 truncate">{enrollment.user_name}</p>
                            <p className="text-[13px] text-slate-500 truncate max-w-[200px]">{enrollment.course_title}</p>
                        </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[11px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-md mb-1 inline-block ${enrollment.status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-600' :
                        enrollment.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {enrollment.status === 'ACTIVE' ? 'ĐANG THEO HỌC' : enrollment.status === 'COMPLETED' ? 'HOÀN THÀNH 100%' : enrollment.status}
                      </span>
                      <p className="text-xs font-medium text-slate-400 block">{formatDate(enrollment.enrolled_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>

      {/* TOP FAVORITES */}
      {topFavorites.length > 0 && (
        <Card className="rounded-[24px] border border-slate-100 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-rose-50/30">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                Khóa học được yêu thích nhất
              </h3>
              <span className="text-sm text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-xl">{totalFavorites} lượt thích</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {topFavorites.map((fav, index) => (
                  <div key={fav.id} className="flex flex-col items-center p-4 rounded-2xl border border-slate-100 hover:shadow-md transition-all text-center group">
                    <div className="relative mb-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm">
                        {fav.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={fav.image} alt={fav.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400"><BookOpen className="h-6 w-6" /></div>
                        )}
                      </div>
                      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md ${
                        index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-rose-600 transition-colors">{fav.title}</p>
                    <div className="flex items-center gap-1 text-rose-500">
                      <Heart className="h-3.5 w-3.5 fill-rose-500" />
                      <span className="text-xs font-extrabold">{Number(fav.favorite_count)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
