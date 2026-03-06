'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BookOpen, FolderOpen, GraduationCap, Star, MessageSquare, Database } from 'lucide-react';

interface TableInfo {
  name: string;
  rows: number;
}

const tableIcons: Record<string, React.ReactNode> = {
  users: <Users className="h-5 w-5" />,
  courses: <BookOpen className="h-5 w-5" />,
  categories: <FolderOpen className="h-5 w-5" />,
  enrollments: <GraduationCap className="h-5 w-5" />,
  reviews: <Star className="h-5 w-5" />,
  lessons: <BookOpen className="h-5 w-5" />,
  chat_messages: <MessageSquare className="h-5 w-5" />,
  lesson_progress: <Database className="h-5 w-5" />,
};

const tableColors: Record<string, string> = {
  users: 'from-blue-500 to-blue-600',
  courses: 'from-purple-500 to-purple-600',
  categories: 'from-pink-500 to-pink-600',
  enrollments: 'from-green-500 to-green-600',
  reviews: 'from-amber-500 to-amber-600',
  lessons: 'from-indigo-500 to-indigo-600',
  chat_messages: 'from-teal-500 to-teal-600',
  lesson_progress: 'from-rose-500 to-rose-600',
};

const tableLabels: Record<string, string> = {
  users: 'Người dùng',
  courses: 'Khóa học',
  categories: 'Danh mục',
  enrollments: 'Ghi danh',
  reviews: 'Đánh giá',
  lessons: 'Bài học',
  orders: 'Đơn hàng',
  chat_messages: 'Tin nhắn chat',
  lesson_progress: 'Tiến độ bài học',
};

export default function AdminPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin')
      .then((res) => res.json())
      .then((data) => setTables(data.tables || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRecords = useMemo(() => tables.reduce((sum, table) => sum + table.rows, 0), [tables]);
  const sortedTables = useMemo(() => [...tables].sort((a, b) => b.rows - a.rows), [tables]);
  const maxRows = useMemo(() => sortedTables[0]?.rows || 1, [sortedTables]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan dữ liệu</h1>
        <p className="text-gray-500 mt-1">Quản lý các bảng trong cơ sở dữ liệu của bạn</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl animate-pulse shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <Card key={table.name} className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{tableLabels[table.name] || table.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{table.rows}</p>
                    <p className="text-xs text-gray-400 mt-0.5">bản ghi</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tableColors[table.name] || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white`}>
                    {tableIcons[table.name] || <Database className="h-5 w-5" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Biểu đồ tổng quát</h3>
            <p className="text-sm text-gray-500 mb-5">
              Tổng số bản ghi: <span className="font-semibold text-gray-900">{totalRecords}</span>
            </p>

            <div className="space-y-3">
              {sortedTables.map((table) => {
                const percent = Math.max(6, Math.round((table.rows / maxRows) * 100));
                return (
                  <div key={`chart-${table.name}`}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-600 font-medium uppercase tracking-wide">{tableLabels[table.name] || table.name}</span>
                      <span className="text-gray-500">{table.rows} bản ghi</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${tableColors[table.name] || 'from-gray-500 to-gray-600'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {sortedTables.length === 0 && (
                <p className="text-sm text-gray-500">Chưa có dữ liệu để hiển thị biểu đồ.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Truy vấn SQL', href: '/admin/sql', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
                { label: 'Quản lý người dùng', href: '/admin/users', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
                { label: 'Quản lý khóa học', href: '/admin/courses', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
                { label: 'Danh mục', href: '/admin/categories', color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
              ].map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className={`px-4 py-3 rounded-lg text-sm font-medium text-center transition-colors ${action.color}`}
                >
                  {action.label}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
