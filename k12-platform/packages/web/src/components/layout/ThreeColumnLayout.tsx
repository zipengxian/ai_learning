import { useState, useEffect, type ReactNode } from 'react';
import { TopBar } from './TopBar';
import { SidePanel } from './SidePanel';
import { AIPanel } from './AIPanel';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

const MOBILE_BREAKPOINT = 768;

interface ThreeColumnLayoutProps {
  sidebarContent?: ReactNode;
  children?: ReactNode;
  aiPanelContent?: ReactNode;
  searchBar?: ReactNode;
}

export function ThreeColumnLayout({
  sidebarContent,
  children,
  aiPanelContent,
  searchBar,
}: ThreeColumnLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelCollapsed, setAIPanelCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileAiOpen, setMobileAiOpen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) {
        setSidebarCollapsed(false);
        setAIPanelCollapsed(false);
      } else {
        setMobileSidebarOpen(false);
        setMobileAiOpen(false);
      }
    };
    handleChange(mql);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen((v) => !v);
      setMobileAiOpen(false);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  const handleToggleAIPanel = () => {
    if (isMobile) {
      setMobileAiOpen((v) => !v);
      setMobileSidebarOpen(false);
    } else {
      setAIPanelCollapsed((v) => !v);
    }
  };

  const handleBackdropClose = () => {
    setMobileSidebarOpen(false);
    setMobileAiOpen(false);
  };

  const showBackdrop = isMobile && (mobileSidebarOpen || mobileAiOpen);

  return (
    <ThemeProvider>
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--color-bg-primary)',
          transition: 'background var(--transition-normal)',
        }}
      >
        <TopBar
          onToggleSidebar={handleToggleSidebar}
          onToggleAIPanel={handleToggleAIPanel}
          sidebarCollapsed={isMobile ? true : sidebarCollapsed}
          aiPanelCollapsed={isMobile ? true : aiPanelCollapsed}
          searchBar={searchBar}
          userMenu={<ThemeToggle />}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {isMobile ? (
            <>
              {/* Backdrop */}
              {showBackdrop && (
                <div
                  className={`mobile-sidebar-backdrop${showBackdrop ? ' open' : ''}`}
                  onClick={handleBackdropClose}
                />
              )}
              {/* Sidebar overlay */}
              <div className={`mobile-sidebar-overlay${mobileSidebarOpen ? ' open' : ''}`}>
                <div style={{ padding: 'var(--spacing-md)', height: '100%', overflow: 'auto' }}>
                  {sidebarContent}
                </div>
              </div>
              {/* Main content */}
              <main
                style={{
                  flex: 1,
                  overflow: 'auto',
                  background: 'var(--color-bg-secondary)',
                }}
              >
                {children}
              </main>
              {/* AI panel overlay */}
              <div className={`mobile-ai-overlay${mobileAiOpen ? ' open' : ''}`}>
                <div style={{ height: '100%', overflow: 'auto' }}>
                  {aiPanelContent}
                </div>
              </div>
            </>
          ) : (
            <>
              <SidePanel collapsed={sidebarCollapsed}>
                {sidebarContent}
              </SidePanel>
              <main
                style={{
                  flex: 1,
                  overflow: 'auto',
                  background: 'var(--color-bg-secondary)',
                }}
              >
                {children}
              </main>
              <AIPanel collapsed={aiPanelCollapsed}>
                {aiPanelCollapsed ? null : aiPanelContent}
              </AIPanel>
            </>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}