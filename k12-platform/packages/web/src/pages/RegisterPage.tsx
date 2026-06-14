import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import * as authApi from '@/api/auth';
import { Subject } from '@k12/shared';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEPS = ['基本信息', '学习偏好'];

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const GRADE_LABELS: Record<number, string> = {
  1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级',
  5: '五年级', 6: '六年级', 7: '七年级', 8: '八年级',
  9: '九年级', 10: '高一', 11: '高二', 12: '高三',
};

interface SubjectOption {
  value: Subject;
  label: string;
  icon: string;
}

const SUBJECT_OPTIONS: SubjectOption[] = [
  { value: Subject.CHINESE, label: '语文', icon: '📖' },
  { value: Subject.MATH, label: '数学', icon: '🔢' },
  { value: Subject.ENGLISH, label: '英语', icon: '🌍' },
  { value: Subject.PHYSICS, label: '物理', icon: '⚛️' },
  { value: Subject.CHEMISTRY, label: '化学', icon: '🧪' },
  { value: Subject.BIOLOGY, label: '生物', icon: '🧬' },
  { value: Subject.HISTORY, label: '历史', icon: '📜' },
  { value: Subject.GEOGRAPHY, label: '地理', icon: '🌏' },
];

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message || '注册失败，请稍后重试';
  }
  if (err instanceof Error) return err.message;
  return '注册失败，请稍后重试';
}

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [grade, setGrade] = useState<number>(0);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  const registerAction = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  // 注册成功后跳转
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/preferences', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) {
      newErrors.name = '请输入姓名';
    }
    if (!email.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = '邮箱格式不正确';
    }
    if (phone && !/^1\d{10}$/.test(phone)) {
      newErrors.phone = '手机号格式不正确';
    }
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码至少需要6位';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(1);
    }
  };

  const handlePrev = () => {
    setStep(0);
  };

  const toggleSubject = (subject: Subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateStep1()) {
      setStep(0);
      return;
    }

    try {
      await registerAction({
        name: name.trim(),
        email: email.trim(),
        password,
        grade: grade || undefined,
      });

      // 保存偏好学科到后端
      if (selectedSubjects.length > 0) {
        try {
          await authApi.updateProfile({ subjects: selectedSubjects });
        } catch {
          // 偏好设置失败不阻止跳转
        }
      }
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
          background: 'linear-gradient(135deg, #818cf8 0%, var(--color-accent) 100%)',
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
            加入我们，开启你的个性化学习体验
          </p>
        </div>
      </div>

      {/* 右侧注册表单 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-md)',
        }}
      >
        <Card style={{ width: '100%', maxWidth: 460, padding: 'var(--spacing-2xl)' }}>
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              marginBottom: 'var(--spacing-xs)',
              color: 'var(--color-text-primary)',
            }}
          >
            创建新账号
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-tertiary)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            开始你的个性化学习之旅
          </p>

          {/* 步骤进度条 */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-xl)',
            }}
          >
            {STEPS.map((label, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: index <= step ? 'var(--color-accent)' : 'var(--color-border)',
                    marginBottom: 'var(--spacing-sm)',
                    transition: 'background var(--transition-normal)',
                  }}
                />
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: index <= step ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                    fontWeight: index <= step ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {/* 服务端错误 */}
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

            {/* Step 1: 基本信息 */}
            {step === 0 && (
              <>
                <Input
                  label="姓名"
                  type="text"
                  placeholder="请输入姓名"
                  value={name}
                  error={errors.name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((prev) => ({ ...prev, name: undefined })); }}
                />

                <Input
                  label="邮箱"
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  error={errors.email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((prev) => ({ ...prev, email: undefined })); }}
                />

                <Input
                  label="手机号（选填）"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  error={errors.phone}
                  onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined })); }}
                />

                <Input
                  label="密码"
                  type="password"
                  placeholder="请设置密码（至少6位）"
                  value={password}
                  error={errors.password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((prev) => ({ ...prev, password: undefined })); }}
                />

                <Input
                  label="确认密码"
                  type="password"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  error={errors.confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined })); }}
                />

                <Button type="button" variant="primary" style={{ width: '100%', marginTop: 'var(--spacing-sm)' }} onClick={handleNext}>
                  下一步
                </Button>
              </>
            )}

            {/* Step 2: 学习偏好 */}
            {step === 1 && (
              <>
                {/* 年级选择 */}
                <div>
                  <label
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--spacing-xs)',
                      display: 'block',
                    }}
                  >
                    年级（选填）
                  </label>
                  <select
                    value={grade || ''}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: 36,
                      padding: '0 var(--spacing-md)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-primary)',
                      background: 'var(--color-bg-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="">请选择年级</option>
                    {Object.entries(GRADE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* 学科多选 */}
                <div>
                  <label
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--spacing-sm)',
                      display: 'block',
                    }}
                  >
                    偏好学科（选填，可多选）
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 'var(--spacing-sm)',
                    }}
                  >
                    {SUBJECT_OPTIONS.map((subject) => {
                      const isSelected = selectedSubjects.includes(subject.value);
                      return (
                        <div
                          key={subject.value}
                          onClick={() => toggleSubject(subject.value)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            padding: 'var(--spacing-md) var(--spacing-sm)',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                            background: isSelected ? 'var(--color-accent-light)' : 'var(--color-bg-primary)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            userSelect: 'none',
                          }}
                        >
                          <span style={{ fontSize: 20 }}>{subject.icon}</span>
                          <span
                            style={{
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: isSelected ? 600 : 400,
                              color: isSelected ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            }}
                          >
                            {subject.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 跳过提示 */}
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-tertiary)',
                    textAlign: 'center',
                    margin: 0,
                  }}
                >
                  可跳过此步，后续可在个人设置中补充
                </p>

                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                  <Button type="button" variant="secondary" onClick={handlePrev} style={{ flex: 1 }}>
                    上一步
                  </Button>
                  <Button type="submit" variant="primary" loading={isLoading} style={{ flex: 1 }}>
                    {isLoading ? '注册中...' : '注册'}
                  </Button>
                </div>
              </>
            )}

            <p
              style={{
                textAlign: 'center',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-tertiary)',
                marginTop: 'var(--spacing-sm)',
              }}
            >
              已有账号？{' '}
              <Link
                to="/login"
                style={{
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                立即登录
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}