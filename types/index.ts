export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructor_name?: string;
  instructor_avatar?: string;
  price: number;
  image: string;
  category: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  lessons: Lesson[];
  rating: number;
  students: number;
  isEnrolled?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'assignment' | 'VIDEO' | 'QUIZ' | 'ASSIGNMENT';
  video_url?: string;
  content?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  course_count?: number;
}
