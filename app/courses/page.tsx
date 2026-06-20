'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import CourseCard from '@/components/CourseCard';
import { Course, Category } from '@/types';
import Pagination from '@/components/Pagination';
import { useSearchParams } from 'next/navigation';
import {
  Search, SlidersHorizontal, X, ChevronDown, Grid3X3, LayoutList,
} from 'lucide-react';



// ─── Sort Options ────────────────────────────────────────────────
const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
];

// ─── Level badges ────────────────────────────────────────────────
const levelOptions = [
  { value: 'All', label: 'Tất cả cấp độ', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'BEGINNER', label: 'Mới bắt đầu', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'INTERMEDIATE', label: 'Trung cấp', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'ADVANCED', label: 'Nâng cao', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

const typeOptions = [
  { value: 'All', label: 'Tất cả' },
  { value: 'FREE', label: 'Miễn phí' },
  { value: 'PAID', label: 'Trả phí' },
];

const ratingOptions = [
  { value: '0', label: 'Tất cả' },
  { value: '4.5', label: '4.5+' },
  { value: '4.0', label: '4.0+' },
  { value: '3.5', label: '3.5+' },
];

// ─── Main Component ─────────────────────────────────────────────
function CoursesPageInner() {
  const searchParams = useSearchParams();
  const urlSearch = (searchParams.get('search') || '').trim();
  const urlCategory = searchParams.get('category') || 'All';

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<string>('newest');
  const [minRating, setMinRating] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const limit = 9;

  // Fetch categories once
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || (Array.isArray(data) ? data : [])))
      .catch(console.error);
  }, []);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedLevel !== 'All') params.set('level', selectedLevel);
      if (selectedType !== 'All') params.set('type', selectedType);
      if (selectedSort !== 'newest') params.set('sort', selectedSort);
      if (minRating !== '0') params.set('minRating', minRating);
      if (urlSearch) params.set('search', urlSearch);

      const res = await fetch(`/api/courses?${params}`);
      const data = await res.json();

      const mappedCourses = (data.courses || []).map((c: Course & { category_name?: string; instructor_name?: string }) => ({
        ...c,
        category: c.category_name || c.category,
        instructor: c.instructor_name || c.instructor,
      }));

      setCourses(mappedCourses);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, selectedLevel, selectedType, selectedSort, minRating, urlSearch]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { setSelectedCategory(urlCategory); setPage(1); }, [urlCategory]);
  useEffect(() => { setPage(1); }, [urlSearch]);

  // Count active filters
  const activeFilterCount = [
    selectedCategory !== 'All',
    selectedLevel !== 'All',
    selectedType !== 'All',
    minRating !== '0',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSelectedType('All');
    setMinRating('0');
    setSelectedSort('newest');
    setPage(1);
  };

  // ─── Skeleton Loading ────────────────────────────────────────
  if (loading && courses.length === 0) {
    return (
      <div className="py-12 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-12 bg-slate-200 rounded-2xl w-80 mx-auto animate-pulse mb-4" />
            <div className="h-5 bg-slate-100 rounded-xl w-60 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl h-[420px] animate-pulse border border-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* ═══ HEADER ═══ */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
            Khám phá khóa học
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-[15px]">
            {urlSearch ? (
              <>Kết quả tìm kiếm cho &quot;<span className="font-bold text-slate-800">{urlSearch}</span>&quot; — {total} khóa học</>
            ) : (
              <>Tổng cộng <span className="font-bold text-indigo-600">{total}</span> khóa học chất lượng cao</>
            )}
          </p>
        </div>

        {/* ═══ CATEGORY CARDS ═══ */}
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* All Category */}
            <button
              onClick={() => { setSelectedCategory('All'); setPage(1); }}
              className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
                selectedCategory === 'All'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <span className={`text-sm font-bold tracking-wide ${selectedCategory === 'All' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>
                Tất cả
              </span>
              <span className={`text-[10px] font-bold mt-1 ${selectedCategory === 'All' ? 'text-indigo-500' : 'text-slate-400'}`}>
                {total} khóa học
              </span>
              {selectedCategory === 'All' && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full" />
              )}
            </button>

            {/* Category Cards */}
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.name); setPage(1); }}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  <span className={`text-sm font-bold tracking-wide text-center leading-tight ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>
                    {cat.name}
                  </span>
                  <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                    {(cat as any).course_count || 0} khóa học
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ FILTER BAR ═══ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Bộ lọc
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={selectedSort}
                  onChange={(e) => { setSelectedSort(e.target.value); setPage(1); }}
                  className="appearance-none pl-3 pr-8 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-300 outline-none cursor-pointer"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expandable Filter Panel */}
          <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-5 space-y-5 bg-slate-50/50 dark:bg-slate-800/30">
              {/* Level Filter */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 block">
                  Cấp độ
                </label>
                <div className="flex flex-wrap gap-2">
                  {levelOptions.map(opt => {
                    const isActive = selectedLevel === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => { setSelectedLevel(opt.value); setPage(1); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                          isActive
                            ? `${opt.color} border-current shadow-sm scale-105`
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type + Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Type Filter */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 block">
                    Loại khóa học
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map(opt => {
                      const isActive = selectedType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { setSelectedType(opt.value); setPage(1); }}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300 shadow-sm scale-105'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 block">
                    Đánh giá tối thiểu
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ratingOptions.map(opt => {
                      const isActive = minRating === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { setMinRating(opt.value); setPage(1); }}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 shadow-sm scale-105'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Chips */}
          {activeFilterCount > 0 && (
            <div className="px-5 py-3 flex items-center gap-2 flex-wrap border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-400 mr-1">Đang lọc:</span>
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-bold rounded-full border border-indigo-200">
                  {selectedCategory}
                  <button onClick={() => { setSelectedCategory('All'); setPage(1); }} className="ml-0.5 hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
                </span>
              )}
              {selectedLevel !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  {levelOptions.find(l => l.value === selectedLevel)?.label}
                  <button onClick={() => { setSelectedLevel('All'); setPage(1); }} className="ml-0.5 hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
                </span>
              )}
              {selectedType !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                  {typeOptions.find(t => t.value === selectedType)?.label}
                  <button onClick={() => { setSelectedType('All'); setPage(1); }} className="ml-0.5 hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
                </span>
              )}
              {minRating !== '0' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                  {minRating}+
                  <button onClick={() => { setMinRating('0'); setPage(1); }} className="ml-0.5 hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ═══ RESULTS ═══ */}
        {courses.length > 0 ? (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500 font-medium">
                Hiển thị <span className="font-bold text-slate-800">{courses.length}</span> / {total} khóa học
              </p>
            </div>

            {/* Course Grid or List */}
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'grid grid-cols-1 gap-4'
            }>
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Search className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Không tìm thấy khóa học</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center">Đang tải...</div>}>
      <CoursesPageInner />
    </Suspense>
  );
}
