const DEFAULT_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let message: string;
      try {
        const parsed = JSON.parse(errorBody);
        message = parsed.message || parsed.error || response.statusText;
      } catch {
        message = errorBody || response.statusText;
      }
      throw new Error(message);
    }

    const data = await response.json();
    return data as T;
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: Record<string, unknown> }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    grade?: string;
    role?: string;
  }) {
    return this.request<{ token: string; user: Record<string, unknown> }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getProfile() {
    return this.request<Record<string, unknown>>('/auth/profile');
  }

  // Subjects
  async getSubjects() {
    return this.request<Array<{ id: string; name: string; icon?: string }>>(
      '/subjects'
    );
  }

  // Chapters
  async getChapters(subjectId: string, grade?: string) {
    const params = new URLSearchParams();
    if (grade) params.append('grade', grade);
    const query = params.toString();
    return this.request<
      Array<{
        id: string;
        name: string;
        subjectId: string;
        grade: string;
        order: number;
      }>
    >(`/subjects/${subjectId}/chapters${query ? `?${query}` : ''}`);
  }

  // Knowledge Points
  async getKnowledgePoints(
    chapterId: string
  ) {
    return this.request<
      Array<{
        id: string;
        name: string;
        chapterId: string;
        content: string;
        status: 'not_started' | 'in_progress' | 'completed';
        order: number;
      }>
    >(`/chapters/${chapterId}/knowledge-points`);
  }

  async getKnowledgePointDetail(pointId: string) {
    return this.request<{
      id: string;
      name: string;
      content: string;
      examples: string[];
      questions: Array<{
        id: string;
        question: string;
        options: string[];
        answer: number;
      }>;
      status: 'not_started' | 'in_progress' | 'completed';
    }>(`/knowledge-points/${pointId}`);
  }

  async markKnowledgePointCompleted(pointId: string) {
    return this.request<{ success: boolean }>(
      `/knowledge-points/${pointId}/complete`,
      { method: 'POST' }
    );
  }

  // Stats
  async getStats() {
    return this.request<{
      completedToday: number;
      totalQuestions: number;
      correctRate: number;
      activities: Array<{
        id: string;
        type: string;
        title: string;
        time: string;
      }>;
    }>('/stats');
  }

  // AI Chat
  async sendMessage(message: string) {
    return this.request<{
      reply: string;
      conversationId: string;
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Photo Search
  async photoSearch(image: string, grade?: number) {
    return this.request<{
      text: string;
      answer: string;
    }>('/ai/photo-search', {
      method: 'POST',
      body: JSON.stringify({ image, grade }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;