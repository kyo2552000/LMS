'use client';

import { useState } from 'react';
import { Course } from '@/types';
import Link from 'next/link';
import { Clock, Users, Star, ArrowRight, BookOpen, Sparkles, Heart } from 'lucide-react';
import Image from 'next/image';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const isFree = Number(course.price) === 0 || (course as any).type === 'FREE';
  const [isFav, setIsFav] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFav(!isFav);
    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      });
    } catch { setIsFav(isFav); }
  };

  return (
    <div className="group relative w-full h-full flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer dark:bg-slate-900 dark:border-slate-800">
      
      {/* Background Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 mt-48 transition-opacity duration-500 pointer-events-none" />

      {/* Hero Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
        {course.image ? (
          <Image
            src={course.image}
            alt={course.title || 'Course image'}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-slate-300">
            <BookOpen className="h-12 w-12" />
          </div>
        )}
        
        {/* Overlay Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Favorite Heart Button */}
        <button
          onClick={toggleFavorite}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:scale-110 transition-all cursor-pointer border border-white/30"
        >
          <Heart className={`h-4 w-4 transition-colors ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
        </button>

        {/* Floating Price Badge */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/20 text-sm font-extrabold text-slate-900 dark:bg-slate-900/95 dark:text-white transform group-hover:scale-105 transition-transform flex items-center gap-1.5">
          {isFree ? (
            <span className="text-emerald-500 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Miễn phí</span>
          ) : (
            <>{Number(course.price).toLocaleString('vi-VN')} đ</>
          )}
        </div>

        {/* Bottom Tag & Rating on Image */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md bg-blue-600 text-white shadow-sm border border-blue-500/50">
              {course.category}
            </span>
            <div className="flex items-center space-x-1.5 text-sm font-bold bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md text-white border border-white/10">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span>{course.rating || '5.0'}</span>
            </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-grow p-6 z-10 relative">
        <h3 className="text-[17px] leading-snug font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
          {course.title}
        </h3>
        
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
           Giảng viên: <span className="text-slate-700 dark:text-slate-300 font-semibold">{course.instructor}</span>
        </p>

        <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-5 flex-grow">
          {course.description}
        </p>

        {/* Stats row */}
        <div className="flex items-center space-x-4 text-[13px] font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center space-x-1.5">
            <Users className="h-4 w-4 text-blue-500" />
            <span>{Number(course.students).toLocaleString('en-US')} học viên</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center space-x-1.5">
            <Clock className="h-4 w-4 text-emerald-500" />
            <span>{course.lessons.length} bài học</span>
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/courses/${course.id}`} className="w-full mt-auto">
          <button className="w-full relative px-6 py-3 rounded-xl font-bold text-sm text-white bg-slate-900 dark:bg-white dark:text-slate-900 group-hover:bg-blue-600 transition-all duration-300 overflow-hidden flex items-center justify-center gap-2">
             <span className="relative z-10 flex items-center gap-2">
                Xem chi tiết
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
             </span>
             {/* Hover shine effect */}
             <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
          </button>
        </Link>
      </div>
    </div>
  );
}
