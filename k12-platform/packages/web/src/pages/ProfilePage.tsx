import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>
        个人中心
      </h1>

      <Card>
        <div style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--color-accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xl)',
                color: 'var(--color-accent)',
                fontWeight: 700,
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                {user?.name || '用户名'}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                {user?.role || '学生'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>ID</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{user?.id || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>年级</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                {user?.grade ? `${user.grade}年级` : '-'}
              </span>
            </div>
          </div>

          <Button variant="danger" onClick={handleLogout} style={{ width: '100%' }}>
            退出登录
          </Button>
        </div>
      </Card>
    </div>
  );
}