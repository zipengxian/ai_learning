import { type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
}

export function Input({
  label,
  error,
  prefixIcon,
  suffixIcon,
  id,
  style,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          background: 'var(--color-bg-primary)',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0 var(--spacing-md)',
          height: 36,
          transition: 'border-color var(--transition-fast)',
        }}
      >
        {prefixIcon && (
          <span
            style={{
              color: 'var(--color-text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {prefixIcon}
          </span>
        )}
        <input
          id={inputId}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'inherit',
            lineHeight: 1,
          }}
          {...props}
        />
        {suffixIcon && (
          <span
            style={{
              color: 'var(--color-text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {suffixIcon}
          </span>
        )}
      </div>
      {error && (
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-error)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}