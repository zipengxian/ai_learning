import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [content]);

  const isUser = role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 'var(--spacing-md)',
        padding: '0 var(--spacing-md)',
      }}
    >
      <div
        style={{
          maxWidth: isUser ? '75%' : '90%',
          padding: isUser ? 'var(--spacing-sm) var(--spacing-md)' : 'var(--spacing-md)',
          borderRadius: isUser ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
          background: isUser ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
          color: isUser ? '#fff' : 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 1.7,
          wordBreak: 'break-word',
        }}
      >
        {isUser ? (
          content
        ) : (
          <div className="chat-markdown">
            <style>{`
              .chat-markdown h1,
              .chat-markdown h2,
              .chat-markdown h3,
              .chat-markdown h4 {
                color: var(--color-text-primary);
                margin-top: 1.2em;
                margin-bottom: 0.5em;
                font-weight: 600;
                line-height: 1.3;
              }
              .chat-markdown h1 { font-size: var(--font-size-lg); border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; }
              .chat-markdown h2 { font-size: var(--font-size-md); }
              .chat-markdown h3 { font-size: var(--font-size-sm); }
              .chat-markdown p { margin-bottom: 0.8em; }
              .chat-markdown p:last-child { margin-bottom: 0; }
              .chat-markdown a { color: var(--color-accent); }
              .chat-markdown blockquote {
                border-left: 3px solid var(--color-accent);
                padding-left: var(--spacing-md);
                color: var(--color-text-secondary);
                margin: var(--spacing-md) 0;
              }
              .chat-markdown ul,
              .chat-markdown ol {
                padding-left: 1.5em;
                margin-bottom: 0.8em;
              }
              .chat-markdown li { margin-bottom: 0.25em; }
              .chat-markdown table {
                width: 100%;
                border-collapse: collapse;
                margin: var(--spacing-md) 0;
                font-size: var(--font-size-xs);
              }
              .chat-markdown th,
              .chat-markdown td {
                border: 1px solid var(--color-border);
                padding: var(--spacing-xs) var(--spacing-sm);
                text-align: left;
              }
              .chat-markdown th {
                background: var(--color-bg-tertiary);
                font-weight: 600;
              }
              .chat-markdown hr {
                border: none;
                border-top: 1px solid var(--color-border);
                margin: var(--spacing-md) 0;
              }
              .chat-markdown code {
                background: var(--color-bg-tertiary);
                padding: 2px 6px;
                border-radius: var(--radius-sm);
                font-family: var(--font-mono);
                font-size: 0.9em;
              }
              .chat-markdown pre {
                background: var(--color-bg-tertiary);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
                overflow-x: auto;
                margin: var(--spacing-md) 0;
              }
              .chat-markdown pre code {
                background: none;
                padding: 0;
                border-radius: 0;
              }
              [data-theme='dark'] .chat-markdown .katex {
                color: var(--color-text-primary);
              }
              [data-theme='dark'] .chat-markdown .katex-html {
                color: var(--color-text-primary);
              }
            `}</style>
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        {/* Copy button for assistant messages */}
        {!isUser && content && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 'var(--spacing-xs)',
            }}
          >
            <button
              onClick={handleCopy}
              title="复制内容"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
                color: copied ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                transition: 'color var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  已复制
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  复制
                </>
              )}
            </button>
          </div>
        )}

        {/* Streaming cursor */}
        {isStreaming && (
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 16,
              background: 'var(--color-accent)',
              marginLeft: 2,
              verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}