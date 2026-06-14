import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Subject } from '@k12/shared';
import * as authApi from '@/api/auth';

const GRADE_LABELS: Record<number, string> = {
  1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级',
  5: '五年级', 6: '六年级', 7: '七年级', 8: '八年级',
  9: '九年级', 10: '高一', 11: '高二', 12: '高三',
};

const GRADE_LIST = Array.from({ length: 12 }, (_, i) => i + 1);

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

interface PreferenceSetupProps {
  initialGrade?: number;
  initialSubjects?: Subject[];
  onComplete?: () => void;
  showSkip?: boolean;
  onSkip?: () => void;
}

export function PreferenceSetup({
  initialGrade,
  initialSubjects = [],
  onComplete,
  showSkip = false,
  onSkip,
}: PreferenceSetupProps) {
  const [grade, setGrade] = useState<number>(initialGrade || 0);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSubject = (subject: Subject) => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      await authApi.updateProfile({ grade, subjects });
      onComplete?.();
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || '保存失败，请稍后重试');
      } else {
        setError('保存失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg-secondary)',
        padding: 'var(--spacing-md)',
      }}
    >
      <Card style={{ width: '100%', maxWidth: 560, padding: 'var(--spacing-2xl)' }}>
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-xl)',
              background: 'var(--color-accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              margin: '0 auto var(--spacing-md)',
            }}
          >
            🎯
          </div>
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            设置学习偏好
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            告诉我们你的年级和感兴趣的学科，为你推荐最合适的学习内容
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              background: '#fef2f2',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid #fecaca',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            {error}
          </div>
        )}

        {/* 年级选择 */}
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <label
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-md)',
              display: 'block',
            }}
          >
            你的年级
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 'var(--spacing-sm)',
            }}
          >
            {GRADE_LIST.map((g) => {
              const isSelected = grade === g;
              return (
                <div
                  key={g}
                  onClick={() => setGrade(g)}
                  style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-sm) var(--spacing-xs)',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: isSelected ? 'var(--color-accent-light)' : 'var(--color-bg-primary)',
                    color: isSelected ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    userSelect: 'none',
                  }}
                >
                  {GRADE_LABELS[g]}
                </div>
              );
            })}
          </div>
        </div>

        {/* 学科多选 */}
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <label
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-md)',
              display: 'block',
            }}
          >
            偏好学科（可多选）
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'var(--spacing-sm)',
            }}
          >
            {SUBJECT_OPTIONS.map((subject) => {
              const isSelected = subjects.includes(subject.value);
              return (
                <div
                  key={subject.value}
                  onClick={() => toggleSubject(subject.value)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    padding: 'var(--spacing-md) var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: isSelected ? 'var(--color-accent-light)' : 'var(--color-bg-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{subject.icon}</span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-sm)',
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

        {/* 按钮区 */}
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          {showSkip && (
            <Button variant="secondary" onClick={onSkip} style={{ flex: 1 }}>
              稍后设置
            </Button>
          )}
          <Button
            variant="primary"
            loading={loading}
            onClick={handleSave}
            style={{ flex: 1 }}
          >
            {loading ? '保存中...' : '开始学习'}
          </Button>
        </div>
      </Card>
    </div>
  );
}