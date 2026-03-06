'use client';

import { useState, useEffect, useCallback } from 'react';
import CourseCard from '@/components/CourseCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Course, Category } from '@/types';
import Pagination from '@/components/Pagination';
import { useSearchParams } from 'next/navigation';

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const urlSearch = (searchParams.get('search') || '').trim();
  const urlCategory = searchParams.get('category') || 'All';

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 9;

  // Fetch categories once
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data || []))
      .catch(console.error);
  }, []);

  // Fetch courses with pagination and category filter
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
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
  }, [page, selectedCategory, urlSearch]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    setSelectedCategory(urlCategory);
    setPage(1);
  }, [urlCategory]);

  useEffect(() => {
    setPage(1);
  }, [urlSearch]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1); // Reset to page 1 on category change
  };

  if (loading && courses.length === 0) {
    return (
      <div className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tất cả khóa học
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">Đang tải khóa học...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-96 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tất cả khóa học
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Khám phá danh mục đầy đủ của {total} khóa học trực tuyến
          </p>
        </div>

        <Tabs value={selectedCategory} className="w-full" onValueChange={handleCategoryChange}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-8">
            <TabsTrigger value="All" className="cursor-pointer">Tất cả</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.name} className="cursor-pointer">
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-8">
            {courses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex justify-center">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Không tìm thấy khóa học nào trong danh mục này.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
