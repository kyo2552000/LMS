'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { MessageCircle, Send, Reply, Loader2, Heart, MessageSquareQuote, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface Comment {
    id: string;
    content: string;
    user_name: string;
    user_avatar: string | null;
    user_role: string;
    created_at: string;
    replies?: Comment[];
}

export default function LessonComments({ courseId, lessonId }: { courseId: string, lessonId: string }) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reply state
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const totalReplies = useMemo(() => comments.reduce((sum, c) => sum + (c.replies?.length || 0), 0), [comments]);

    useEffect(() => {
        fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, lessonId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/comments?courseId=${courseId}&lessonId=${lessonId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async (parentId?: string) => {
        const text = parentId ? replyText : newComment;
        if (!text.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: text,
                    courseId,
                    lessonId,
                    parentId
                })
            });

            if (res.ok) {
                if (parentId) {
                    setReplyText('');
                    setReplyingTo(null);
                } else {
                    setNewComment('');
                }
                await fetchComments();
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

    const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
        <div className={`flex gap-4 ${isReply ? 'mt-4 ml-10' : 'mt-6'}`}>
            <div className={`flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold
                ${isReply ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}`}>
                {comment.user_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full object-cover" />
                ) : (
                    comment.user_name?.charAt(0).toUpperCase() || 'U'
                )}
            </div>
            <div className="flex-1">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm">{comment.user_name}</span>
                        {comment.user_role === 'ADMIN' && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold">INSTRUCTOR</span>
                        )}
                        <span className="text-xs text-gray-400">
                            {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">{comment.content}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                        <button className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
                            <Heart className="w-3.5 h-3.5" /> Thích
                        </button>
                        <button className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
                            <MessageSquareQuote className="w-3.5 h-3.5" /> Trích dẫn
                        </button>
                    </div>
                </div>

                {!isReply && user && (
                    <div className="mt-2 ml-2">
                        <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-xs font-semibold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            <Reply className="w-3 h-3" /> Trả lời
                        </button>

                        {/* Reply Form */}
                        {replyingTo === comment.id && (
                            <div className="mt-3 flex gap-3 pr-4">
                                <input
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Viết câu trả lời..."
                                    className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                                <button
                                    onClick={() => handlePostComment(comment.id)}
                                    disabled={submitting || !replyText.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                    Gửi
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Render Replies recursively */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="border-l-2 border-gray-100 mt-2">
                        {comment.replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} isReply={true} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3">
                        <Sparkles className="w-3.5 h-3.5" /> Khu thảo luận
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        Hỏi đáp & Thảo luận
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Đặt câu hỏi, trao đổi và nhận hỗ trợ từ cộng đồng học viên.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-3 py-1 rounded-full bg-gray-100 font-medium">{comments.length} bài viết</span>
                    <span className="px-3 py-1 rounded-full bg-gray-100 font-medium">{totalReplies} phản hồi</span>
                </div>
            </div>

            {/* Main Input */}
            {user ? (
                <div className="flex gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 border border-gray-200">
                        {user.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar} alt="You" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Bạn có câu hỏi gì về bài học này không?"
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none pr-12"
                        />
                        <button
                            onClick={() => handlePostComment()}
                            disabled={submitting || !newComment.trim()}
                            className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-5 text-center mb-8 border border-slate-100 shadow-sm">
                    <p className="text-slate-600 text-sm mb-3">Vui lòng đăng nhập để tham gia thảo luận bài học.</p>
                    <a href="/login" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Đăng nhập ngay</a>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-2">
                {comments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>Chưa có thảo luận nào. Hãy là người đầu tiên đặt câu hỏi!</p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))
                )}
            </div>
        </div>
    );
}
