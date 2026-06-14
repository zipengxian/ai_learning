import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ThreeColumnLayout } from '@/components/layout/ThreeColumnLayout';
import { SearchBar } from '@/components/ui/SearchBar';
import { InlineAIChat } from '@/components/chat/InlineAIChat';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { initSyncListeners } from '@/services/syncService';

export function MainLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    initSyncListeners();
  }, []);

  const navItems = [
    { label: '学习看板', path: '/' },
    { label: '课程中心', path: '/study' },
    { label: '练习中心', path: '/practice' },
    { label: '错题本', path: '/wrong-book' },
    { label: 'AI 助手', path: '/ai-chat' },
    { label: '作文批改', path: '/essay-grading' },
    { label: '智能出题', path: '/generate-questions' },
    { label: '拍照搜题', path: '/photo-search' },
    { label: '个人中心', path: '/profile' },
  ];

  const sidebarContent = (
    <div style={{ padding: 'var(--spacing-md)' }}>
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 600,
          color: 'var(--color-text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 'var(--spacing-md)',
          padding: '0 var(--spacing-sm)',
        }}
      >
        导航
      </div>
      {navItems.map((item) => (
        <div
          key={item.path}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 400,
            transition: 'background var(--transition-fast)',
            marginBottom: 2,
          }}
          onClick={() => navigate(item.path)}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-secondary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'transparent';
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );

  const aiPanelContent = <InlineAIChat />;

  return (
    <ThreeColumnLayout
      searchBar={
        <SearchBar
          placeholder="搜索课程、知识点..."
          onSearch={(v) => {
            if (v.trim()) {
              navigate(`/study?keyword=${encodeURIComponent(v)}`);
            }
          }}
        />
      }
      sidebarContent={sidebarContent}
      aiPanelContent={aiPanelContent}
    >
      <OfflineIndicator />
      <Outlet />
    </ThreeColumnLayout>
  );
}