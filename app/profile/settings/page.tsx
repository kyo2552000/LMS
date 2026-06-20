'use client';

import { useState } from 'react';
import { Check, AlertCircle, Key, Loader2 } from 'lucide-react';

export default function ProfileSettings() {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            return setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' });
        }
        if (form.newPassword !== form.confirmPassword) {
            return setMessage({ type: 'error', text: 'Mật khẩu mới không khớp' });
        }
        if (form.newPassword.length < 6) {
            return setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (e: unknown) {
            setMessage({ type: 'error', text: (e as { message?: string }).message || 'Lỗi không xác định' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Settings</h2>
            <p className="text-sm text-gray-500 mb-6">Quản lý bảo mật tài khoản</p>

            {message && (
                <div className={`mb-5 p-3 rounded-xl flex items-center gap-2 text-sm ${message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {message.text}
                </div>
            )}

            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Key className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Đổi mật khẩu</h3>
                    <p className="text-xs text-gray-400">Cập nhật mật khẩu đăng nhập của bạn</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mật khẩu hiện tại</label>
                    <input
                        type="password"
                        value={form.currentPassword}
                        onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div>
                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mật khẩu mới</label>
                    <input
                        type="password"
                        value={form.newPassword}
                        onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                        placeholder="Ít nhất 6 ký tự"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div>
                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Xác nhận mật khẩu mới</label>
                    <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-50 transition-colors"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Lưu mật khẩu
                </button>
            </form>
        </div>
    );
}
