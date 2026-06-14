import apiClient from './client';
import type { ApiResponse } from '@k12/shared';

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

export interface GradeItem {
  id: string;
  name: string;
  level: number;
}

export interface ChapterItem {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  subjectName?: string;
  gradeId: string;
  gradeName?: string;
  knowledgePointCount?: number;
  order?: number;
  sortOrder?: number;
}

export interface KnowledgePointOutlineItem {
  id: string;
  title: string;
  content: string;
  videoUrl?: string | null;
  sortOrder: number;
  status: string | null;
}

export interface QuestionItem {
  id: number;
  type: string;
  content: string;
  options: string | null;
  difficulty?: number;
}

export interface KnowledgePointDetail {
  id: number;
  chapterId: number;
  title: string;
  chapterTitle: string;
  subjectName: string;
  content: string;
  videoUrl: string | null;
  questions: QuestionItem[];
}

export interface AnswerSubmission {
  answers: Array<{
    questionId: number;
    answer: string;
  }>;
}

export interface AnswerResultItem {
  questionId: number;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
}

export interface AnswerCheckResponse {
  results: AnswerResultItem[];
  score: number;
  total: number;
}

export interface SearchResult {
  knowledgePoints: Array<{ id: string; title: string }>;
  chapters: Array<{ id: string; title: string }>;
}

export async function getSubjects(): Promise<SubjectItem[]> {
  const response = await apiClient.get<{ subjects: SubjectItem[] }>('/subjects');
  return response.data.subjects;
}

export async function getGrades(): Promise<GradeItem[]> {
  const response = await apiClient.get<{ grades: GradeItem[] }>('/grades');
  return response.data.grades;
}

export async function getChapters(subjectId?: string, gradeId?: string): Promise<ChapterItem[]> {
  const response = await apiClient.get<{ chapters: ChapterItem[] }>('/chapters', {
    params: { subjectId, gradeId },
  });
  return response.data.chapters;
}

export async function getKnowledgePoints(chapterId: string): Promise<KnowledgePointOutlineItem[]> {
  const response = await apiClient.get<{ knowledgePoints: KnowledgePointOutlineItem[] }>(
    `/chapters/${chapterId}/knowledge-points`,
  );
  return response.data.knowledgePoints;
}

export async function getKnowledgePoint(id: string): Promise<KnowledgePointDetail> {
  const response = await apiClient.get<KnowledgePointDetail>(`/knowledge-points/${id}`);
  return response.data;
}

export async function checkAnswers(data: AnswerSubmission): Promise<AnswerCheckResponse> {
  const response = await apiClient.post<AnswerCheckResponse>(
    '/questions/check',
    data,
  );
  return response.data;
}

export async function submitAnswers(
  _knowledgePointId: string,
  answers: Array<{ questionId: number; answer: string }>,
): Promise<AnswerCheckResponse> {
  return checkAnswers({ answers });
}

export async function recordStudy(data: {
  knowledgePointId: string;
  status?: string;
  score?: number;
}): Promise<void> {
  await apiClient.post('/study/records', data);
}

export async function search(keyword: string): Promise<SearchResult> {
  const response = await apiClient.get<ApiResponse<SearchResult>>('/search', {
    params: { keyword },
  });
  return response.data.data;
}