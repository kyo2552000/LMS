'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Trash2, Key, Loader2, AlertCircle, Check, X,
    ShieldCheck, UserCog, Search, RefreshCw,
    Crown, GraduationCap, User, CheckCircle2, Ban
} from 'lucide-react';
import Pagination from '@/components/Pagination';
import Image from 'next/image';

interface UserRow {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
    avatar: string | null;
    bio: string | null;
    phone: string | null;
    created_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    ADMIN:      { label: 'Admin',      icon: Crown,          color: 'text-red-700',    bg: 'bg-red-100' },
    INSTRUCTOR: { label: 'Giảng viên', icon: GraduationCap,  color: 'text-blue-700',   bg: 'bg-blue-100' },
    STUDENT:    { label: 'Học viên',   icon: User,           color: 'text-green-700',  bg: 'bg-green-100' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    ACTIVE:   { label: 'Hoạt động',    color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
    INACTIVE: { label: 'Chưa kích hoạt', color: 'text-amber-700',  bg: 'bg-amber-100',   dot: 'bg-amber-400' },
    BANNED:   { label: 'Bị khóa',      color: 'text-red-700',    bg: 'bg-red-100',     dot: 'bg-red-500' },
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Reset password modal
    const [resetModal, setResetModal] = useState<{ userId: string; userName: string; email: string } | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);

    // Change role modal
    const [roleModal, setRoleModal] = useState<{ userId: string; userName: string; currentRole: string } | null>(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ userId: string; userName: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [changingRole, setChangingRole] = useState(false);

    const limit = 15;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (search.trim()) params.set('search', search.trim());
            const res = await fetch(`/api/admin/users?${params}`);
            const data = await res.json();
            setUsers(data.rows || []);
            setTotal(data.total || 0);
        } catch {
            setMessage({ type: 'error', text: 'Lỗi khi tải danh sách người dùng' });
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const deleteUser = async () => {
        if (!deleteModal) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/users?id=${deleteModal.userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deleteModal.userId }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
            setMessage({ type: 'success', text: `Đã xóa người dùng "${deleteModal.userName}"` });
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'error', text: (err as Error).message || 'Xóa thất bại' });
        } finally {
            setDeleting(false);
            setDeleteModal(null);
        }
    };

    
    const toggleBan = async (user: UserRow) => {
        const action = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
        const label  = action === 'BANNED' ? 'khóa tài khoản' : 'mở khóa tài khoản';
        if (!confirm(`Bạn muốn ${label} của "${user.name}"?`)) return;
        try {
            const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
            setMessage({ type: 'success', text: `Đã ${label} của "${user.name}"` });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: action } : u));
        } catch (err) {
            setMessage({ type: 'error', text: (err as Error).message || `${label} thất bại` });
        }
    };


    const handleChangeRole = async () => {
        if (!roleModal || !selectedRole || selectedRole === roleModal.currentRole) return;
        setChangingRole(true);
        try {
            const res = await fetch(`/api/admin/users/${encodeURIComponent(roleModal.userId)}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedRole }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
            setMessage({ type: 'success', text: `Đã đổi vai trò của "${roleModal.userName}" thành ${selectedRole}` });
            setUsers(prev => prev.map(u => u.id === roleModal.userId ? { ...u, role: selectedRole as UserRow['role'] } : u));
            setRoleModal(null);
        } catch (err) {
            setMessage({ type: 'error', text: (err as Error).message || 'Đổi vai trò thất bại' });
        } finally {
            setChangingRole(false);
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
            setMessage({ type: 'success', text: `Đặt lại mật khẩu cho "${resetModal.userName}" thành công!` });
            setResetModal(null);
            setNewPassword('');
        } catch (err) {
            setMessage({ type: 'error', text: (err as Error).message || 'Đặt lại mật khẩu thất bại' });
        } finally {
            setResetting(false);
        }
    };

    const totalPages = Math.ceil(total / limit);
    const activeCount = users.filter((user) => user.status === 'ACTIVE').length;
    const instructorCount = users.filter((user) => user.role === 'INSTRUCTOR').length;
    const bannedCount = users.filter((user) => user.status === 'BANNED').length;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Người Dùng</h1>
                    <p className="text-slate-500 mt-1">{total.toLocaleString()} người dùng trong hệ thống</p>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng người dùng</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{total.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hoạt động</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Giảng viên</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{instructorCount}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bị khóa</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{bannedCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Toast Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm font-medium ${
                    message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex space-x-2">
                    {/* Placeholder for tabs if needed in future */}
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm người dùng..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                    </div>
                    <Button variant="outline" onClick={fetchUsers} className="rounded-lg border border-slate-200 cursor-pointer h-9 px-3">
                        <RefreshCw className="h-4 w-4 text-slate-500" />
                    </Button>
                </div>
            </div>

            {/* ── Reset Password Modal ── */}
            {resetModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white rounded-xl shadow-2xl border-0 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Key className="h-5 w-5 text-amber-500" />
                                Đặt lại mật khẩu
                            </h3>
                            <button onClick={() => { setResetModal(null); setNewPassword(''); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-sm font-semibold text-slate-800">{resetModal.userName}</p>
                                <p className="text-xs text-slate-500">{resetModal.email}</p>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Mật khẩu mới</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu mới (≥ 6 ký tự)"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                <p className="text-xs text-slate-400 mt-1">Mật khẩu sẽ được hash bằng bcrypt trước khi lưu</p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <Button variant="outline" onClick={() => { setResetModal(null); setNewPassword(''); }} className="border-slate-300 text-slate-700 cursor-pointer">
                                Hủy bỏ
                            </Button>
                            <Button onClick={handleResetPassword} disabled={resetting || newPassword.length < 6} className="bg-amber-500 hover:bg-amber-600 text-white cursor-pointer w-32">
                                {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Đặt lại'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* ── Delete User Modal ── */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white rounded-xl shadow-2xl border-0 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Xác nhận xóa
                            </h3>
                            <button onClick={() => setDeleteModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-4">Bạn có chắc chắn muốn xóa người dùng <span className="font-bold text-slate-900">{deleteModal.userName}</span>? Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu liên quan.</p>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <Button variant="outline" onClick={() => setDeleteModal(null)} className="border-slate-300 text-slate-700 cursor-pointer">
                                Hủy bỏ
                            </Button>
                            <Button onClick={deleteUser} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer w-32">
                                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Xóa vĩnh viễn'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* ── Change Role Modal ── */}
            {roleModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white rounded-xl shadow-2xl border-0 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <UserCog className="h-5 w-5 text-indigo-500" />
                                Đổi vai trò
                            </h3>
                            <button onClick={() => setRoleModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-sm font-semibold text-slate-800">{roleModal.userName}</p>
                                <p className="text-xs text-slate-500">Vai trò hiện tại: <strong>{ROLE_CONFIG[roleModal.currentRole]?.label}</strong></p>
                            </div>
                            <div className="space-y-2 mb-4">
                                {(['STUDENT', 'INSTRUCTOR', 'ADMIN'] as const).map((role) => {
                                    const cfg = ROLE_CONFIG[role];
                                    const Icon = cfg.icon;
                                    return (
                                        <button
                                            key={role}
                                            onClick={() => setSelectedRole(role)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left cursor-pointer ${
                                                selectedRole === role ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded border flex items-center justify-center ${cfg.bg} border-${cfg.bg.split('-')[1]}-200`}>
                                                <Icon className={`h-4 w-4 ${cfg.color}`} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800">{cfg.label}</p>
                                                <p className="text-[10px] text-slate-500">{role}</p>
                                            </div>
                                            {selectedRole === role && <CheckCircle2 className="h-5 w-5 text-indigo-500 ml-auto" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <Button variant="outline" onClick={() => setRoleModal(null)} className="border-slate-300 text-slate-700 cursor-pointer">Hủy bỏ</Button>
                            <Button
                                onClick={handleChangeRole}
                                disabled={changingRole || !selectedRole || selectedRole === roleModal.currentRole}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer w-32"
                            >
                                {changingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Xác nhận đổi'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* ── Users Table ── */}
            <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Người dùng</th>
                                        <th className="px-6 py-4">Vai trò</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4">Ngày tạo</th>
                                        <th className="px-6 py-4 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {users.length > 0 ? users.map((user) => {
                                        const roleCfg = ROLE_CONFIG[user.role];
                                        const statusCfg = STATUS_CONFIG[user.status] || STATUS_CONFIG.INACTIVE;
                                        const RoleIcon = roleCfg?.icon || User;
                                        return (
                                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center border border-slate-300">
                                                            {user.avatar ? (
                                                                <Image src={user.avatar} alt={user.name} width={40} height={40} className="object-cover w-full h-full" />
                                                            ) : (
                                                                <span className="text-slate-500 font-bold">{user.name.charAt(0).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                                                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold border ${roleCfg?.bg} ${roleCfg?.color} border-${roleCfg?.bg.split('-')[1]}-200`}>
                                                        <RoleIcon className="h-3 w-3" />
                                                        {roleCfg?.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.color} border-${statusCfg.bg.split('-')[1]}-200`}>
                                                        {statusCfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <Button size="sm" variant="ghost"
                                                            onClick={() => { setRoleModal({ userId: user.id, userName: user.name, currentRole: user.role }); setSelectedRole(user.role); }}
                                                            className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 cursor-pointer" title="Đổi vai trò">
                                                            <UserCog className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost"
                                                            onClick={() => toggleBan(user)}
                                                            className={`h-8 w-8 p-0 cursor-pointer ${user.status === 'BANNED' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                                                            title={user.status === 'BANNED' ? 'Mở khóa' : 'Khóa tài khoản'}>
                                                            {user.status === 'BANNED' ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                                        </Button>
                                                        <Button size="sm" variant="ghost"
                                                            onClick={() => setResetModal({ userId: user.id, userName: user.name, email: user.email })}
                                                            className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600 cursor-pointer" title="Đặt lại mật khẩu">
                                                            <Key className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost"
                                                            onClick={() => setDeleteModal({ userId: user.id, userName: user.name })}
                                                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 cursor-pointer" title="Xóa người dùng">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-500">
                                                Không tìm thấy người dùng nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {totalPages > 1 && (
                        <div className="border-t border-slate-200 p-4 bg-white">
                            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
