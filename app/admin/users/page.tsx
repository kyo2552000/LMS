'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Key, Loader2, AlertCircle, Check, X } from 'lucide-react';
import Pagination from '@/components/Pagination';

interface UserRow {
    id: string;
    email: string;
    name: string;
    role: string;
    bio: string;
    avatar: string;
    created_at: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Reset password modal
    const [resetModal, setResetModal] = useState<{ userId: string; userName: string; email: string } | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);

    const limit = 15;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?page=${page}&limit=${limit}`);
            const data = await res.json();
            setUsers(data.rows || []);
            setTotal(data.total || 0);
        } catch {
            setMessage({ type: 'error', text: 'Lỗi khi tải danh sách người dùng' });
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const deleteUser = async (id: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa người dùng này?')) return;
        try {
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            setMessage({ type: 'success', text: 'Xóa thành công!' });
            fetchUsers();
        } catch (err: unknown) {
            const e = err as { message?: string };
            setMessage({ type: 'error', text: e.message || 'Xóa thất bại' });
        }
    };

    const handleResetPassword = async () => {
        if (!resetModal || !newPassword) return;
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự' });
            return;
        }

        setResetting(true);
        try {
            const res = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: resetModal.userId, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setMessage({ type: 'success', text: `Đặt lại mật khẩu cho ${resetModal.userName} thành công!` });
            setResetModal(null);
            setNewPassword('');
        } catch (err: unknown) {
            const e = err as { message?: string };
            setMessage({ type: 'error', text: e.message || 'Đặt lại mật khẩu thất bại' });
        } finally {
            setResetting(false);
        }
    };

    const totalPages = Math.ceil(total / limit);

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            ADMIN: 'bg-red-100 text-red-700',
            INSTRUCTOR: 'bg-blue-100 text-blue-700',
            STUDENT: 'bg-green-100 text-green-700',
        };
        return styles[role] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Người dùng</h1>
                    <p className="text-gray-500 mt-1">{total} người dùng trong cơ sở dữ liệu</p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`mb-4 p-3 rounded-lg flex items-center space-x-2 text-sm ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                >
                    {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <Card className="w-full max-w-md rounded-2xl border-0 shadow-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center space-x-2">
                                    <Key className="h-5 w-5 text-amber-500" />
                                    <span>Đặt lại mật khẩu</span>
                                </h3>
                                <button onClick={() => { setResetModal(null); setNewPassword(''); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-900">{resetModal.userName}</p>
                                <p className="text-xs text-gray-500">{resetModal.email}</p>
                            </div>

                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700 block mb-1.5">Mật khẩu mới</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Mật khẩu sẽ được hash bằng bcrypt trước khi lưu vào database
                                </p>
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    onClick={handleResetPassword}
                                    disabled={resetting || newPassword.length < 6}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                                >
                                    {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                                    Đặt lại mật khẩu
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => { setResetModal(null); setNewPassword(''); }}
                                    className="cursor-pointer"
                                >
                                    Hủy
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Table */}
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Tên</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Email</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Vai trò</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Bio</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Ngày tạo</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 text-xs uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                    <span className="font-medium text-gray-900">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{user.bio || '—'}</td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setResetModal({ userId: user.id, userName: user.name, email: user.email })}
                                                        className="h-7 px-2 text-amber-600 hover:bg-amber-50 cursor-pointer"
                                                        title="Đặt lại mật khẩu"
                                                    >
                                                        <Key className="h-3.5 w-3.5 mr-1" />
                                                        <span className="text-xs">Đặt lại mật khẩu</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteUser(user.id)}
                                                        className="h-7 px-2 text-red-500 hover:bg-red-50 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-gray-400">Không tìm thấy người dùng</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
                </CardContent>
            </Card>
        </div>
    );
}
