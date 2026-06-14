import {
  getStudyProgress,
  getStudyStats,
  getWrongAnswers,
  deleteWrongAnswer,
  type WrongAnswersParams,
  type WrongAnswersResponse,
  type StudyProgress,
  type StudyStats,
} from '@/api/study';
import apiClient from '@/api/client';
import { enqueueAction } from './syncService';
import { cacheResponse, getCachedResponse, CACHE_KEYS } from './offlineCache';

function isNetworkError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.message === 'Network Error' || (err as { code?: string }).code === 'ERR_NETWORK')
  );
}

/**
 * Record a study activity. Tries API first; on network failure, enqueues for later sync.
 */
export async function recordStudyOffline(data: {
  knowledgePointId: string;
  score?: number;
  totalQuestions?: number;
  correctCount?: number;
}): Promise<void> {
  try {
    await apiClient.post('/study/records', data);
  } catch (err) {
    if (isNetworkError(err)) {
      enqueueAction('recordStudy', data);
      return;
    }
    throw err;
  }
}

/**
 * Get study progress. Tries API first; on network failure, uses cache.
 */
export async function getProgressOffline(): Promise<StudyProgress | null> {
  try {
    const data = await getStudyProgress();
    cacheResponse(CACHE_KEYS.STUDY_PROGRESS, data);
    return data;
  } catch (err) {
    if (isNetworkError(err)) {
      const cached = getCachedResponse<StudyProgress>(CACHE_KEYS.STUDY_PROGRESS);
      return cached;
    }
    throw err;
  }
}

/**
 * Get study stats. Tries API first; on network failure, uses cache.
 */
export async function getStatsOffline(): Promise<StudyStats | null> {
  try {
    const data = await getStudyStats();
    cacheResponse(CACHE_KEYS.STUDY_STATS, data);
    return data;
  } catch (err) {
    if (isNetworkError(err)) {
      const cached = getCachedResponse<StudyStats>(CACHE_KEYS.STUDY_STATS);
      return cached;
    }
    throw err;
  }
}

/**
 * Get wrong answers. Tries API first; on network failure, uses cache.
 */
export async function getWrongAnswersOffline(
  params?: WrongAnswersParams,
): Promise<WrongAnswersResponse | null> {
  const cacheKey = params
    ? `${CACHE_KEYS.WRONG_ANSWERS}_${JSON.stringify(params)}`
    : CACHE_KEYS.WRONG_ANSWERS;
  try {
    const data = await getWrongAnswers(params);
    cacheResponse(cacheKey, data);
    return data;
  } catch (err) {
    if (isNetworkError(err)) {
      const cached = getCachedResponse<WrongAnswersResponse>(cacheKey);
      return cached;
    }
    throw err;
  }
}

/**
 * Mark a wrong answer as mastered (deletes it). Tries API first; on network failure, enqueues.
 */
export async function markWrongAnswerMastered(id: string): Promise<void> {
  try {
    await deleteWrongAnswer(id);
  } catch (err) {
    if (isNetworkError(err)) {
      enqueueAction('markWrongAnswerMastered', { id });
      return;
    }
    throw err;
  }
}