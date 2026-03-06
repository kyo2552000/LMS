'use client';

import { use, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlayCircle, FileText, HelpCircle, CheckCircle, Link as LinkIcon, X, ChevronUp, MessageCircle, ChevronLeft, ChevronRight, Menu, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Course, Lesson } from '@/types';

export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const lessonIdParam = searchParams.get('lesson');

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

    // UI states
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSectionOpen, setIsSectionOpen] = useState(true);

    useEffect(() => {
        async function fetchCourse() {
            try {
                const res = await fetch(`/api/courses/${id}`);
                if (!res.ok) throw new Error('Not found');
                const data = await res.json();

                if (!data.isEnrolled) {
                    router.push(`/courses/${id}`);
                    return;
                }

                setCourse(data);

                // Set active lesson
                if (data.lessons && data.lessons.length > 0) {
                    if (lessonIdParam) {
                        const found = data.lessons.find((l: Lesson) => l.id === lessonIdParam);
                        if (found) {
                            setActiveLesson(found);
                        } else {
                            setActiveLesson(data.lessons[0]);
                        }
                    } else {
                        setActiveLesson(data.lessons[0]);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCourse();
    }, [id, router, lessonIdParam]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Không tìm thấy khóa học hoặc không được phép truy cập</h1>
                <Link href={`/courses/${id}`}>
                    <Button>Quay lại khóa học</Button>
                </Link>
            </div>
        );
    }

    const getLessonIcon = (type: string, isActive: boolean) => {
        const color = isActive ? 'text-blue-600' : 'text-slate-400';
        switch (type?.toLowerCase()) {
            case 'video':
                return <PlayCircle className={`h-4 w-4 ${color}`} />;
            case 'quiz':
                return <HelpCircle className={`h-4 w-4 ${color}`} />;
            case 'assignment':
                return <FileText className={`h-4 w-4 ${color}`} />;
            default:
                return <PlayCircle className={`h-4 w-4 ${color}`} />;
        }
    };

    const getActiveLessonIndex = () => {
        if (!course || !course.lessons || !activeLesson) return 0;
        return course.lessons.findIndex(l => l.id === activeLesson.id);
    };

    const currentIndex = getActiveLessonIndex();
    const hasNext = course.lessons && currentIndex < course.lessons.length - 1;
    const hasPrev = currentIndex > 0;

    const navigateLesson = (direction: 'next' | 'prev') => {
        if (!course || !course.lessons) return;
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= 0 && newIndex < course.lessons.length) {
            const nextLesson = course.lessons[newIndex];
            setActiveLesson(nextLesson);
            const params = new URLSearchParams(window.location.search);
            params.set('lesson', nextLesson.id);
            router.push(`/courses/${id}/learn?${params.toString()}`, { scroll: false });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
            {/* Header */}
            <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 sm:px-6 shrink-0 z-50 shadow-md">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Link href={`/courses/${id}`} className="hover:text-slate-300 transition-colors shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="font-medium text-sm sm:text-base truncate">
                        {course.title}
                    </h1>
                </div>
                <div className="flex items-center gap-6 shrink-0 ml-4">
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-xs font-medium text-slate-300">
                            0%
                        </div>
                        <span className="text-sm text-slate-300 font-medium">0/{course.lessons?.length || 0} lessons</span>
                    </div>
                    <button className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors">
                        <LinkIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Guide</span>
                    </button>
                </div>
            </header>

            {/* Main Wrapper */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Main Content Area */}
                <main className={`flex-1 flex flex-col h-full bg-white overflow-y-auto transition-all duration-300 pb-20`}>
                    {activeLesson ? (
                        <div className="w-full">
                            {/* Video Section */}
                            <div className="w-full bg-black aspect-video max-h-[70vh] relative group flex justify-center items-center">
                                {activeLesson.video_url ? (
                                    <iframe
                                        src={activeLesson.video_url.includes('watch?v=')
                                            ? activeLesson.video_url.replace("watch?v=", "embed/")
                                            : activeLesson.video_url}
                                        className="w-full h-full border-0 max-w-[1400px]"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    ></iframe>
                                ) : (
                                    <div className="text-center p-8 flex flex-col items-center justify-center">
                                        <PlayCircle className="h-16 w-16 text-slate-800 mb-4" />
                                        <p className="text-slate-500">Video chưa có sẵn cho bài học này</p>
                                    </div>
                                )}
                            </div>

                            {/* Lesson Info Section */}
                            <div className="max-w-5xl mx-auto w-full px-6 py-8 md:py-10">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
                                    {activeLesson.title}
                                </h1>
                                <div className="prose prose-slate max-w-none text-slate-600">
                                    {activeLesson.content ? (
                                        <div dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                                    ) : (
                                        <p className="italic">Không có nội dung mô tả cho bài học này.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center flex-col text-slate-400">
                            <PlayCircle className="h-16 w-16 mb-4 opacity-50" />
                            <p>Vui lòng chọn một bài học để bắt đầu</p>
                        </div>
                    )}
                </main>

                {/* Sidebar (Drawer) */}
                <aside
                    className={`w-80 sm:w-80 lg:w-[350px] shrink-0 border-l border-slate-200 bg-slate-50 flex flex-col shadow-xl sm:shadow-none absolute right-0 top-0 bottom-0 z-40 transition-transform duration-300 ease-in-out sm:relative ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full sm:hidden'
                        }`}
                >
                    <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50 shrink-0">
                        <h3 className="font-semibold text-slate-800">Course content</h3>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* Section Header */}
                        <div className="border-b border-slate-200">
                            <button
                                onClick={() => setIsSectionOpen(!isSectionOpen)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className="text-left">
                                    <h4 className="font-bold text-sm text-slate-900">1. Danh sách bài học</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        0/{course.lessons?.length || 0} | 00:00
                                    </p>
                                </div>
                                <div className="shrink-0 ml-2">
                                    {isSectionOpen ? (
                                        <ChevronUp className="h-4 w-4 text-slate-400" />
                                    ) : (
                                        <ChevronUp className="h-4 w-4 text-slate-400 rotate-180 transition-transform" />
                                    )}
                                </div>
                            </button>

                            {/* Lessons List */}
                            {isSectionOpen && (
                                <div className="bg-white">
                                    {course.lessons?.map((lesson, index) => {
                                        const isActive = activeLesson?.id === lesson.id;
                                        return (
                                            <div
                                                key={lesson.id}
                                                onClick={() => {
                                                    setActiveLesson(lesson);
                                                    const params = new URLSearchParams(window.location.search);
                                                    params.set('lesson', lesson.id);
                                                    router.push(`/courses/${id}/learn?${params.toString()}`, { scroll: false });
                                                    // On mobile, close sidebar after selecting
                                                    if (window.innerWidth < 640) {
                                                        setIsSidebarOpen(false);
                                                    }
                                                }}
                                                className={`group flex items-start px-4 py-3 cursor-pointer transition-colors ${isActive
                                                        ? 'bg-blue-50/50'
                                                        : 'hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className={`text-sm font-medium leading-snug line-clamp-2 ${isActive ? 'text-blue-700' : 'text-slate-800'
                                                        }`}>
                                                        {index + 1}. {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1.5 opacity-80">
                                                        {getLessonIcon(lesson.type, isActive)}
                                                        <span className="text-xs text-slate-500 flex-1">
                                                            {lesson.duration || '00:00'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Checkbox */}
                                                <div className="shrink-0 pt-1">
                                                    <div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center bg-white group-hover:border-slate-400 transition-colors">
                                                        {/* Complete icon goes here when implemented */}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 sm:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                
            </div>

            {/* Bottom Navigation */}
            <footer className="h-16 bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6">
                <div className="hidden md:block font-semibold text-sm text-slate-800 truncate flex-1 pr-4">
                    {course.lessons && course.lessons.length > 0 ? "1. Danh sách bài học" : "Đang tải..."}
                </div>

                <div className="flex items-center justify-center gap-3 flex-1">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!hasPrev}
                        onClick={() => navigateLesson('prev')}
                        className="text-slate-600 font-semibold text-xs tracking-wide h-9"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">PREVIOUS</span>
                    </Button>

                    <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs tracking-wide h-9 px-6"
                    >
                        COMPLETED
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!hasNext}
                        onClick={() => navigateLesson('next')}
                        className="text-slate-600 font-semibold text-xs tracking-wide h-9"
                    >
                        <span className="hidden sm:inline">NEXT</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>

                <div className="flex justify-end flex-1">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        title={isSidebarOpen ? "Đóng danh sách bài học" : "Mở danh sách bài học"}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </footer>
        </div>
    );
}
