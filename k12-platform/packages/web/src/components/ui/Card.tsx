import { type ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  hoverable?: boolean;
  padding?: string;
  style?: React.CSSProperties;
}

export function Card({ title, children, hoverable = false, padding, style }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: padding || 'var(--spacing-lg)',
        transition: `box-shadow var(--transition-fast), transform var(--transition-fast)`,
        ...(hoverable && {
          cursor: 'pointer',
        }),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
          (e.currentTarget as HTMLDivElement).style.transform = 'none';
        }
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}