"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, Loader2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Review {
    id: string;
    rating: number;
    comment: string;
    user_name: string;
    user_avatar: string | null;
    created_at: string;
}

export default function CourseReviews({ courseId, isEnrolled }: { courseId: string; isEnrolled: boolean }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/reviews?courseId=${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [courseId]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId, rating, comment }),
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMsg("Cảm ơn bạn đã đánh giá!");
                setComment("");
                fetchReviews(); // reload
            } else {
                setErrorMsg(data.error || "Có lỗi xảy ra");
            }
        } catch (error) {
            setErrorMsg("Lỗi kết nối.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <Card className="rounded-2xl shadow-md border-0 mt-8">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    Đánh giá học viên ({reviews.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {/* Form Đánh Giá */}
                {isEnrolled ? (
                    <form onSubmit={onSubmit} className="mb-8 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-3 text-sm">Để lại đánh giá của bạn</h4>
                        <div className="flex items-center gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    type="button"
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star className={`h-6 w-6 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                </button>
                            ))}
                            <span className="text-sm font-medium text-gray-500 ml-2">{rating}/5.0</span>
                        </div>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Khóa học này như thế nào? (Không bắt buộc)"
                            className="w-full resize-none bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-3 transition-all"
                            rows={3}
                        />
                        {errorMsg && <p className="text-sm text-red-500 mb-3">{errorMsg}</p>}
                        {successMsg && <p className="text-sm text-green-600 mb-3">{successMsg}</p>}
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 cursor-pointer"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Gửi đánh giá
                        </Button>
                    </form>
                ) : (
                    <div className="text-sm text-center text-gray-500 bg-gray-50 py-4 rounded-xl border border-dashed border-gray-200 mb-8">
                        Đăng ký khóa học để có thể chia sẻ cảm nhận của bạn!
                    </div>
                )}

                {/* Danh sách review */}
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Chưa có đánh giá nào cho khóa học này.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reviews.map((rev) => (
                            <div key={rev.id} className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-500 font-bold overflow-hidden border border-indigo-200">
                                    {rev.user_avatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={rev.user_avatar} alt={rev.user_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-5 w-5 opacity-50" />
                                    )}
                                </div>
                                <div className="flex-1 bg-gray-50/50 border border-gray-100 p-4 rounded-2xl rounded-tl-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <h5 className="font-bold text-sm text-gray-900">{rev.user_name}</h5>
                                        <span className="text-xs text-gray-400">{formatDate(rev.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} className={`h-3 w-3 ${rev.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    {rev.comment && (
                                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{rev.comment}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
