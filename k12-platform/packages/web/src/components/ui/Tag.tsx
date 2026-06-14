import { type ReactNode } from 'react';

interface TagProps {
  color?: 'default' | 'accent' | 'success' | 'warning' | 'error';
  closable?: boolean;
  onClose?: () => void;
  children: ReactNode;
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  default: {
    bg: 'var(--color-bg-secondary)',
    text: 'var(--color-text-secondary)',
    border: 'var(--color-border)',
  },
  accent: {
    bg: 'var(--color-accent-light)',
    text: 'var(--color-accent)',
    border: 'var(--color-accent)',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.1)',
    text: 'var(--color-success)',
    border: 'var(--color-success)',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.1)',
    text: 'var(--color-warning)',
    border: 'var(--color-warning)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    text: 'var(--color-error)',
    border: 'var(--color-error)',
  },
};

export function Tag({ color = 'default', closable = false, onClose, children }: TagProps) {
  const c = colorMap[color];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: '2px var(--spacing-sm)',
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 500,
        lineHeight: '20px',
      }}
    >
      {children}
      {closable && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            fontSize: 12,
            lineHeight: 1,
            opacity: 0.6,
          }}
        >
          ✕
        </button>
      )}
    </span>
  );
}