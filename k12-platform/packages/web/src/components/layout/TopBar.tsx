import { type ReactNode } from 'react';

interface TopBarProps {
  onToggleSidebar: () => void;
  onToggleAIPanel: () => void;
  sidebarCollapsed: boolean;
  aiPanelCollapsed: boolean;
  searchBar?: ReactNode;
  userMenu?: ReactNode;
}

export function TopBar({
  onToggleSidebar,
  onToggleAIPanel,
  sidebarCollapsed,
  aiPanelCollapsed,
  searchBar,
  userMenu,
}: TopBarProps) {
  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--spacing-md)',
        background: 'var(--color-bg-primary)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        gap: 'var(--spacing-md)',
      }}
    >
      {/* Left: nav toggle + logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <IconButton
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {sidebarCollapsed ? <MenuIcon /> : <MenuIcon />}
        </IconButton>
        <span
          style={{
            fontWeight: 700,
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-accent)',
            userSelect: 'none',
          }}
        >
          K12
        </span>
      </div>

      {/* Center: search */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {searchBar}
      </div>

      {/* Right: theme + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <IconButton
          onClick={onToggleAIPanel}
          title={aiPanelCollapsed ? '展开 AI 面板' : '收起 AI 面板'}
        >
          <AIIcon />
        </IconButton>
        {userMenu}
      </div>
    </header>
  );
}

function IconButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'background var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-secondary)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function AIIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4v1h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z" />
      <circle cx="12" cy="15" r="1" />
      <path d="M9 10h6" />
    </svg>
  );
}