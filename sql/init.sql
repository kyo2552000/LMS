CREATE DATABASE IF NOT EXISTS edulearn;
USE edulearn;

-- Drop existing tables (if any) in correct order
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS lesson_progress;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS coupon_usage;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(50) DEFAULT 'blue',
  icon VARCHAR(50) DEFAULT 'shield',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  module VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Permissions pivot
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id VARCHAR(36) NOT NULL,
  permission_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  google_id VARCHAR(255) NULL UNIQUE,
  role ENUM('STUDENT', 'INSTRUCTOR', 'ADMIN') DEFAULT 'STUDENT',
  role_id VARCHAR(36),
  status ENUM('ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'ACTIVE',
  user_type VARCHAR(50) DEFAULT 'default',
  bio TEXT,
  phone VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255),
  description TEXT,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(100) NOT NULL,
  course_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500),
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  image TEXT,
  rating DECIMAL(3, 2) DEFAULT 0,
  students INT DEFAULT 0,
  level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'BEGINNER',
  type ENUM('FREE', 'PAID') DEFAULT 'PAID',
  published BOOLEAN DEFAULT FALSE,
  category_id VARCHAR(36) NOT NULL,
  instructor_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_courses_category (category_id),
  INDEX idx_courses_instructor (instructor_id)
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  duration VARCHAR(20),
  type ENUM('VIDEO', 'QUIZ', 'ASSIGNMENT', 'TEXT') DEFAULT 'VIDEO',
  content TEXT,
  video_url VARCHAR(500),
  docx_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  course_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_lessons_course (course_id)
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(36) PRIMARY KEY,
  status ENUM('ACTIVE', 'COMPLETED', 'PAUSED') DEFAULT 'ACTIVE',
  progress DECIMAL(5, 2) DEFAULT 0,
  user_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (user_id, course_id),
  INDEX idx_enrollments_user (user_id),
  INDEX idx_enrollments_course (course_id)
);

-- Lesson Progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id VARCHAR(36) PRIMARY KEY,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  watch_time INT DEFAULT 0,
  watch_percent DECIMAL(5, 2) DEFAULT 0,
  last_position INT DEFAULT 0,
  user_id VARCHAR(36) NOT NULL,
  lesson_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_progress (user_id, lesson_id),
  INDEX idx_progress_user (user_id),
  INDEX idx_progress_lesson (lesson_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY,
  rating INT NOT NULL,
  comment TEXT,
  user_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (user_id, course_id),
  INDEX idx_reviews_user (user_id),
  INDEX idx_reviews_course (course_id)
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  role ENUM('USER', 'ASSISTANT') NOT NULL,
  content TEXT NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_user (user_id)
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (user_id, course_id),
  INDEX idx_favorites_user (user_id),
  INDEX idx_favorites_course (course_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  status ENUM('PENDING', 'PAID', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING',

  payment_method VARCHAR(50) DEFAULT 'QR_TRANSFER',
  coupon_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_course (course_id)
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type ENUM('PERCENTAGE', 'FIXED') DEFAULT 'PERCENTAGE',
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2) NULL,
  usage_limit INT DEFAULT NULL,
  usage_count INT DEFAULT 0,
  status ENUM('ACTIVE', 'INACTIVE', 'EXPIRED') DEFAULT 'ACTIVE',
  expires_at TIMESTAMP NULL,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Coupon Usage table
CREATE TABLE IF NOT EXISTS coupon_usage (
  id VARCHAR(36) PRIMARY KEY,
  coupon_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36),
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_coupon_user (coupon_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(36) PRIMARY KEY,
  content TEXT NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  lesson_id VARCHAR(36) NULL,
  parent_id VARCHAR(36) NULL,
  status ENUM('VISIBLE', 'HIDDEN', 'FLAGGED') DEFAULT 'VISIBLE',
  likes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_comments_course (course_id),
  INDEX idx_comments_user (user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  href VARCHAR(500) NULL,
  entity_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id)
);
