interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

const CACHE_PREFIX = 'k12_cache_';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function buildKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

/**
 * Store API response data in localStorage cache.
 */
export function cacheResponse<T = unknown>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(buildKey(key), JSON.stringify(entry));
  } catch {
    // localStorage full — attempt to clear expired entries and retry
    clearExpiredCache();
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(buildKey(key), JSON.stringify(entry));
    } catch {
      // Give up — cannot cache
    }
  }
}

/**
 * Get cached response if not expired.
 */
export function getCachedResponse<T = unknown>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  try {
    const raw = localStorage.getItem(buildKey(key));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > ttlMs) {
      localStorage.removeItem(buildKey(key));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Clear all cached API responses.
 */
export function clearCache(): void {
  if (typeof localStorage === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Clear only expired cache entries.
 */
function clearExpiredCache(): void {
  if (typeof localStorage === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const entry: CacheEntry = JSON.parse(raw);
          if (Date.now() - entry.timestamp > DEFAULT_TTL_MS) {
            keysToRemove.push(key);
          }
        }
      } catch {
        keysToRemove.push(key);
      }
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// Pre-defined cache keys for common resources
export const CACHE_KEYS = {
  SUBJECTS: 'subjects',
  GRADES: 'grades',
  CHAPTERS: 'chapters',
  KNOWLEDGE_POINTS: 'knowledgePoints',
  STUDY_PROGRESS: 'studyProgress',
  STUDY_STATS: 'studyStats',
  WRONG_ANSWERS: 'wrongAnswers',
} as const;