import { useRef, useCallback, useEffect, type KeyboardEvent } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = '输入你的问题...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg-primary)',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          fontSize: 'var(--font-size-sm)',
          fontFamily: 'inherit',
          color: 'var(--color-text-primary)',
          background: 'var(--color-bg-secondary)',
          outline: 'none',
          lineHeight: 1.5,
          minHeight: 36,
          maxHeight: 150,
          overflowY: 'auto',
          transition: 'border-color var(--transition-fast)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-accent)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background:
            disabled || !value.trim()
              ? 'var(--color-bg-tertiary)'
              : 'var(--color-accent)',
          color: disabled || !value.trim() ? 'var(--color-text-tertiary)' : '#fff',
          cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
          flexShrink: 0,
          transition: 'background var(--transition-fast)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}