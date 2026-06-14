/** 用户角色 */
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  PARENT = 'parent',
  ADMIN = 'admin',
}

/** 年级 */
export enum Grade {
  GRADE_1 = 1,
  GRADE_2 = 2,
  GRADE_3 = 3,
  GRADE_4 = 4,
  GRADE_5 = 5,
  GRADE_6 = 6,
  GRADE_7 = 7,
  GRADE_8 = 8,
  GRADE_9 = 9,
  GRADE_10 = 10,
  GRADE_11 = 11,
  GRADE_12 = 12,
}

/** 学科 */
export enum Subject {
  CHINESE = 'chinese',
  MATH = 'math',
  ENGLISH = 'english',
  PHYSICS = 'physics',
  CHEMISTRY = 'chemistry',
  BIOLOGY = 'biology',
  HISTORY = 'history',
  GEOGRAPHY = 'geography',
  POLITICS = 'politics',
}

/** 用户信息 */
export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  grade?: Grade;
  subjects?: Subject[];
}

/** 课程信息 */
export interface Course {
  id: string;
  title: string;
  subject: Subject;
  grade: Grade;
  description?: string;
  coverImage?: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

/** 学习进度 */
export interface LearningProgress {
  userId: string;
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  score: number;
  lastAccessedAt: string;
}

/** API 通用响应 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** 分页参数 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}