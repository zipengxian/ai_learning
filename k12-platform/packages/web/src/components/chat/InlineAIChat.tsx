import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { sendChatMessage } from '@/api/ai';
import type { ChatContext } from '@/api/ai';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface InlineAIChatProps {
  context?: ChatContext;
}

let msgIdCounter = 0;
function nextMsgId(): string {
  return `inline-msg-${++msgIdCounter}-${Date.now()}`;
}

export function InlineAIChat({ context }: InlineAIChatProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<LocalMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 K12 学习助手，有什么可以帮助你的吗？',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
      const generator = sendChatMessage(text, context);
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
  }, [inputValue, isStreaming, context]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-bg-ai-panel)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          AI 助手
        </span>
        <button
          onClick={() => navigate('/ai-chat')}
          title="展开到全屏"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-accent)',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-light)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          展开
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--spacing-sm) 0',
        }}
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isStreaming={isStreaming && msg.role === 'assistant' && msg === messages[messages.length - 1]}
          />
        ))}
        {/* Error display */}
        {error && (
          <div
            style={{
              margin: '0 var(--spacing-md) var(--spacing-sm)',
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
        placeholder="输入问题，Enter 发送..."
      />
    </div>
  );
}