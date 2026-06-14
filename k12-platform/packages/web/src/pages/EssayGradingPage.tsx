import { useState } from 'react';
import { gradeEssay, type EssayGradingResult } from '@/api/ai';

const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

const DIMENSION_KEYS = ['themeScore', 'structureScore', 'languageScore', 'contentScore'] as const;

const DIMENSION_LABELS: Record<string, string> = {
  themeScore: '立意',
  structureScore: '结构',
  languageScore: '语言',
  contentScore: '内容',
};

const DIMENSION_MAX: Record<string, number> = {
  themeScore: 25,
  structureScore: 25,
  languageScore: 25,
  contentScore: 25,
};

export default function EssayGradingPage() {
  const [essay, setEssay] = useState('');
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EssayGradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!essay.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await gradeEssay(
        essay.trim(),
        grade,
        requirements.trim() || undefined,
      );
      setResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '批改请求失败，请稍后重试';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderScoreBar = (key: keyof EssayGradingResult, score: number) => {
    const max = DIMENSION_MAX[key] || 25;
    const pct = Math.min((score / max) * 100, 100);
    const color =
      pct >= 80 ? 'var(--color-success)' : pct >= 60 ? 'var(--color-warning)' : 'var(--color-error)';

    return (
      <div
        key={key}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        <span
          style={{
            width: 60,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            flexShrink: 0,
          }}
        >
          {DIMENSION_LABELS[key]}
        </span>
        <div
          style={{
            flex: 1,
            height: 10,
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: color,
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.6s ease',
            }}
          />
        </div>
        <span
          style={{
            width: 50,
            textAlign: 'right',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            flexShrink: 0,
          }}
        >
          {score}/{max}
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: 'var(--spacing-lg)',
        maxWidth: 900,
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        作文批改
      </h1>

      {/* 输入区域 */}
      <div
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            作文内容 *
          </label>
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="请在此粘贴或输入学生作文..."
            disabled={loading}
            style={{
              width: '100%',
              minHeight: 500,
              padding: 'var(--spacing-md)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-md)',
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg-primary)',
              resize: 'vertical',
              lineHeight: 1.8,
              boxSizing: 'border-box',
              outline: 'none',
            }}
            onFocus={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor = 'var(--color-accent)';
            }}
            onBlur={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor = 'var(--color-border)';
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              年级（可选）
            </label>
            <select
              value={grade ?? ''}
              onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : undefined)}
              disabled={loading}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
                background: 'var(--color-bg-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="">不选择</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g} 年级
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 2 }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              批改要求（可选）
            </label>
            <input
              type="text"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="例如：请重点关注文章结构和语言表达"
              disabled={loading}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
                background: 'var(--color-bg-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !essay.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-sm)',
            width: '100%',
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            background:
              loading || !essay.trim()
                ? 'var(--color-bg-tertiary)'
                : 'var(--color-accent)',
            color: loading || !essay.trim() ? 'var(--color-text-tertiary)' : '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-md)',
            fontWeight: 600,
            cursor: loading || !essay.trim() ? 'not-allowed' : 'pointer',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            if (!loading && essay.trim()) {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && essay.trim()) {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent)';
            }
          }}
        >
          {loading ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: 18,
                  height: 18,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
              正在批改中...
            </>
          ) : (
            '提交批改'
          )}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          style={{
            padding: 'var(--spacing-md)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && !result && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-2xl)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 40,
              height: 40,
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-accent)',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              marginBottom: 'var(--spacing-md)',
            }}
          />
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            AI 正在批改作文，请稍候...
          </span>
        </div>
      )}

      {/* 批改结果 */}
      {result && (
        <div
          style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
          }}
        >
          {/* 总分 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
              background: 'var(--color-accent-light)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 800,
                  color: 'var(--color-accent)',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {result.overallScore}
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-tertiary)',
                  marginTop: 'var(--spacing-xs)',
                  display: 'block',
                }}
              >
                / 100 分
              </span>
            </div>
          </div>

          {/* 分项评分 */}
          <div
            style={{
              marginBottom: 'var(--spacing-lg)',
              padding: 'var(--spacing-md)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              分项评分
            </h3>
            {(DIMENSION_KEYS).map((key) =>
              renderScoreBar(key, result[key] as number),
            )}
          </div>

          {/* 详细评语 */}
          {result.comments && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h3
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-sm)',
                }}
              >
                总体评语
              </h3>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}
              >
                {result.comments}
              </p>
            </div>
          )}

          {/* 改进建议 */}
          {result.suggestions && (
            <div>
              <h3
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-sm)',
                }}
              >
                改进建议
              </h3>
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '3px solid var(--color-accent)',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                  }}
                >
                  {result.suggestions}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 空状态 */}
      {!loading && !result && !error && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-2xl)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: 'var(--spacing-md)', opacity: 0.4 }}
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>
            请输入作文内容，点击「提交批改」获取 AI 评改结果
          </p>
        </div>
      )}
    </div>
  );
}