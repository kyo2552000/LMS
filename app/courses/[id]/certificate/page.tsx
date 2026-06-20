'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Download, Award, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [progress, setProgress] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);

    useEffect(() => {
        async function fetchData() {
            try {
                const [courseRes, profileRes, progressRes] = await Promise.all([
                    fetch(`/api/courses/${id}`),
                    fetch(`/api/profile`),
                    fetch(`/api/lesson-progress?courseId=${id}`),
                ]);

                if (!courseRes.ok || !profileRes.ok) throw new Error('Data fetch failed');

                const courseData = await courseRes.json();
                const profileData = await profileRes.json();
                const progressData = progressRes.ok ? await progressRes.json() : null;

                if (!courseData.isEnrolled) {
                    router.push(`/courses/${id}`);
                    return;
                }

                setCourse(courseData);
                setProfile(profileData);
                setCompletedCount(progressData?.completedCount || 0);
                setProgress(courseData.lessons?.length ? Math.round(((progressData?.completedCount || 0) / courseData.lessons.length) * 100) : 0);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, router]);

    if (loading) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!course || !profile) return null;

    const totalLessons = course.lessons?.length || 0;
    const isCompleted = progress >= 100;
    const canIssueCertificate = isCompleted || completedCount === totalLessons && totalLessons > 0;
    const certificateCode = `EDU-${String(id).slice(0, 6).toUpperCase()}-${String(profile?.profile?.id || profile?.id || 'USER').slice(0, 6).toUpperCase()}`;
    const printPdf = () => {
        window.print();
    };

    return (
        <div className="min-h-screen border-t-4 border-blue-600 bg-slate-50 py-10 px-4 print:p-0 print:border-none print:bg-white flex flex-col items-center">
            
            {/* Header controls (hidden when printing) */}
            <div className="max-w-5xl w-full flex justify-between items-center mb-8 print:hidden">
                <Link href={`/courses/${id}/learn`} className="text-slate-500 hover:text-slate-900 flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Quay lại lớp học
                </Link>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-500 hidden sm:block">Mẹo: Chọn Print &gt; <strong>Save as PDF</strong> và gỡ bỏ Margins.</p>
                    <button 
                        onClick={printPdf}
                        disabled={!canIssueCertificate}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium shadow-md transition-all active:scale-95 ${
                            canIssueCertificate
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <Download className="h-4 w-4" /> Tải dạng PDF
                    </button>
                </div>
            </div>

            {!isCompleted && (
                <div className="max-w-5xl w-full mb-6 print:hidden">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 mt-0.5" />
                        <div>
                            <p className="font-semibold">Bạn chưa đủ điều kiện nhận chứng chỉ</p>
                            <p className="text-sm mt-1 text-amber-800">
                                Hãy hoàn thành toàn bộ bài học của khóa học để mở khóa chứng chỉ.
                            </p>
                            <p className="text-sm mt-2 font-medium">Tiến độ hiện tại: {progress}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate Canvas */}
            <div className="w-full max-w-[1000px] aspect-[1.414] bg-white border border-slate-200 shadow-2xl relative overflow-hidden print:shadow-none print:border-none print:max-w-none print:w-[297mm] print:h-[210mm] flex items-center justify-center p-12">
                
                {/* Visual Borders */}
                <div className="absolute inset-4 border-4 border-blue-950/5 rounded-2xl pointer-events-none" />
                <div className="absolute inset-6 border border-blue-900/10 rounded-xl pointer-events-none" />

                <div className="relative z-10 w-full text-center flex flex-col items-center">
                    <div className="mb-6 inline-flex p-4 rounded-full bg-blue-50 border border-blue-100/50">
                        <Award className="h-16 w-16 text-blue-600" />
                    </div>
                    
                    <h1 className="text-sm sm:text-base font-bold text-blue-600 tracking-[0.3em] uppercase mb-8">
                        Giấy Chứng Nhận Hoàn Thành Khóa Học
                    </h1>

                    <p className="text-slate-500 mb-4 font-medium italic">
                        Chứng nhận học viên
                    </p>

                    <h2 className="text-4xl sm:text-5xl font-serif text-slate-900 mb-8 font-bold">
                        {profile.user?.name || profile.name || profile.email?.split('@')[0] || 'Học Viên Xuất Sắc'}
                    </h2>

                    <p className="text-slate-500 max-w-2xl text-base sm:text-lg leading-relaxed mb-8">
                        đã xuất sắc hoàn thành tất cả các bài giảng, dự án và yêu cầu của khóa học trực tuyến 
                        <strong className="text-slate-800 font-semibold block mt-2 text-xl sm:text-2xl">
                            {course.title || course.course?.title}
                        </strong>
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                        <span className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold inline-flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> {progress}% hoàn thành
                        </span>
                        <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                            Mã chứng chỉ: {certificateCode}
                        </span>
                    </div>

                    <div className="flex flex-row items-center justify-between w-full max-w-xl mt-12 px-8 pt-8 border-t border-slate-100">
                        <div className="text-center">
                            <p className="text-xs sm:text-sm text-slate-400 mb-1">Ngày cấp</p>
                            <p className="font-medium text-slate-800 text-sm sm:text-base">{new Date().toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-extrabold text-2xl text-blue-950 italic">EDULEARn</h3>
                            <p className="text-[10px] sm:text-xs text-blue-600 uppercase tracking-widest mt-1">E-Learning Platform</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs sm:text-sm text-slate-400 mb-1">Tổng thời lượng</p>
                            <p className="font-medium text-slate-800 text-sm sm:text-base">{course.lessons?.length || 0} Bài học</p>
                        </div>
                    </div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50/60 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
                <div className="absolute top-1/2 left-0 w-64 h-64 bg-indigo-50/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Print Styles Overlay for perfection */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    main {
                        padding: 0 !important;
                    }
                    nav, header, footer {
                        display: none !important;
                    }
                }
            ` }} />
        </div>
    );
}
