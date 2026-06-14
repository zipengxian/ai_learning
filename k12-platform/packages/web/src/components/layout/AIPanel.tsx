import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react';

interface AIPanelProps {
  collapsed: boolean;
  children: ReactNode;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 360;

export function AIPanel({ collapsed, children }: AIPanelProps) {
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const container = panelRef.current?.parentElement;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (collapsed) {
    return (
      <div
        style={{
          position: 'relative',
          width: 0,
          flexShrink: 0,
          transition: 'width var(--transition-normal)',
          overflow: 'hidden',
        }}
      >
        {/* Collapsed toggle button */}
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: 'var(--spacing-md)',
            zIndex: 10,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'relative',
        width: panelWidth,
        minWidth: panelWidth,
        height: '100%',
        background: 'var(--color-bg-ai-panel)',
        borderLeft: '1px solid var(--color-border)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          cursor: 'col-resize',
          zIndex: 10,
          transition: 'background var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          if (!isDragging.current) {
            (e.currentTarget as HTMLDivElement).style.background = 'transparent';
          }
        }}
      />
      {children}
    </div>
  );
}