'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import {
    ArrowLeft, PlayCircle, FileText, HelpCircle, CheckCircle2, Check,
    ChevronLeft, ChevronRight, Menu, X, ChevronUp, Download, FileWarning, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Course, Lesson } from '@/types';
import LessonComments from '@/components/LessonComments';
import TakeQuiz from '@/components/TakeQuiz';
import { useToast } from '@/contexts/ToastContext';

// ─── DOCX Viewer ─────────────────────────────────────────────────────────────
function DocxViewer({ url }: { url: string }) {
    const [html, setHtml] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        setHtml(null);
        fetch(`/api/parse-docx?url=${encodeURIComponent(url)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setHtml(data.html);
                else setError(data.error || 'Không thể đọc tài liệu');
            })
            .catch(() => setError('Lỗi kết nối. Vui lòng thử lại.'))
            .finally(() => setLoading(false));
    }, [url]);

    if (loading) {
        return (
            <div className="space-y-4 py-8 px-6 max-w-4xl mx-auto w-full animate-pulse">
                <div className="h-6 bg-slate-100 rounded-lg w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-5/6" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-4/5" />
                <div className="h-6 bg-slate-100 rounded-lg w-1/2 mt-6" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 flex flex-col items-center gap-3 text-slate-500">
                <FileWarning className="h-12 w-12 opacity-40" />
                <p className="text-sm font-medium">{error}</p>
                <a
                    href={url}
                    download
                    className="mt-2 flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Download className="h-4 w-4" /> Tải file về máy
                </a>
            </div>
        );
    }

    return (
        <div className="docx-content bg-white border border-slate-100 rounded-xl px-8 py-6 shadow-sm">
            {/* Download button */}
            <div className="flex justify-end mb-4">
                <a
                    href={url}
                    download
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Download className="h-3.5 w-3.5" /> Tải file DOCX
                </a>
            </div>
            <div
                className="prose prose-slate max-w-none leading-relaxed
                    prose-headings:font-bold prose-headings:text-slate-800
                    prose-p:text-slate-700 prose-p:leading-7
                    prose-table:text-sm prose-table:border-collapse
                    prose-td:border prose-td:border-slate-200 prose-td:px-3 prose-td:py-2
                    prose-th:border prose-th:border-slate-300 prose-th:bg-slate-50 prose-th:px-3 prose-th:py-2 prose-th:font-semibold
                    prose-img:rounded-lg prose-img:shadow-md
                    prose-strong:text-slate-900
                    prose-li:text-slate-700 prose-li:leading-6"
                dangerouslySetInnerHTML={{ __html: html! }}
            />
        </div>
    );
}

// ─── Video Player ─────────────────────────────────────────────────────────────
function VideoPlayer({ url, lessonId, initialResume = 0, onEnded, onProgress }: { url: string, lessonId: string, initialResume?: number, onEnded?: () => void, onProgress?: (progress: number) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [watchProgress, setWatchProgress] = useState(0);
    const [savedTime, setSavedTime] = useState(0);
    const isLocalFile = url.includes('/api/media?file=');
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    const getEmbedUrl = (rawUrl: string) => {
        try {
            const urlObj = new URL(rawUrl);
            const host = urlObj.hostname.replace('www.', '');
            if (host.includes('youtu.be')) {
                const id = urlObj.pathname.replace('/', '').split('?')[0];
                return `https://www.youtube.com/embed/${id}`;
            }
            if (host.includes('youtube.com')) {
                const videoId = urlObj.searchParams.get('v');
                if (videoId) return `https://www.youtube.com/embed/${videoId}`;
                if (urlObj.pathname.includes('/embed/')) return rawUrl;
                if (urlObj.pathname.includes('/shorts/')) {
                    const shortsId = urlObj.pathname.split('/shorts/')[1]?.split('/')[0];
                    if (shortsId) return `https://www.youtube.com/embed/${shortsId}`;
                }
            }
        } catch {
            if (rawUrl.includes('watch?v=')) return rawUrl.replace('watch?v=', 'embed/');
        }
        return rawUrl;
    };

    useEffect(() => {
        const vid = videoRef.current;
        if (!vid || !isLocalFile) return;

        const key = `video-progress-${lessonId}`;
        const watchedKey = `video-watched-${lessonId}`;
        const saved = Math.max(Number(localStorage.getItem(key) || '0'), initialResume || 0);
        const watched = Number(localStorage.getItem(watchedKey) || '0');

        if (saved > 0) {
            setSavedTime(saved);
            const handleLoadedMetadata = () => {
                const safeTime = Math.min(saved, Math.max(0, (vid.duration || saved) - 2));
                if (safeTime > 0 && Number.isFinite(safeTime)) {
                    vid.currentTime = safeTime;
                }
            };
            vid.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        }

        setWatchProgress(watched);

        let lastPersist = 0;
        let lastWatchPersist = 0;

        const persistProgress = () => {
            const current = vid.currentTime || 0;
            const duration = vid.duration || 0;
            if (duration <= 0) return;

            const percent = Math.min(100, Math.round((current / duration) * 100));
            setWatchProgress(percent);
            onProgress?.(percent);

            const maxSaved = Number(localStorage.getItem(key) || '0');
            if (current > maxSaved) {
                localStorage.setItem(key, current.toString());
                setSavedTime(current);
            }

            const now = Date.now();
            if (now - lastWatchPersist > 5000) {
                const watchedPercent = Math.min(100, Math.round((Math.max(maxSaved, current) / duration) * 100));
                localStorage.setItem(watchedKey, watchedPercent.toString());
                lastWatchPersist = now;
            }
        };

        const handleTimeUpdate = () => {
            const now = Date.now();
            if (now - lastPersist > 1000) {
                persistProgress();
                lastPersist = now;
            }
        };

        const handleSeeking = () => {
            persistProgress();
        };

        const handleEnded = () => {
            localStorage.setItem(watchedKey, '100');
            setWatchProgress(100);
            if (onEnded) onEnded();
        };

        vid.addEventListener('timeupdate', handleTimeUpdate);
        vid.addEventListener('seeking', handleSeeking);
        vid.addEventListener('ended', handleEnded);

        return () => {
            vid.removeEventListener('timeupdate', handleTimeUpdate);
            vid.removeEventListener('seeking', handleSeeking);
            vid.removeEventListener('ended', handleEnded);
        };
    }, [lessonId, onEnded, isLocalFile]);

    if (isLocalFile) {
        return (
            <div className="w-full bg-black">
                <div className="h-1 bg-white/10">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, watchProgress))}%` }}
                    />
                </div>
                <video
                    ref={videoRef}
                    src={url}
                    controls
                    autoPlay
                    controlsList="nodownload"
                    className="block w-full h-full max-h-[70vh] object-contain bg-black shadow-inner"
                    preload="metadata"
                    playsInline
                >
                    Trình duyệt của bạn không thể phát video này.
                </video>
                <div className="flex items-center justify-between px-4 py-2 text-[11px] text-slate-400 bg-slate-900/90 border-t border-white/10">
                    <span>Tiến độ xem: {Math.max(0, Math.min(100, watchProgress))}%</span>
                    <span>{savedTime > 0 ? `Đã lưu vị trí ${Math.floor(savedTime)}s` : 'Chưa lưu vị trí'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full aspect-video bg-black">
            <iframe
                src={isYouTube ? getEmbedUrl(url) : url}
                className="w-full h-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function useLearnPage(params: Promise<{ id: string }>) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const lessonIdParam = searchParams.get('lesson');

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});
    const [videoResume, setVideoResume] = useState<Record<string, number>>({});
    const { showToast } = useToast();
    const [marking, setMarking] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSectionOpen, setIsSectionOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchProgress = useCallback(async (courseId: string) => {
        try {
            const res = await fetch(`/api/lesson-progress?courseId=${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCompletedIds(new Set(data.completedIds || []));
                const progressMap = data.progressMap || {};
                const nextProgress: Record<string, number> = {};
                const nextResume: Record<string, number> = {};
                Object.entries(progressMap).forEach(([lessonId, value]: any) => {
                    nextProgress[lessonId] = Number(value?.watchPercent || 0);
                    nextResume[lessonId] = Number(value?.lastPosition || 0);
                });
                setVideoProgress(nextProgress);
                setVideoResume(nextResume);
            }
        } catch { }
    }, []);

    useEffect(() => {
        async function fetchCourse() {
            try {
                const res = await fetch(`/api/courses/${id}`);
                if (!res.ok) throw new Error('Not found');
                const data = await res.json();
                if (!data.isEnrolled) { router.push(`/courses/${id}`); return; }
                setCourse(data);
                if (data.lessons?.length > 0) {
                    const found = lessonIdParam ? data.lessons.find((l: Lesson) => l.id === lessonIdParam) : null;
                    setActiveLesson(found || data.lessons[0]);
                }
                await fetchProgress(id);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        }
        fetchCourse();
    }, [id, router, lessonIdParam, fetchProgress]);

    const syncLessonProgress = useCallback(async (lessonId: string, completed: boolean, lastPosition = 0, watchPercent = 0) => {
        try {
            const res = await fetch('/api/lesson-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, completed, lastPosition, watchPercent, watchTime: lastPosition }),
            });
            return res.ok;
        } catch { return false; }
    }, []);

    useEffect(() => {
        if (!activeLesson) return;
        const resume = videoResume[activeLesson.id] || 0;
        if (resume > 0) {
            void syncLessonProgress(activeLesson.id, completedIds.has(activeLesson.id), resume, videoProgress[activeLesson.id] || 0);
        }
    }, [activeLesson, completedIds, syncLessonProgress, videoProgress, videoResume]);

    const handleMarkComplete = useCallback(async () => {
        if (!activeLesson || completedIds.has(activeLesson.id) || marking) return;
        setMarking(true);
        try {
            const ok = await syncLessonProgress(activeLesson.id, true, videoResume[activeLesson.id] || 0, videoProgress[activeLesson.id] || 100);
            if (!ok) throw new Error('sync failed');
            setCompletedIds(prev => new Set(prev).add(activeLesson.id));
            showToast('Đã đánh dấu hoàn thành bài học.', 'success');
        } catch {
            showToast('Không thể cập nhật tiến độ. Vui lòng thử lại.', 'error');
        } finally { setMarking(false); }
    }, [activeLesson, completedIds, marking, syncLessonProgress, videoProgress, videoResume, showToast]);

    const selectLesson = useCallback((lesson: Lesson) => {
        setActiveLesson(lesson);
        const p = new URLSearchParams(window.location.search);
        p.set('lesson', lesson.id);
        router.push(`/courses/${id}/learn?${p.toString()}`, { scroll: false });
    }, [id, router]);

    return { id, course, loading, activeLesson, completedIds, videoProgress, videoResume, marking, isSidebarOpen, setIsSidebarOpen, isSectionOpen, setIsSectionOpen, searchQuery, setSearchQuery, setVideoProgress, syncLessonProgress, handleMarkComplete, selectLesson };
}

function LearnPageInner({ params }: { params: Promise<{ id: string }> }) {
    const state = useLearnPage(params);
    const { id, course, loading, activeLesson, completedIds, videoProgress, videoResume, marking, isSidebarOpen, setIsSidebarOpen, isSectionOpen, setIsSectionOpen, searchQuery, setSearchQuery, setVideoProgress, syncLessonProgress, handleMarkComplete, selectLesson } = state;
    const lessons = course?.lessons || [];
    const filteredLessons = lessons.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const currentIndex = activeLesson ? lessons.findIndex(l => l.id === activeLesson.id) : 0;
    const completedCount = lessons.filter(l => completedIds.has(l.id)).length;
    const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
    const isCurrentCompleted = activeLesson ? completedIds.has(activeLesson.id) : false;
    const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
    const lessonType = activeLesson?.type?.toUpperCase();
    const activeVideoProgress = activeLesson ? (videoProgress[activeLesson.id] || 0) : 0;
    const shouldAutoComplete = lessonType === 'VIDEO' && !!activeLesson && activeVideoProgress >= 80 && !completedIds.has(activeLesson.id);

    useEffect(() => { if (shouldAutoComplete) void handleMarkComplete(); }, [shouldAutoComplete, handleMarkComplete]);

    const getLessonIcon = (type: string, active: boolean) => {
        const cls = `h-4 w-4 ${active ? 'text-blue-500' : 'text-slate-400'}`;
        switch (type?.toLowerCase()) {
            case 'quiz': return <HelpCircle className={cls} />;
            case 'assignment': return <FileText className={cls} />;
            case 'text': return <FileText className={cls} />;
            default: return <PlayCircle className={cls} />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Không tìm thấy khóa học</h1>
                <Link href={`/courses/${id}`} className="text-blue-500 hover:underline">Quay lại</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 text-slate-800 dark:text-white flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Link href={`/courses/${id}`} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all shrink-0 cursor-pointer">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hidden sm:block">Khóa học</span>
                            <ChevronRight className="h-3 w-3 text-slate-400 hidden sm:block" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block truncate">{course.title}</span>
                        </div>
                        <h1 className="font-bold text-sm sm:text-base truncate">{activeLesson?.title || course.title}</h1>
                    </div>
                </div>

                {/* Progress */}
                <div className="hidden sm:flex items-center gap-3 mx-4">
                    <div className="flex items-center gap-2">
                        <div className="w-28 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                            {completedCount}/{lessons.length}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </header>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
                {/* Main */}
                <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50">
                    {progressPct === 100 && (
                        <div className="bg-emerald-500 text-white px-6 py-5 flex flex-col sm:flex-row items-center justify-between shrink-0 relative z-10 m-4 rounded-2xl border border-emerald-400/50">
                            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                <div className="p-3 bg-white/20 rounded-2xl shadow-inner animate-bounce">
                                    <CheckCircle2 className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl tracking-tight drop-shadow-sm">Chúc mừng! Bạn đã hoàn thành xuất sắc khóa học.</h3>
                                    <p className="text-emerald-50 text-sm font-medium opacity-90 mt-1">Kiến thức mới đã thuộc về bạn. Hãy xem ngay chứng chỉ của mình nhé!</p>
                                </div>
                            </div>
                            <div className="flex gap-3 shrink-0 w-full sm:w-auto">
                                <Link href={`/courses/${id}/certificate`} target="_blank" className="flex-1 sm:flex-none justify-center px-6 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all flex items-center gap-2 hover:scale-105 active:scale-95">
                                    <CheckCircle2 className="h-4 w-4" /> Xem Chứng Chỉ
                                </Link>
                                <Link href={`/courses/${id}`} className="flex-1 sm:flex-none justify-center px-6 py-2.5 bg-white text-emerald-700 rounded-xl text-sm font-bold shadow-md hover:shadow-xl hover:bg-emerald-50 transition-all hover:scale-105 active:scale-95">
                                    Tổng quan
                                </Link>
                            </div>
                        </div>
                    )}
                    {activeLesson ? (
                        <div key={activeLesson.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out flex-1 flex flex-col">
                            {/* ── VIDEO block ── */}
                            {lessonType === 'VIDEO' && (
                                <div className="w-full bg-black border-b border-slate-800 aspect-video max-h-[70vh] shrink-0 relative shadow-2xl overflow-hidden">
                                    {activeLesson.video_url ? (
                                        <div>
                                            <VideoPlayer
                                                url={activeLesson.video_url}
                                                lessonId={activeLesson.id}
                                                initialResume={videoResume[activeLesson.id] || 0}
                                                onProgress={(percent) => {
                                                    setVideoProgress(prev => ({ ...prev, [activeLesson.id]: percent }));
                                                    void syncLessonProgress(activeLesson.id, false, Math.floor(videoResume[activeLesson.id] || 0), percent);
                                                }}
                                                onEnded={() => {
                                                    setVideoProgress(prev => ({ ...prev, [activeLesson.id]: 100 }));
                                                    if (!isCurrentCompleted) void handleMarkComplete();
                                                    setTimeout(() => {
                                                        if (currentIndex < lessons.length - 1) {
                                                            selectLesson(lessons[currentIndex + 1]);
                                                        }
                                                    }, 1500);
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 flex-col gap-3">
                                            <PlayCircle className="h-16 w-16 opacity-30" />
                                            <p className="text-sm">Video chưa có cho bài học này</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── QUIZ block ── */}
                            {lessonType === 'QUIZ' && (
                                <div className="w-full flex justify-center py-10 px-6 bg-white border-b border-slate-100 shrink-0">
                                    <div className="max-w-2xl w-full">
                                        <TakeQuiz
                                            lessonId={activeLesson.id}
                                            title={activeLesson.title}
                                            content={activeLesson.content}
                                            onPass={() => {
                                                if (!isCurrentCompleted) handleMarkComplete();
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── DOCX Viewer (TEXT / ASSIGNMENT with docx_url) ── */}
                            {(lessonType === 'TEXT' || lessonType === 'ASSIGNMENT') && activeLesson.docx_url && (
                                <div className="w-full border-b border-slate-100 bg-white shrink-0">
                                    <div className="max-w-4xl mx-auto w-full px-6 pt-6">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            Tài liệu bài học
                                        </div>
                                        <DocxViewer url={activeLesson.docx_url} />
                                    </div>
                                </div>
                            )}

                            {/* ── Lesson info + content area ── */}
                            <div className="max-w-4xl mx-auto w-full px-6 py-8 pb-32">
                                {/* Title + Mark complete button */}
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900">{activeLesson.title}</h1>
                                        <p className="text-sm text-slate-500 mt-1">{completedCount}/{lessons.length} bài đã hoàn thành trong khóa học này.</p>
                                    </div>
                                    {lessonType !== 'QUIZ' && (
                                        <div className="flex items-center gap-2">
                                            {nextLesson && (
                                                <button
                                                    onClick={() => selectLesson(nextLesson)}
                                                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                                >
                                                    <ChevronRight className="h-4 w-4" /> Bài tiếp theo
                                                </button>
                                            )}
                                            <button
                                                onClick={handleMarkComplete}
                                                disabled={marking}
                                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${isCurrentCompleted
                                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                                                        : 'bg-slate-900 text-white hover:bg-slate-700'
                                                    }`}
                                            >
                                                {marking
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : isCurrentCompleted
                                                        ? <><CheckCircle2 className="h-4 w-4" /> Đã hoàn thành</>
                                                        : <><Check className="h-4 w-4" /> Đánh dấu hoàn thành</>
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Text content (HTML notes / description) — show when not QUIZ */}
                                {activeLesson.content && lessonType !== 'QUIZ' && (
                                    <div
                                        className="prose prose-slate max-w-none text-slate-600 leading-relaxed mb-8"
                                        dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                                    />
                                )}

                                {/* Empty state for TEXT/ASSIGNMENT without docx and content */}
                                {(lessonType === 'TEXT' || lessonType === 'ASSIGNMENT')
                                    && !activeLesson.docx_url
                                    && !activeLesson.content && (
                                        <p className="text-slate-400 italic text-sm">Không có nội dung cho bài học này.</p>
                                    )}

                                {/* Comments */}
                                <LessonComments courseId={id} lessonId={activeLesson.id} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center flex-col text-slate-400 gap-3">
                            <PlayCircle className="h-16 w-16 opacity-20" />
                            <p>Chọn một bài học để bắt đầu</p>
                        </div>
                    )}
                </main>

                {/* Sidebar */}
                <aside className={`w-80 lg:w-96 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-l border-slate-200/50 dark:border-slate-800/50 flex flex-col transition-all duration-300 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-40 ${isSidebarOpen ? 'translate-x-0' : 'hidden'
                    }`}>
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800/50 shrink-0 bg-white/50 dark:bg-slate-900/50">
                        <div>
                            <h3 className="font-semibold text-slate-800 text-sm">Nội dung khóa học</h3>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{completedCount}/{lessons.length} bài đã học</p>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="p-4 border-b border-slate-100">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm bài học..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-100 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-sm rounded-xl px-4 py-2.5 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <button
                            onClick={() => setIsSectionOpen(!isSectionOpen)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 transition-colors"
                        >
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Danh sách bài học</span>
                            <ChevronUp className={`h-4 w-4 text-slate-400 transition-transform ${isSectionOpen ? '' : 'rotate-180'}`} />
                        </button>

                        {isSectionOpen && (
                            <div>
                                {filteredLessons.length === 0 ? (
                                    <div className="px-5 py-8 text-center text-sm text-slate-400">
                                        Không tìm thấy bài học nào.
                                    </div>
                                ) : (
                                    filteredLessons.map((lesson) => {
                                        const idx = lessons.findIndex(l => l.id === lesson.id);
                                        const isActive = activeLesson?.id === lesson.id;
                                        const isDone = completedIds.has(lesson.id);
                                        return (
                                            <div
                                                key={lesson.id}
                                                onClick={() => selectLesson(lesson)}
                                                className={`group flex items-start gap-3 px-5 py-4 cursor-pointer transition-all duration-200 relative ${isActive ? 'bg-indigo-50/80 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    } border-b border-slate-100 dark:border-slate-800/50`}
                                            >
                                                {/* Active Left Indicator */}
                                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" />}

                                                {/* Completion indicator */}
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 shadow-sm ${isDone
                                                        ? 'bg-emerald-500 border-emerald-500 shadow-emerald-500/30'
                                                        : isActive
                                                            ? 'border-indigo-500 shadow-indigo-500/20 bg-white'
                                                            : 'bg-white border-slate-300 group-hover:border-indigo-300 dark:border-slate-600 dark:bg-slate-800'
                                                    }`}>
                                                    {isDone && <Check className="h-3.5 w-3.5 text-white" />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold leading-snug transition-colors ${isActive ? 'text-indigo-700 dark:text-indigo-400' : isDone ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200 group-hover:text-indigo-600'
                                                        }`}>
                                                        {idx + 1}. {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <span className={`inline-flex items-center justify-center p-1 rounded-md ${isActive ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                            {getLessonIcon(lesson.type, isActive)}
                                                        </span>
                                                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{lesson.duration || '00:00'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Premium Glass Bottom Nav */}
            <footer className="h-16 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                <button
                    disabled={currentIndex <= 0}
                    onClick={() => currentIndex > 0 && selectLesson(lessons[currentIndex - 1])}
                    className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm active:scale-95"
                >
                    <ChevronLeft className="h-4 w-4" /> BÀI TRƯỚC
                </button>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        Tiến độ: <span className="text-indigo-600 dark:text-indigo-400 text-sm">{progressPct}%</span>
                    </div>
                    {lessonType !== 'QUIZ' && (
                        <button
                            onClick={handleMarkComplete}
                            disabled={marking}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-all active:scale-95 ${isCurrentCompleted
                                    ? 'bg-emerald-500 text-white border border-emerald-400/50 hover:bg-emerald-600'
                                    : 'bg-slate-900 text-white border border-slate-700/50 hover:bg-slate-800'
                                }`}            >
                            {isCurrentCompleted ? '✓ ĐÃ HOÀN THÀNH' : 'ĐÁNH DẤU HOÀN THÀNH'}
                        </button>
                    )}
                </div>

                {currentIndex >= lessons.length - 1 ? (
                    <Link
                        href={`/courses/${id}/certificate`}
                        className="flex items-center gap-2 px-5 py-2.5 border border-transparent bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-700 cursor-pointer transition-all active:scale-95"
                    >
                        HOÀN THÀNH <CheckCircle2 className="h-4 w-4 hidden sm:block" />
                    </Link>
                ) : (
                    <button
                        onClick={() => selectLesson(lessons[currentIndex + 1])}
                        className="flex items-center gap-2 px-5 py-2.5 border border-transparent bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 cursor-pointer transition-all active:scale-95"
                    >
                        BÀI TIẾP THEO <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </footer>
        </div>
    );
}

import { Suspense } from 'react';
export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="min-h-screen grid items-center justify-center">Đang tải...</div>}>
            <LearnPageInner params={params} />
        </Suspense>
    );
}
