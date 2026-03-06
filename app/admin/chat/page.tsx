'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Check, AlertCircle, MessageSquare, User, Bot } from 'lucide-react';
import Pagination from '@/components/Pagination';

interface ChatMessage {
    id: string;
    role: string;
    content: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    created_at: string;
}

export default function AdminChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const limit = 30;

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/chat?page=${page}&limit=${limit}`);
            const data = await res.json();
            setMessages(data.messages || []);
            setTotal(data.total || 0);
        } catch {
            setMessage({ type: 'error', text: 'Lỗi khi tải tin nhắn' });
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const deleteMessage = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;
        try {
            const res = await fetch('/api/admin/chat', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error('Xóa thất bại');
            setMessage({ type: 'success', text: 'Đã xóa tin nhắn' });
            fetchMessages();
        } catch {
            setMessage({ type: 'error', text: 'Xóa thất bại' });
        }
    };

    const clearUserChat = async (userId: string, userName: string) => {
        if (!confirm(`Xóa tất cả tin nhắn từ ${userName}?`)) return;
        try {
            const res = await fetch('/api/admin/chat', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) throw new Error('Xóa thất bại');
            setMessage({ type: 'success', text: `Đã xóa tất cả tin nhắn từ ${userName}` });
            fetchMessages();
        } catch {
            setMessage({ type: 'error', text: 'Xóa thất bại' });
        }
    };

    const totalPages = Math.ceil(total / limit);

    // Group messages by user
    const userGroups = messages.reduce((acc, msg) => {
        const key = msg.user_id;
        if (!acc[key]) {
            acc[key] = { name: msg.user_name || 'Unknown', email: msg.user_email || '', messages: [] };
        }
        acc[key].messages.push(msg);
        return acc;
    }, {} as Record<string, { name: string; email: string; messages: ChatMessage[] }>);

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Tin nhắn trò chuyện</h1>
                <p className="text-gray-500 mt-1">{total} tin nhắn trong cơ sở dữ liệu</p>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 text-sm ${message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span>{message.text}</span>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
            ) : messages.length === 0 ? (
                <Card className="rounded-xl border-0 shadow-sm">
                    <CardContent className="py-16 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">Chưa có tin nhắn</h3>
                        <p className="text-gray-500 mt-1">Tin nhắn sẽ xuất hiện ở đây khi người dùng tương tác với chatbot AI</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(userGroups).map(([userId, group]) => (
                        <Card key={userId} className="rounded-xl border-0 shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">{group.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900">{group.name}</p>
                                        <p className="text-xs text-gray-400">{group.email} • {group.messages.length} tin nhắn</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => clearUserChat(userId, group.name)}
                                    className="text-red-500 hover:bg-red-50 cursor-pointer h-7 px-2 text-xs"
                                >
                                    <Trash2 className="h-3 w-3 mr-1" /> Xóa tất cả
                                </Button>
                            </div>
                            <CardContent className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                                {group.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start space-x-3 p-3 rounded-lg group ${msg.role === 'USER' ? 'bg-blue-50' : 'bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.role === 'USER' ? 'bg-blue-500' : 'bg-gray-600'
                                            }`}>
                                            {msg.role === 'USER' ? (
                                                <User className="h-3 w-3 text-white" />
                                            ) : (
                                                <Bot className="h-3 w-3 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-xs font-medium text-gray-500">{msg.role}</span>
                                                <span className="text-xs text-gray-300">{new Date(msg.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{msg.content.slice(0, 500)}{msg.content.length > 500 ? '...' : ''}</p>
                                        </div>
                                        <button
                                            onClick={() => deleteMessage(msg.id)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all cursor-pointer p-1"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
                    </div>
                </div>
            )}
        </div>
    );
}
