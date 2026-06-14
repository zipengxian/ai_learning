interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeMap: Record<string, number> = {
  sm: 16,
  md: 32,
  lg: 48,
};

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const px = sizeMap[size];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-xl)',
      }}
    >
      <span
        style={{
          width: px,
          height: px,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-accent)',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.6s linear infinite',
        }}
      />
      {text && (
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
}