import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<string, string> = {
  sm: '400px',
  md: '560px',
  lg: '720px',
};

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Content */}
      <div
        style={{
          position: 'relative',
          background: 'var(--color-bg-primary)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          width: sizeMap[size],
          maxWidth: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - 48px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {title && (
            <h2
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              fontSize: 20,
              padding: 'var(--spacing-xs)',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div
          style={{
            padding: 'var(--spacing-lg)',
            overflow: 'auto',
            flex: 1,
            color: 'var(--color-text-secondary)',
          }}
        >
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}