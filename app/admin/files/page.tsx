'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, HardDrive, FileVideo, FileImage, FileText, Trash2, ExternalLink } from 'lucide-react';

interface FileItem {
    name: string;
    size: number;
    url: string;
    created_at: string;
    type: 'videos' | 'images' | 'docs';
}

interface Stats {
    videoSize: number;
    imageSize: number;
    docSize: number;
    totalSize: number;
}

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function FileManagementPage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [stats, setStats] = useState<Stats>({ videoSize: 0, imageSize: 0, docSize: 0, totalSize: 0 });
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const videoCount = files.filter((f) => f.type === 'videos').length;
    const imageCount = files.filter((f) => f.type === 'images').length;
    const docCount = files.filter((f) => f.type === 'docs').length;

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/files');
            const data = await res.json();
            if(data.files) setFiles(data.files);
            if(data.stats) setStats(data.stats);
        } catch {
            console.error('Lỗi tải file');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFiles(); }, []);

    const handleDelete = async (url: string) => {
        if(!confirm('Chắc chắn xóa tệp này vĩnh viễn khỏi máy chủ?')) return;
        setDeleting(url);
        try {
            const res = await fetch('/api/admin/files', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            if(res.ok) fetchFiles();
            else alert('Lỗi: ' + (await res.json()).error);
        } catch {
            alert('Lỗi mạng kết nối');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const getIcon = (type: string) => {
        if(type === 'videos') return <FileVideo className="h-5 w-5 text-indigo-500" />;
        if(type === 'images') return <FileImage className="h-5 w-5 text-emerald-500" />;
        return <FileText className="h-5 w-5 text-amber-500" />;
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Quản Lý Lưu Trữ (Files)</h1>
                    <p className="text-slate-500 mt-1">Kiểm soát và tối ưu không gian bộ nhớ máy chủ.</p>
                </div>
                <button onClick={fetchFiles} className="px-5 h-10 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer flex items-center justify-center">
                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : 'hidden'}`} />
                    Làm mới
                </button>
            </div>

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="rounded-xl border border-slate-200 shadow-sm bg-indigo-50/50">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600 border border-indigo-200"><HardDrive className="h-6 w-6"/></div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tổng bộ nhớ</p>
                            <p className="text-2xl font-bold text-slate-900">{formatBytes(stats.totalSize)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600 border border-blue-100"><FileVideo className="h-6 w-6"/></div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Video bài giảng</p>
                            <p className="text-xl font-bold text-slate-900">{formatBytes(stats.videoSize)}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{videoCount} tệp</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100"><FileImage className="h-6 w-6"/></div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Hình ảnh</p>
                            <p className="text-xl font-bold text-slate-900">{formatBytes(stats.imageSize)}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{imageCount} tệp</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-lg text-amber-600 border border-amber-100"><FileText className="h-6 w-6"/></div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tài liệu</p>
                            <p className="text-xl font-bold text-slate-900">{formatBytes(stats.docSize)}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{docCount} tệp</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* FILES LIST */}
            <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Tên tệp</th>
                                    <th className="px-6 py-4">Loại</th>
                                    <th className="px-6 py-4">Dung lượng</th>
                                    <th className="px-6 py-4">Ngày tải lên</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {files.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-slate-500">
                                            <HardDrive className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                            <p className="font-medium">Không có tệp nào trên máy chủ</p>
                                        </td>
                                    </tr>
                                ) : files.map((f, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 flex-shrink-0">
                                                    {getIcon(f.type)}
                                                </div>
                                                <div className="max-w-[300px]">
                                                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 hover:text-indigo-600 flex items-center gap-1.5 truncate">
                                                        {f.name} <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                                                    </a>
                                                    <p className="text-xs text-slate-500 mt-1 truncate max-w-[280px]" title={f.url}>{f.url}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[11px] uppercase font-semibold border border-slate-200">
                                                {f.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-700">{formatBytes(f.size)}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{new Date(f.created_at).toLocaleString('vi-VN')}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleDelete(f.url)}
                                                    disabled={deleting === f.url}
                                                    className="h-8 w-8 p-0 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                                    title="Xóa vĩnh viễn"
                                                >
                                                    {deleting === f.url ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
