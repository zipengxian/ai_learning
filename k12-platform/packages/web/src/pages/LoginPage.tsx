import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  email?: string;
  password?: string;
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message || '登录失败，请检查邮箱和密码';
  }
  if (err instanceof Error) return err.message;
  return '登录失败，请检查邮箱和密码';
}

export default function LoginPage() {
  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedEmail'));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  const loginAction = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from || '/';

  // 当登录成功后判断跳转
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!user.grade || !user.subjects || user.subjects.length === 0) {
        navigate('/preferences', { state: { from }, replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, from, navigate]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!email.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = '邮箱格式不正确';
    }
    if (!password) {
      newErrors.password = '请输入密码';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    try {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      await loginAction(email, password);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--color-bg-secondary)',
      }}
    >
      {/* 左侧品牌区域 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--color-accent) 0%, #818cf8 100%)',
          color: '#fff',
          padding: 'var(--spacing-2xl)',
        }}
      >
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 'var(--radius-xl)',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              margin: '0 auto var(--spacing-lg)',
            }}
          >
            📚
          </div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              marginBottom: 'var(--spacing-md)',
              lineHeight: 1.3,
            }}
          >
            K12 学习平台
          </h1>
          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              opacity: 0.9,
              lineHeight: 1.6,
            }}
          >
            开启学习之旅
          </p>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              opacity: 0.7,
              marginTop: 'var(--spacing-md)',
              lineHeight: 1.6,
            }}
          >
            智能学习助手，助力每一位学生高效成长
          </p>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-md)',
        }}
      >
        <Card style={{ width: '100%', maxWidth: 420, padding: 'var(--spacing-2xl)' }}>
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              marginBottom: 'var(--spacing-xs)',
              color: 'var(--color-text-primary)',
            }}
          >
            欢迎回来
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-tertiary)',
              marginBottom: 'var(--spacing-xl)',
            }}
          >
            登录你的账号继续学习
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {/* 服务端错误提示 */}
            {serverError && (
              <div
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: '#fef2f2',
                  color: 'var(--color-error)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  border: '1px solid #fecaca',
                }}
              >
                {serverError}
              </div>
            )}

            <Input
              label="邮箱"
              type="email"
              placeholder="请输入邮箱"
              value={email}
              error={errors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />

            <Input
              label="密码"
              type="password"
              placeholder="请输入密码"
              value={password}
              error={errors.password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />

            {/* 记住我 */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: 'var(--color-accent)',
                  width: 16,
                  height: 16,
                }}
              />
              记住我
            </label>

            <Button type="submit" variant="primary" loading={isLoading} style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}>
              {isLoading ? '登录中...' : '登录'}
            </Button>

            <p
              style={{
                textAlign: 'center',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-tertiary)',
                marginTop: 'var(--spacing-sm)',
              }}
            >
              还没有账号？{' '}
              <Link
                to="/register"
                style={{
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                立即注册
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}