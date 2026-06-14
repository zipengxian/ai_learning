import { type ReactNode } from 'react';

interface TabItem {
  key: string;
  label: ReactNode;
  content?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function Tabs({ items, activeKey, onChange }: TabsProps) {
  const activeItem = items.find((item) => item.key === activeKey);

  return (
    <div>
      {/* Tab header */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '2px solid var(--color-border)',
        }}
      >
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                marginBottom: -2,
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {/* Tab content */}
      {activeItem?.content && (
        <div style={{ paddingTop: 'var(--spacing-md)' }}>{activeItem.content}</div>
      )}
    </div>
  );
}