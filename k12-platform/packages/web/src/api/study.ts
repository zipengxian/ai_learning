import apiClient from './client';

export interface WrongAnswerItem {
  id: string;
  questionId: string;
  questionContent: string;
  questionType: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  subjectName: string;
  knowledgePointTitle: string;
  createdAt: string;
}

export interface WrongAnswersResponse {
  list: WrongAnswerItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WrongAnswersParams {
  subjectId?: string;
  page?: number;
  limit?: number;
}

export interface SubjectProgressItem {
  subjectId: string;
  subjectName: string;
  completed: number;
  total: number;
  rate: number;
}

export interface GradeProgressItem {
  gradeId: string;
  gradeName: string;
  completed: number;
  total: number;
  rate: number;
}

export interface RecentActivity {
  id: string;
  knowledgePointTitle: string;
  chapterTitle: string;
  subjectName: string;
  createdAt: string;
  score?: number;
}

export interface StudyProgress {
  totalKnowledgePoints: number;
  completedKnowledgePoints: number;
  completionRate: number;
  totalQuestions: number;
  correctRate: number;
  subjectProgress: SubjectProgressItem[];
  gradeProgress: GradeProgressItem[];
  recentActivities: RecentActivity[];
}

export interface WeekTrendItem {
  date: string;
  count: number;
}

export interface StudyStats {
  todayCompleted: number;
  todayQuestions: number;
  todayCorrectRate: number;
  weekCompleted: number;
  weekTrend: WeekTrendItem[];
  pendingWrongAnswers: number;
}

export async function getStudyProgress(): Promise<StudyProgress> {
  const response = await apiClient.get<StudyProgress>('/study/progress');
  return response.data;
}

export async function getStudyStats(): Promise<StudyStats> {
  const response = await apiClient.get<StudyStats>('/study/stats');
  return response.data;
}

export async function getWrongAnswers(params?: WrongAnswersParams): Promise<WrongAnswersResponse> {
  const response = await apiClient.get<WrongAnswersResponse>('/wrong-answers', { params });
  return response.data;
}

export async function deleteWrongAnswer(id: string): Promise<void> {
  await apiClient.delete(`/wrong-answers/${id}`);
}