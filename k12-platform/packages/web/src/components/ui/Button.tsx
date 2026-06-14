import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-accent)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: 'none',
  },
  danger: {
    background: 'var(--color-error)',
    color: '#fff',
    border: 'none',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: 'var(--font-size-xs)', height: '28px' },
  md: { padding: '8px 16px', fontSize: 'var(--font-size-sm)', height: '36px' },
  lg: { padding: '12px 24px', fontSize: 'var(--font-size-md)', height: '44px' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    borderRadius: 'var(--radius-md)',
    fontWeight: 500,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all var(--transition-fast)',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button style={baseStyle} disabled={disabled || loading} {...props}>
      {loading && <LoadingDot />}
      {children}
    </button>
  );
}

function LoadingDot() {
  return (
    <span
      style={{
        width: 12,
        height: 12,
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.6s linear infinite',
      }}
    />
  );
}