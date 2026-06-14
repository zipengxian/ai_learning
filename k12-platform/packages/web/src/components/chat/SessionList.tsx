import type { ChatSession } from '@/api/ai';

interface SessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  loading?: boolean;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  loading = false,
}: SessionListProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'var(--spacing-md)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={onNewChat}
          style={{
            width: '100%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-border)',
            background: 'transparent',
            color: 'var(--color-accent)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-light)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新对话
        </button>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
            <span
              style={{
                display: 'inline-block',
                width: 20,
                height: 20,
                border: '2px solid var(--color-border)',
                borderTopColor: 'var(--color-accent)',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          </div>
        ) : sessions.length === 0 ? (
          <div
            style={{
              padding: 'var(--spacing-xl) var(--spacing-md)',
              textAlign: 'center',
              color: 'var(--color-text-tertiary)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            暂无对话记录
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  cursor: 'pointer',
                  background: isActive ? 'var(--color-accent-light)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-xs)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {session.title}
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  {session.messageCount} 条消息
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}