'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Check, AlertCircle, Loader2, Camera } from 'lucide-react';

interface ProfileStats {
    total: number;
    completed: number;
    in_progress: number;
}

export default function ProfileAccountPage() {
    const { user, refreshUser } = useAuth();
    const [form, setForm] = useState({ name: '', bio: '', phone: '', avatar: '' });
    const [stats, setStats] = useState<ProfileStats>({ total: 0, completed: 0, in_progress: 0 });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/profile')
            .then(r => r.json())
            .then(data => {
                setForm({
                    name: data.profile?.name || '',
                    bio: data.profile?.bio || '',
                    phone: data.profile?.phone || '',
                    avatar: data.profile?.avatar || '',
                });
                setStats(data.stats || { total: 0, completed: 0, in_progress: 0 });
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const handleSave = async () => {
        if (!form.name.trim()) return setMessage({ type: 'error', text: 'Tên là bắt buộc' });
        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
            if (refreshUser) refreshUser();
        } catch (e: unknown) {
            setMessage({ type: 'error', text: (e as { message?: string }).message || 'Lỗi không xác định' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Your Courses', value: stats.total, color: 'from-red-400 to-red-500' },
                    { label: 'In Progress', value: stats.in_progress, color: 'from-orange-400 to-orange-500' },
                    { label: 'Completed', value: stats.completed, color: 'from-green-400 to-green-500' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-3`}>
                            <span className="text-white text-lg font-bold">{s.value}</span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Edit Form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Edit Profile</h2>

                {message && (
                    <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {message.text}
                    </div>
                )}

                {/* Avatar */}
                <div className="flex items-center gap-5 mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                            {form.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={form.avatar} alt={user?.name || ''} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-2xl font-bold">{form.name.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer">
                            <Camera className="h-3 w-3 text-white" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Avatar URL</label>
                        <input
                            value={form.avatar}
                            onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
                            placeholder="https://example.com/avatar.jpg"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Họ tên *</label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Nhập họ tên..."
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
                        <input
                            value={user?.email || ''}
                            disabled
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Số điện thoại</label>
                        <input
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="+84 xxx xxx xxx"
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Bio</label>
                        <textarea
                            value={form.bio}
                            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                            placeholder="Giới thiệu bản thân..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-5 flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Lưu thay đổi
                </button>
            </div>
        </div>
    );
}
