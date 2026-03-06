'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Save, X, Loader2, AlertCircle, Check } from 'lucide-react';
import Pagination from '@/components/Pagination';

interface Column {
    COLUMN_NAME: string;
    DATA_TYPE: string;
    IS_NULLABLE: string;
    COLUMN_KEY: string;
}

interface AdminTableProps {
    table: string;
    title: string;
}

export default function AdminTable({ table, title }: AdminTableProps) {
    const [rows, setRows] = useState<Record<string, unknown>[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Record<string, unknown>>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const limit = 15;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/${table}?page=${page}&limit=${limit}`);
            const data = await res.json();
            setRows(data.rows || []);
            setColumns(data.columns || []);
            setTotal(data.total || 0);
        } catch {
            setMessage({ type: 'error', text: 'Lỗi khi tải dữ liệu' });
        } finally {
            setLoading(false);
        }
    }, [table, page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const startEdit = (row: Record<string, unknown>) => {
        setEditingId(row.id as string);
        setEditData({ ...row });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            const filteredData = { ...editData };
            delete filteredData.id;
            delete filteredData.created_at;
            delete filteredData.updated_at;

            const res = await fetch(`/api/admin/${table}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingId, data: filteredData }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }

            setMessage({ type: 'success', text: 'Cập nhật thành công!' });
            setEditingId(null);
            fetchData();
        } catch (err: unknown) {
            const e = err as { message?: string };
            setMessage({ type: 'error', text: e.message || 'Cập nhật thất bại' });
        }
    };

    const deleteRow = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa dòng này?')) return;
        try {
            const res = await fetch(`/api/admin/${table}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }

            setMessage({ type: 'success', text: 'Xóa thành công!' });
            fetchData();
        } catch (err: unknown) {
            const e = err as { message?: string };
            setMessage({ type: 'error', text: e.message || 'Xóa thất bại' });
        }
    };

    const totalPages = Math.ceil(total / limit);
    const displayCols = columns.filter(
        (c) => !['password', 'content', 'video_url'].includes(c.COLUMN_NAME)
    );

    const formatValue = (val: unknown): string => {
        if (val === null || val === undefined) return '—';
        if (val instanceof Date) return (val as Date).toLocaleString();
        if (typeof val === 'string' && val.length > 50) return val.substring(0, 50) + '…';
        return String(val);
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-500 mt-1">{total} bản ghi trong bảng <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{table}</code></p>
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
                                        {displayCols.map((col) => (
                                            <th
                                                key={col.COLUMN_NAME}
                                                className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap"
                                            >
                                                {col.COLUMN_NAME}
                                                {col.COLUMN_KEY === 'PRI' && (
                                                    <span className="ml-1 text-blue-500 text-[10px]">PK</span>
                                                )}
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider">
                                            Hành động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, idx) => {
                                        const isEditing = editingId === row.id;
                                        return (
                                            <tr
                                                key={row.id as string || idx}
                                                className={`border-b border-gray-100 ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                    } transition-colors`}
                                            >
                                                {displayCols.map((col) => (
                                                    <td key={col.COLUMN_NAME} className="px-4 py-3 whitespace-nowrap">
                                                        {isEditing && col.COLUMN_NAME !== 'id' && col.COLUMN_NAME !== 'created_at' && col.COLUMN_NAME !== 'updated_at' ? (
                                                            <input
                                                                type="text"
                                                                value={String(editData[col.COLUMN_NAME] ?? '')}
                                                                onChange={(e) =>
                                                                    setEditData({ ...editData, [col.COLUMN_NAME]: e.target.value })
                                                                }
                                                                className="px-2 py-1 border border-blue-300 rounded text-sm w-full max-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            />
                                                        ) : (
                                                            <span className={`text-gray-700 ${col.COLUMN_KEY === 'PRI' ? 'font-mono text-xs text-gray-400' : ''}`}>
                                                                {formatValue(row[col.COLUMN_NAME])}
                                                            </span>
                                                        )}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <Button size="sm" onClick={saveEdit} className="h-7 px-2 bg-green-500 hover:bg-green-600 text-white cursor-pointer">
                                                                <Save className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 px-2 cursor-pointer">
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => startEdit(row)}
                                                                className="h-7 px-2 text-blue-600 hover:bg-blue-50 cursor-pointer text-xs"
                                                            >
                                                                Sửa
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => deleteRow(row.id as string)}
                                                                className="h-7 px-2 text-red-500 hover:bg-red-50 cursor-pointer"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {rows.length === 0 && (
                                        <tr>
                                            <td colSpan={displayCols.length + 1} className="text-center py-12 text-gray-400">
                                                Không có dữ liệu
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
                </CardContent>
            </Card>
        </div>
    );
}
