'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/contexts/ToastContext';

export interface AppNotification {
  id: string;
  type: 'COURSE' | 'LESSON' | 'QUIZ' | 'CERTIFICATE' | 'SYSTEM' | 'PAYMENT' | 'DISCUSSION';
  title: string;
  body: string;
  href?: string;
  entity_id?: string | null;
  read: boolean;
  created_at: string;
}

const typeLabels: Record<AppNotification['type'], string> = {
  COURSE: 'Khóa học',
  LESSON: 'Bài học',
  QUIZ: 'Bài kiểm tra',
  CERTIFICATE: 'Chứng chỉ',
  SYSTEM: 'Hệ thống',
  PAYMENT: 'Thanh toán',
  DISCUSSION: 'Thảo luận',
};

export default function NotificationsMenu() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const unreadCount = useMemo(() => items.filter(item => !item.read).length, [items]);

  const load = async (isInitial = false) => {
    if (!user) return;
    if (isInitial) setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.status === 401) return;
      const data = await res.json();
      const newItems = data.notifications || [];
      
      // If we have new unread items and it's not the first load, show a toast
      if (!isInitial && newItems.length > 0) {
        const newUnread = newItems.filter((n: any) => !n.read);
        const oldUnreadIds = items.filter(n => !n.read).map(n => n.id);
        const reallyNew = newUnread.filter((n: any) => !oldUnreadIds.includes(n.id));
        
        if (reallyNew.length > 0) {
          showToast(`Bạn có thông báo mới: ${reallyNew[0].title}`, 'info');
        }
      }

      setItems(newItems);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void load(true);
    const timer = window.setInterval(() => void load(false), 15000);
    const onFocus = () => void load(false);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [user]);

  const markAllRead = async () => {
    const res = await fetch('/api/notifications', { method: 'PUT' });
    if (res.ok) setItems(prev => prev.map(item => ({ ...item, read: true })));
  };

  const markOneRead = async (id: string) => {
    const res = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: 'PUT' });
    if (res.ok) setItems(prev => prev.map(item => (item.id === id ? { ...item, read: true } : item)));
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(v => !v)} className="relative cursor-pointer text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="Thông báo">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900">Thông báo</h3>
              <p className="text-xs text-slate-500">{unreadCount} chưa đọc</p>
            </div>
            <button onClick={markAllRead} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <CheckCheck className="h-3.5 w-3.5" /> Đánh dấu đã đọc
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-10 flex justify-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">Chưa có thông báo nào</div>
            ) : items.map(item => (
              <div key={item.id} className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${item.read ? 'opacity-70' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{typeLabels[item.type]}</p>
                  {!item.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                </div>
                {item.href ? (
                  <Link href={item.href} onClick={() => { setOpen(false); void markOneRead(item.id); }}>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.body}</p>
                  </Link>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.body}</p>
                  </>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString('vi-VN')}</p>
                  {!item.read && <button onClick={() => void markOneRead(item.id)} className="text-[11px] text-blue-600 hover:text-blue-700 font-medium">Đọc</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
