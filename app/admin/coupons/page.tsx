'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Tag, Plus, Search, Edit2, Trash2, Loader2, Check,
    AlertCircle, X, ChevronDown,
} from 'lucide-react';
import Pagination from '@/components/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Coupon {
    id: string;
    code: string;
    description: string;
    discount_type: 'PERCENTAGE' | 'FIXED';
    discount_value: number;
    min_order_amount: number;
    max_discount_amount: number | null;
    usage_limit: number | null;
    usage_count: number;
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
    expires_at: string | null;
    created_by_name: string;
    created_at: string;
}

const STATUS_CONFIG = {
    ACTIVE:   { label: 'Hoạt động', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    INACTIVE: { label: 'Tắt',       class: 'bg-slate-50 text-slate-600 border-slate-200' },
    EXPIRED:  { label: 'Hết hạn',   class: 'bg-red-50 text-red-600 border-red-200' },
};

const emptyForm = {
    id: '',
    code: '',
    description: '',
    discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discount_value: '',
    min_order_amount: '0',
    max_discount_amount: '',
    usage_limit: '',
    status: 'ACTIVE',
    expires_at: '',
};

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [modal, setModal] = useState<'add' | 'edit' | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const limit = 15;

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(limit), search, status: filterStatus });
        const res = await fetch(`/api/admin/coupons?${params}`);
        const data = await res.json();
        setCoupons(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
    }, [page, search, filterStatus]);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const openAdd = () => { setForm(emptyForm); setModal('add'); };
    const openEdit = (c: Coupon) => {
        setForm({
            id: c.id, code: c.code, description: c.description || '', discount_type: c.discount_type,
            discount_value: String(c.discount_value), min_order_amount: String(c.min_order_amount),
            max_discount_amount: c.max_discount_amount ? String(c.max_discount_amount) : '',
            usage_limit: c.usage_limit ? String(c.usage_limit) : '', status: c.status,
            expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
        });
        setModal('edit');
    };

    const handleSave = async () => {
        if (!form.code || !form.discount_value) return setMessage({ type: 'error', text: 'Mã và giá trị giảm giá là bắt buộc' });
        setSaving(true);
        try {
            const method = modal === 'add' ? 'POST' : 'PUT';
            const res = await fetch('/api/admin/coupons', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: 'success', text: modal === 'add' ? 'Tạo mã giảm giá thành công!' : 'Cập nhật thành công!' });
            setModal(null);
            fetchCoupons();
        } catch (e: unknown) {
            setMessage({ type: 'error', text: (e as { message?: string }).message || 'Lỗi không xác định' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa mã giảm giá này?')) return;
        const res = await fetch('/api/admin/coupons', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (res.ok) { setMessage({ type: 'success', text: 'Đã xóa!' }); fetchCoupons(); }
    };

    const totalPages = Math.ceil(total / limit);

    const formatDiscount = (c: Coupon) =>
        c.discount_type === 'PERCENTAGE' ? `${c.discount_value}%` : `${c.discount_value.toLocaleString('vi-VN')}đ`;

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Mã Giảm Giá</h1>
                    <p className="text-slate-500 mt-1">{total} mã giảm giá trên hệ thống</p>
                </div>
                <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm mã giảm giá
                </Button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                        <select
                            value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                            className="w-full appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-slate-700"
                        >
                            <option value="">Tất cả trạng thái</option>
                            {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                                <option key={k} value={k}>{c.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                    
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm mã giảm giá..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
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
                                        <th className="px-6 py-4">Mã Coupon</th>
                                        <th className="px-6 py-4">Mô tả hiển thị</th>
                                        <th className="px-6 py-4">Mức Giảm</th>
                                        <th className="px-6 py-4">Lượt Dùng</th>
                                        <th className="px-6 py-4">Thời Hạn</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {coupons.length > 0 ? coupons.map(c => {
                                        const sc = STATUS_CONFIG[c.status];
                                        return (
                                            <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded border bg-slate-100 flex items-center justify-center border-slate-200 flex-shrink-0">
                                                            <Tag className="h-4 w-4 text-slate-500" />
                                                        </div>
                                                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-sm tracking-widest">{c.code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 font-medium max-w-[200px] truncate">{c.description || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-900 text-sm block">{formatDiscount(c)}</span>
                                                    {c.min_order_amount > 0 && (
                                                        <span className="text-[11px] text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5 inline-block border border-indigo-100">Đơn từ: {c.min_order_amount.toLocaleString('vi-VN')}đ</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                                    {c.usage_count} <span className="text-slate-400">/ {c.usage_limit ?? '∞'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit', year:'numeric'}) : 'Không giới hạn'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold tracking-wider border ${sc.class}`}>
                                                        {sc.label.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 cursor-pointer" title="Chỉnh sửa">
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)} className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 cursor-pointer" title="Xóa bỏ">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-500">
                                                Chưa có mã giảm giá nào được tạo.
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

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border-0 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {modal === 'add' ? <Plus className="h-5 w-5 text-indigo-600" /> : <Edit2 className="h-5 w-5 text-indigo-600" />}
                                {modal === 'add' ? 'Tạo mới mã giảm giá' : 'Sửa mã giảm giá'}
                            </h3>
                            <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Mã code Coupon *</label>
                                    <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="VD: SALE2026" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-bold text-slate-700" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Trạng thái phát hành</label>
                                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white cursor-pointer font-medium text-slate-700">
                                        {Object.entries(STATUS_CONFIG).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Mô tả hiển thị cho học viên</label>
                                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="VD: Giảm 20% nhân dịp năm mới..." className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 uppercase mb-1.5 block">Loại hình giảm giá</label>
                                    <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'PERCENTAGE' | 'FIXED' }))} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white cursor-pointer font-bold text-slate-700">
                                        <option value="PERCENTAGE">Khoán Phần trăm (%)</option>
                                        <option value="FIXED">Giá trị cố định (VNĐ)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 uppercase mb-1.5 block">Mức giảm *</label>
                                    <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder={form.discount_type === 'PERCENTAGE' ? 'Ví dụ: 20' : 'Ví dụ: 100000'} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-bold" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Đơn tối thiểu (VNĐ)</label>
                                    <input type="number" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Lần dùng tối đa</label>
                                    <input type="number" value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} placeholder="Bỏ trống nếu không giới hạn" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Ngày hết hạn</label>
                                <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <Button variant="outline" onClick={() => setModal(null)} className="border-slate-300 text-slate-700 cursor-pointer">
                                Hủy bỏ
                            </Button>
                            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer w-40">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (modal === 'add' ? 'Phát hành mã code' : 'Cập nhật')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
