import { useState, useRef, useCallback, useEffect } from 'react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { SessionList } from '@/components/chat/SessionList';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  sendChatMessage,
  getChatSessions,
  getChatHistory,
  type ChatSession,
  type ChatMessage as ChatMessageType,
} from '@/api/ai';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

let msgIdCounter = 0;
function nextMsgId(): string {
  return `msg-${++msgIdCounter}-${Date.now()}`;
}

export default function AIChatPage() {
  // Session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Load sessions ────────────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await getChatSessions();
      setSessions(data);
    } catch {
      // Silently fail — sessions are not critical
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ── Load history when session changes ───────────────────────────

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const loadHistory = async () => {
      setHistoryLoading(true);
      setError(null);
      try {
        const history = await getChatHistory(activeSessionId);
        setMessages(
          history.map((msg: ChatMessageType) => ({
            id: msg.id || `hist-${msg.timestamp}`,
            role: msg.role,
            content: msg.content,
          })),
        );
      } catch {
        setError('加载对话历史失败');
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [activeSessionId]);

  // ── Scroll to bottom ────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Send message ─────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    const userMsg: LocalMessage = {
      id: nextMsgId(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setError(null);
    setIsStreaming(true);

    const assistantMsgId = nextMsgId();
    const assistantMsg: LocalMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const generator = sendChatMessage(text, undefined, activeSessionId || undefined);
      for await (const event of generator) {
        if (event.type === 'token') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + (event.content || '') }
                : m,
            ),
          );
        } else if (event.type === 'error') {
          setError(event.content || '发生未知错误');
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content || event.content || '发生错误，请重试' }
                : m,
            ),
          );
        }
      }

      // Refresh sessions after a successful message
      if (!activeSessionId) {
        await loadSessions();
        // The backend should have created a session; find the latest one
        const updated = await getChatSessions();
        setSessions(updated);
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id);
        }
      } else {
        loadSessions();
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '网络错误，请重试';
      setError(errMsg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: m.content || errMsg }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [inputValue, isStreaming, activeSessionId, loadSessions]);

  // ── Session handlers ─────────────────────────────────────────────

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setError(null);
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setInputValue('');
    setError(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* Session sidebar */}
      <div style={{ width: 260, flexShrink: 0, height: '100%' }}>
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          loading={sessionsLoading}
        />
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: 'var(--color-bg-primary)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <h1
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            AI 学习助手
          </h1>
          {activeSessionId && (
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              会话 ID: {activeSessionId.slice(0, 8)}...
            </span>
          )}
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--spacing-md) 0',
          }}
        >
          {historyLoading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: 'var(--spacing-2xl)',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 32,
                  height: 32,
                  border: '3px solid var(--color-border)',
                  borderTopColor: 'var(--color-accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              }
              title="开始新的对话"
              description="在左侧选择已有会话，或点击「新对话」开始与 AI 助手交流"
            />
          ) : (
            messages.map((msg) => {
              const isLastAssistant =
                msg.role === 'assistant' && msg === messages[messages.length - 1];
              return (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={isStreaming && isLastAssistant}
                />
              );
            })
          )}

          {/* Error display */}
          {error && (
            <div
              style={{
                margin: '0 var(--spacing-md)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-error)',
              }}
            >
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={isStreaming}
          placeholder="输入你的问题，Enter 发送，Shift+Enter 换行..."
        />
      </div>
    </div>
  );
}