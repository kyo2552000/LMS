'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Shield, Crown, User, GraduationCap, Plus, Search,
    MoreVertical, Edit2, Trash2, Users, Calendar,
    Loader2, Check, AlertCircle, X, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Role {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    permission_count: number;
    user_count: number;
    created_at: string;
}

interface Permission {
    id: string;
    name: string;
    description: string;
    module: string;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
    crown: Crown,
    shield: Shield,
    'graduation-cap': GraduationCap,
    user: User,
};

const ROLE_COLORS: Record<string, { bg: string; icon: string; text: string; border: string }> = {
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600', border: 'border-purple-200' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',       text: 'text-red-600',    border: 'border-red-200'    },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',   text: 'text-green-600',  border: 'border-green-200'  },
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',     text: 'text-blue-600',   border: 'border-blue-200'   },
    amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-600',   text: 'text-amber-600',  border: 'border-amber-200'  },
    gray:   { bg: 'bg-gray-50',   icon: 'bg-gray-100 text-gray-600',     text: 'text-gray-600',   border: 'border-gray-200'   },
};

const DEFAULT_COLORS = ['blue', 'purple', 'green', 'red', 'amber', 'gray'];
const DEFAULT_ICONS = ['shield', 'crown', 'graduation-cap', 'user'];

const emptyForm = {
    id: '',
    name: '',
    description: '',
    color: 'blue',
    icon: 'shield',
    permission_ids: [] as string[],
};

export default function AdminRolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [permGrouped, setPermGrouped] = useState<Record<string, Permission[]>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    // Modal state
    const [modal, setModal] = useState<'add' | 'edit' | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [rolesRes, permsRes] = await Promise.all([
            fetch('/api/admin/roles'),
            fetch('/api/admin/permissions'),
        ]);
        const rolesData = await rolesRes.json();
        const permsData = await permsRes.json();
        setRoles(rolesData.roles || []);
        setPermissions(permsData.permissions || []);
        setPermGrouped(permsData.grouped || {});
        // expand all modules by default
        const expanded: Record<string, boolean> = {};
        Object.keys(permsData.grouped || {}).forEach(m => { expanded[m] = true; });
        setExpandedModules(expanded);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const showMsg = (type: 'success' | 'error', text: string) => setMessage({ type, text });

    const openAdd = () => {
        setForm(emptyForm);
        setModal('add');
    };

    const openEdit = async (role: Role) => {
        // Fetch role's current permissions
        const res = await fetch(`/api/admin/roles`);
        // Get permission IDs for this role from the full list (re-fetch or query)
        const permsRes = await fetch('/api/admin/permissions');
        await permsRes.json(); // already have it
        setForm({
            id: role.id,
            name: role.name,
            description: role.description || '',
            color: role.color || 'blue',
            icon: role.icon || 'shield',
            permission_ids: [], // Will be loaded below
        });
        // Fetch role-specific permissions
        const rpRes = await fetch(`/api/admin/roles?id=${role.id}`);
        if (rpRes.ok) {
            const rpData = await rpRes.json();
            const rolePerms = (rpData.role_permissions || []).map((p: { id: string }) => p.id);
            setForm(f => ({ ...f, permission_ids: rolePerms }));
        }
        void res;
        setModal('edit');
        setOpenMenu(null);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return showMsg('error', 'Tên vai trò là bắt buộc');
        setSaving(true);
        try {
            const method = modal === 'add' ? 'POST' : 'PUT';
            const res = await fetch('/api/admin/roles', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showMsg('success', modal === 'add' ? 'Tạo vai trò thành công!' : 'Cập nhật thành công!');
            setModal(null);
            fetchData();
        } catch (e: unknown) {
            showMsg('error', (e as { message?: string }).message || 'Lỗi không xác định');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            const res = await fetch('/api/admin/roles', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deleteConfirm.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showMsg('success', 'Xóa vai trò thành công!');
            setDeleteConfirm(null);
            fetchData();
        } catch (e: unknown) {
            showMsg('error', (e as { message?: string }).message || 'Lỗi không xác định');
            setDeleteConfirm(null);
        }
    };

    const togglePermission = (pid: string) => {
        setForm(f => ({
            ...f,
            permission_ids: f.permission_ids.includes(pid)
                ? f.permission_ids.filter(p => p !== pid)
                : [...f.permission_ids, pid],
        }));
    };

    const toggleModule = (module: string, pids: string[]) => {
        const allSelected = pids.every(pid => form.permission_ids.includes(pid));
        setForm(f => ({
            ...f,
            permission_ids: allSelected
                ? f.permission_ids.filter(p => !pids.includes(p))
                : [...new Set([...f.permission_ids, ...pids])],
        }));
    };

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase())
    );
    const totalPermissions = permissions.length;
    const totalUsers = roles.reduce((sum, role) => sum + Number(role.user_count || 0), 0);

    const getColors = (color: string) => ROLE_COLORS[color] || ROLE_COLORS['blue'];

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Vai Trò</h1>
                    <p className="text-slate-500 mt-1">Quản lý vai trò và phân quyền trong toàn hệ thống</p>
                </div>
                <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm text-white h-10 px-5">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm vai trò
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tổng vai trò</p>
                    <p className="text-2xl font-bold text-slate-900">{roles.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tổng quyền</p>
                    <p className="text-2xl font-bold text-slate-900">{totalPermissions}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Người dùng gắn vai trò</p>
                    <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
                </div>
            </div>

            {/* Toast Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Search */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="text-sm text-slate-500 font-semibold">
                    {filteredRoles.length} vai trò
                </div>
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        placeholder="Tìm kiếm vai trò..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Roles Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : filteredRoles.length === 0 ? (
                <div className="text-center py-24 text-gray-400">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Không tìm thấy vai trò nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
                    {filteredRoles.map((role) => {
                        const colors = getColors(role.color);
                        const IconComp = ROLE_ICONS[role.icon] || Shield;
                        return (
                            <div
                                key={role.id}
                                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow relative group"
                            >
                                {/* Three-dot menu */}
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={() => setOpenMenu(openMenu === role.id ? null : role.id)}
                                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                    {openMenu === role.id && (
                                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36 z-20">
                                            <button
                                                onClick={() => openEdit(role)}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit Role
                                            </button>
                                            <button
                                                onClick={() => { setDeleteConfirm(role); setOpenMenu(null); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete Role
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Icon + Name */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.icon}`}>
                                        <IconComp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm">{role.name}</h3>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {role.user_count} users
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(role.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className={`text-xs mb-4 leading-relaxed ${colors.text}`}>
                                    {role.description || 'Chưa có mô tả'}
                                </p>

                                {/* Permissions count */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <span className="text-xs font-medium text-gray-600">Permissions</span>
                                    <span className="text-xs font-bold text-gray-900">{role.permission_count}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Add/Edit Modal ───────────────────────────────────── */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">
                                {modal === 'add' ? 'Tạo vai trò mới' : 'Chỉnh sửa vai trò'}
                            </h2>
                            <button
                                onClick={() => setModal(null)}
                                className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                            {/* Name */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tên vai trò *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Ví dụ: Editor, Moderator..."
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mô tả</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Mô tả vai trò này..."
                                    rows={2}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                />
                            </div>

                            {/* Color + Icon */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Màu sắc</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {DEFAULT_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setForm(f => ({ ...f, color: c }))}
                                                className={`w-7 h-7 rounded-full cursor-pointer ring-2 transition-all ${form.color === c ? 'ring-gray-900 scale-110' : 'ring-transparent'
                                                    } ${ROLE_COLORS[c]?.icon}`}
                                                title={c}
                                            >
                                                {form.color === c && <Check className="h-3 w-3 mx-auto" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Icon</label>
                                    <div className="flex gap-2">
                                        {DEFAULT_ICONS.map(ic => {
                                            const Ic = ROLE_ICONS[ic];
                                            return (
                                                <button
                                                    key={ic}
                                                    onClick={() => setForm(f => ({ ...f, icon: ic }))}
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all ${form.icon === ic
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    <Ic className="h-4 w-4" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Permissions */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-gray-700">
                                        Quyền hạn ({form.permission_ids.length}/{permissions.length})
                                    </label>
                                    <button
                                        onClick={() => {
                                            const all = permissions.map(p => p.id);
                                            const isAll = all.every(id => form.permission_ids.includes(id));
                                            setForm(f => ({ ...f, permission_ids: isAll ? [] : all }));
                                        }}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium"
                                    >
                                        {permissions.every(p => form.permission_ids.includes(p.id)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                    </button>
                                </div>

                                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                                    {Object.entries(permGrouped).map(([module, perms]) => {
                                        const permIds = perms.map(p => p.id);
                                        const allSelected = permIds.every(id => form.permission_ids.includes(id));
                                        const someSelected = permIds.some(id => form.permission_ids.includes(id));
                                        const expanded = expandedModules[module] ?? true;

                                        return (
                                            <div key={module}>
                                                {/* Module header */}
                                                <div
                                                    onClick={() => setExpandedModules(e => ({ ...e, [module]: !e[module] }))}
                                                    className="flex items-center justify-between px-4 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={allSelected}
                                                            ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                            onChange={() => toggleModule(module, permIds)}
                                                            onClick={e => e.stopPropagation()}
                                                            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                                                        />
                                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{module}</span>
                                                        <span className="text-[10px] text-gray-400">{permIds.filter(id => form.permission_ids.includes(id)).length}/{perms.length}</span>
                                                    </div>
                                                    <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                                </div>

                                                {/* Permission items */}
                                                {expanded && (
                                                    <div className="px-4 py-2 space-y-1.5 bg-white">
                                                        {perms.map(perm => (
                                                            <label key={perm.id} className="flex items-center gap-2.5 py-1 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={form.permission_ids.includes(perm.id)}
                                                                    onChange={() => togglePermission(perm.id)}
                                                                    className="w-3.5 h-3.5 rounded accent-indigo-600 cursor-pointer"
                                                                />
                                                                <span className="text-xs text-gray-700 group-hover:text-gray-900 flex-1">{perm.description || perm.name}</span>
                                                                <code className="text-[10px] text-gray-400 font-mono">{perm.name}</code>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
                            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm">
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                {modal === 'add' ? 'Tạo vai trò' : 'Lưu thay đổi'}
                            </Button>
                            <Button variant="ghost" onClick={() => setModal(null)} className="cursor-pointer">
                                Hủy
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ───────────────────────────────────── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-center font-bold text-gray-900 mb-1">Xóa vai trò</h3>
                        <p className="text-center text-sm text-gray-500 mb-5">
                            Bạn có chắc muốn xóa vai trò <span className="font-semibold text-gray-900">{deleteConfirm.name}</span>? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-sm">
                                Xóa vĩnh viễn
                            </Button>
                            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 cursor-pointer">
                                Hủy
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay for menu */}
            {openMenu && (
                <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
            )}
        </div>
    );
}
