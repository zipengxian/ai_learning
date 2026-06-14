import apiClient from './client';

// ── Types ──────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string;
}

export interface ChatContext {
  chapterId?: string;
  knowledgePointId?: string;
  questionId?: string;
}

export interface SSEChatEvent {
  type: 'token' | 'done' | 'error';
  content?: string;
}

// ── SSE Chat ──────────────────────────────────────────────────────

/**
 * Sends a chat message and returns an async generator that yields SSE events.
 * Uses native fetch() with ReadableStream since EventSource doesn't support POST.
 */
export async function* sendChatMessage(
  message: string,
  context?: ChatContext,
  sessionId?: string,
): AsyncGenerator<SSEChatEvent, void, undefined> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const body: Record<string, unknown> = { message };
  if (context) {
    body.context = context;
  }
  if (sessionId) {
    body.sessionId = sessionId;
  }

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6); // Remove "data: " prefix
        try {
          const event: SSEChatEvent = JSON.parse(jsonStr);
          yield event;
          if (event.type === 'done' || event.type === 'error') {
            return;
          }
        } catch {
          // Skip unparseable lines
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim().startsWith('data: ')) {
      try {
        const event: SSEChatEvent = JSON.parse(buffer.trim().slice(6));
        yield event;
      } catch {
        // Skip
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── Chat Sessions ─────────────────────────────────────────────────

export async function getChatSessions(): Promise<ChatSession[]> {
  const response = await apiClient.get<{ sessions: ChatSession[] }>('/ai/chat/sessions');
  return response.data.sessions;
}

// ── Chat History ──────────────────────────────────────────────────

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const response = await apiClient.get<{ messages: ChatMessage[] }>('/ai/chat/history', {
    params: { sessionId },
  });
  return response.data.messages;
}

// ── Save Message ──────────────────────────────────────────────────

export async function saveChatMessage(data: {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
}): Promise<void> {
  await apiClient.post('/ai/chat/save', data);
}

// ── Essay Grading ─────────────────────────────────────────────────

export interface EssayGradingResult {
  overallScore: number;
  themeScore: number;
  structureScore: number;
  languageScore: number;
  contentScore: number;
  comments: string;
  suggestions: string;
}

export async function gradeEssay(
  essay: string,
  grade?: number,
  requirements?: string,
): Promise<EssayGradingResult> {
  const response = await apiClient.post<EssayGradingResult>('/ai/essay-grade', {
    essay,
    grade,
    requirements,
  });
  return response.data;
}

// ── Question Generation ───────────────────────────────────────────

export interface GeneratedQuestion {
  type: string;
  content: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface QuestionGenerationParams {
  knowledgePointId?: number;
  questionType?: string;
  count?: number;
}

export async function generateQuestions(
  params: QuestionGenerationParams,
): Promise<{ questions: GeneratedQuestion[] }> {
  const response = await apiClient.post<{ questions: GeneratedQuestion[] }>(
    '/ai/generate-questions',
    params,
  );
  return response.data;
}

// ── Photo Search ──────────────────────────────────────────────────

export interface PhotoSearchResult {
  text: string;
  answer: string;
}

export async function photoSearch(
  image: string,
  grade?: number,
): Promise<PhotoSearchResult> {
  const response = await apiClient.post<PhotoSearchResult>('/ai/photo-search', {
    image,
    grade,
  });
  return response.data;
}