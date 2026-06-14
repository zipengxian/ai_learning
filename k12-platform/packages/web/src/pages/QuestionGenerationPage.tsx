import { useState, useCallback } from 'react';
import apiClient from '@/api/client';
import { generateQuestions, type GeneratedQuestion } from '@/api/ai';

interface KnowledgePointOption {
  id: number;
  title: string;
  chapterTitle?: string;
}

const QUESTION_TYPES: { value: string; label: string }[] = [
  { value: 'choice', label: '选择题' },
  { value: 'fill', label: '填空题' },
  { value: 'judge', label: '判断题' },
  { value: 'essay', label: '问答题' },
];

const TYPE_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  choice: { bg: 'rgba(99, 102, 241, 0.1)', text: 'var(--color-accent)' },
  fill: { bg: 'rgba(34, 197, 94, 0.1)', text: 'var(--color-success)' },
  judge: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--color-warning)' },
  essay: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--color-error)' },
};

const TYPE_LABELS: Record<string, string> = {
  choice: '选择题',
  fill: '填空题',
  judge: '判断题',
  essay: '问答题',
};

export default function QuestionGenerationPage() {
  // 知识点搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [kpOptions, setKpOptions] = useState<KnowledgePointOption[]>([]);
  const [kpSearching, setKpSearching] = useState(false);
  const [selectedKp, setSelectedKp] = useState<KnowledgePointOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // 题目参数
  const [questionType, setQuestionType] = useState('');
  const [count, setCount] = useState(3);

  // 结果状态
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 答案显示状态
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());

  // 知识点搜索（防抖）
  const searchKnowledgePoints = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setKpOptions([]);
      setShowDropdown(false);
      return;
    }

    setKpSearching(true);
    try {
      const response = await apiClient.get<{ results: Array<{ type: string; id: number; title: string; chapterTitle?: string }> }>(
        '/search',
        { params: { q: keyword } },
      );
      const results = response.data.results || [];
      const kps: KnowledgePointOption[] = results
        .filter((r) => r.type === 'knowledgePoint')
        .map((r) => ({
          id: r.id,
          title: r.title,
          chapterTitle: r.chapterTitle,
        }));
      setKpOptions(kps.slice(0, 8));
      setShowDropdown(kps.length > 0);
    } catch {
      setKpOptions([]);
    } finally {
      setKpSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchKeyword(value);
    setSelectedKp(null);
    searchKnowledgePoints(value);
  };

  const handleSelectKp = (kp: KnowledgePointOption) => {
    setSelectedKp(kp);
    setSearchKeyword(kp.title);
    setShowDropdown(false);
  };

  // 生成题目
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setRevealedAnswers(new Set());

    try {
      const data = await generateQuestions({
        knowledgePointId: selectedKp?.id,
        questionType: questionType || undefined,
        count,
      });
      setQuestions(data.questions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '生成题目失败，请稍后重试';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 切换答案显示
  const toggleAnswer = (index: number) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // 复制题目
  const copyQuestion = (q: GeneratedQuestion) => {
    let text = `【${TYPE_LABELS[q.type] || q.type}】${q.content}\n`;
    if (q.options && q.options.length > 0) {
      text += q.options.join('\n') + '\n';
    }
    text += `\n答案：${q.answer}`;
    if (q.explanation) {
      text += `\n解析：${q.explanation}`;
    }
    navigator.clipboard.writeText(text).catch(() => {});
  };

  // 导出全部题目
  const exportAll = () => {
    let text = '';
    questions.forEach((q, i) => {
      text += `${i + 1}. 【${TYPE_LABELS[q.type] || q.type}】${q.content}\n`;
      if (q.options && q.options.length > 0) {
        text += q.options.join('\n') + '\n';
      }
      text += `答案：${q.answer}\n`;
      if (q.explanation) {
        text += `解析：${q.explanation}\n`;
      }
      text += '\n';
    });
    navigator.clipboard.writeText(text).catch(() => {});
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
        智能出题
      </h1>

      {/* 配置区域 */}
      <div
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        {/* 知识点选择 */}
        <div style={{ marginBottom: 'var(--spacing-md)', position: 'relative' }}>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            知识点（可选）
          </label>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (kpOptions.length > 0) setShowDropdown(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowDropdown(false), 200);
            }}
            placeholder="搜索并选择知识点..."
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
          {kpSearching && (
            <span
              style={{
                position: 'absolute',
                right: 12,
                top: 34,
                width: 16,
                height: 16,
                border: '2px solid var(--color-border)',
                borderTopColor: 'var(--color-accent)',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
                display: 'inline-block',
              }}
            />
          )}
          {showDropdown && kpOptions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 10,
                maxHeight: 240,
                overflow: 'auto',
                marginTop: 4,
              }}
            >
              <div
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-accent)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                onMouseDown={() => {
                  setSelectedKp(null);
                  setSearchKeyword('');
                  setShowDropdown(false);
                }}
              >
                不限知识点
              </div>
              {kpOptions.map((kp) => (
                <div
                  key={kp.id}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                  onMouseDown={() => handleSelectKp(kp)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }}
                >
                  <div>{kp.title}</div>
                  {kp.chapterTitle && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                      {kp.chapterTitle}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 题型和数量 */}
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
              题目类型
            </label>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
              <button
                onClick={() => setQuestionType('')}
                disabled={loading}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  border: `1px solid ${questionType === '' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  background: questionType === '' ? 'var(--color-accent-light)' : 'var(--color-bg-primary)',
                  color: questionType === '' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                不限
              </button>
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setQuestionType(t.value)}
                  disabled={loading}
                  style={{
                    padding: 'var(--spacing-xs) var(--spacing-md)',
                    border: `1px solid ${questionType === t.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 500,
                    background: questionType === t.value ? 'var(--color-accent-light)' : 'var(--color-bg-primary)',
                    color: questionType === t.value ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: 140, flexShrink: 0 }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              题目数量
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
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
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} 道
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-sm)',
            width: '100%',
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            background: loading ? 'var(--color-bg-tertiary)' : 'var(--color-accent)',
            color: loading ? 'var(--color-text-tertiary)' : '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-md)',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
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
              正在生成题目...
            </>
          ) : (
            '生成题目'
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
      {loading && (
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
            AI 正在生成题目，请稍候...
          </span>
        </div>
      )}

      {/* 结果列表 */}
      {questions.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              生成结果（{questions.length} 道题）
            </h2>
            <button
              onClick={exportAll}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              导出全部
            </button>
          </div>

          {questions.map((q, index) => {
            const colors = TYPE_BADGE_COLORS[q.type] || TYPE_BADGE_COLORS.choice;
            const isRevealed = revealedAnswers.has(index);

            return (
              <div
                key={index}
                style={{
                  background: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                {/* 题目头部 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px var(--spacing-sm)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        background: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {TYPE_LABELS[q.type] || q.type}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      第 {index + 1} 题
                    </span>
                  </div>
                  <button
                    onClick={() => copyQuestion(q)}
                    title="复制题目"
                    style={{
                      padding: 'var(--spacing-xs)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-text-tertiary)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    复制
                  </button>
                </div>

                {/* 题目内容 */}
                <div
                  style={{
                    fontSize: 'var(--font-size-md)',
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.8,
                    marginBottom: 'var(--spacing-md)',
                    fontWeight: 500,
                  }}
                >
                  {q.content}
                </div>

                {/* 选择题选项 */}
                {q.options && q.options.length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        style={{
                          padding: 'var(--spacing-xs) var(--spacing-md)',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.8,
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}

                {/* 答案区域 */}
                <div
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 'var(--spacing-sm)',
                  }}
                >
                  <button
                    onClick={() => toggleAnswer(index)}
                    style={{
                      padding: 'var(--spacing-xs) var(--spacing-md)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 500,
                      background: isRevealed ? 'var(--color-accent-light)' : 'var(--color-bg-primary)',
                      color: isRevealed ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      marginBottom: isRevealed ? 'var(--spacing-sm)' : 0,
                    }}
                  >
                    {isRevealed ? '隐藏答案' : '显示答案'}
                  </button>

                  {isRevealed && (
                    <div
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          marginBottom: q.explanation ? 'var(--spacing-sm)' : 0,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          答案：
                        </span>
                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                          {q.answer}
                        </span>
                      </div>
                      {q.explanation && (
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                          <span style={{ fontWeight: 600 }}>解析：</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {!loading && questions.length === 0 && !error && (
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
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>
            配置题目参数，点击「生成题目」让 AI 为您智能出题
          </p>
        </div>
      )}
    </div>
  );
}