import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-2xl) var(--spacing-lg)',
        textAlign: 'center',
        gap: 'var(--spacing-md)',
      }}
    >
      {icon && (
        <div
          style={{
            color: 'var(--color-text-tertiary)',
            opacity: 0.4,
            fontSize: 48,
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: 'var(--font-size-md)',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          margin: 0,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-tertiary)',
            maxWidth: 320,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 'var(--spacing-sm)' }}>{action}</div>}
    </div>
  );
}