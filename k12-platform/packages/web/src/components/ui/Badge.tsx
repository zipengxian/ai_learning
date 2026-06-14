import { type ReactNode } from 'react';

interface BadgeProps {
  count?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  children?: ReactNode;
  dot?: boolean;
}

const variantBg: Record<string, string> = {
  default: 'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
};

export function Badge({ count, variant = 'default', children, dot = false }: BadgeProps) {
  const bgColor = variantBg[variant];

  if (children) {
    return (
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        {children}
        {dot ? (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: bgColor,
              border: '2px solid var(--color-bg-primary)',
              transform: 'translate(40%, -40%)',
            }}
          />
        ) : count !== undefined && count > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              minWidth: 18,
              height: 18,
              borderRadius: 'var(--radius-full)',
              background: bgColor,
              color: '#fff',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              transform: 'translate(40%, -40%)',
              lineHeight: 1,
            }}
          >
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </span>
    );
  }

  // Standalone badge (count only)
  if (count !== undefined) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 20,
          height: 20,
          borderRadius: 'var(--radius-full)',
          background: bgColor,
          color: '#fff',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 600,
          padding: '0 6px',
          lineHeight: 1,
        }}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  }

  // Dot-only badge
  if (dot) {
    return (
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: bgColor,
        }}
      />
    );
  }

  return null;
}