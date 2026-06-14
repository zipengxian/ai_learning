import { type ReactNode } from 'react';

interface SidePanelProps {
  collapsed: boolean;
  children: ReactNode;
}

export function SidePanel({ collapsed, children }: SidePanelProps) {
  return (
    <aside
      style={{
        width: collapsed ? 48 : 'var(--sidebar-width)',
        minWidth: collapsed ? 48 : 'var(--sidebar-width)',
        height: '100%',
        background: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-border)',
        overflow: 'hidden',
        transition: `width var(--transition-normal), min-width var(--transition-normal)`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          opacity: collapsed ? 0 : 1,
          visibility: collapsed ? 'hidden' : 'visible',
          transition: `opacity var(--transition-fast), visibility var(--transition-fast)`,
          transitionDelay: collapsed ? '0ms' : '100ms',
        }}
      >
        {children}
      </div>
    </aside>
  );
}