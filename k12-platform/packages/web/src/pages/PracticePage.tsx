import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tag } from '@/components/ui/Tag';
import {
  getKnowledgePoint,
  checkAnswers,
  recordStudy,
  type KnowledgePointDetail,
  type QuestionItem,
  type AnswerResultItem,
} from '@/api/courses';

type QuestionType = 'choice' | 'fill_blank' | 'true_false' | 'short_answer';

interface OptionItem {
  key: string;
  label: string;
}

export default function PracticePage() {
  const { knowledgePointId } = useParams<{ knowledgePointId: string }>();
  const navigate = useNavigate();

  // Data
  const [detail, setDetail] = useState<KnowledgePointDetail | null>(null);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Practice state
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<AnswerResultItem[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load detail when knowledgePointId changes
  useEffect(() => {
    if (!knowledgePointId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setScore(null);
    setTotal(null);

    async function load() {
      try {
        const data = await getKnowledgePoint(knowledgePointId!);
        if (cancelled) return;
        setDetail(data);
      } catch (e) {
        if (cancelled) return;
        setError('加载练习题失败，请检查网络连接后重试');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [knowledgePointId]);

  // Handle answer
  function handleAnswer(questionId: number, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  // Submit answers
  async function handleSubmit() {
    if (!detail) return;
    const questions = detail.questions;
    const answerList = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] || '',
    }));

    setSubmitting(true);
    try {
      const result = await checkAnswers({ answers: answerList });
      setResults(result.results);
      setScore(result.score);
      setTotal(result.total);
      setSubmitted(true);

      // Record study progress
      if (knowledgePointId) {
        try {
          await recordStudy({
            knowledgePointId,
            status: result.score >= 60 ? 'completed' : 'learning',
            score: result.score,
          });
        } catch {
          // Silently fail
        }
      }
    } catch {
      // Error handling
    } finally {
      setSubmitting(false);
    }
  }

  // Reset
  function handleReset() {
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setScore(null);
    setTotal(null);
  }

  // Parse options JSON
  function parseOptions(optionsStr: string | null): OptionItem[] {
    if (!optionsStr) return [];
    try {
      return JSON.parse(optionsStr) as OptionItem[];
    } catch {
      return [];
    }
  }

  // Render a single question
  function renderQuestion(q: QuestionItem, idx: number) {
    const result = results?.find((r) => r.questionId === q.id);
    const isCorrect = result?.correct;
    const userAnswer = answers[q.id] || '';

    return (
      <Card
        key={q.id}
        style={{
          borderColor: submitted
            ? isCorrect
              ? 'var(--color-success)'
              : 'var(--color-error)'
            : undefined,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {/* Question header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
                flexShrink: 0,
              }}
            >
              {idx + 1}.
            </span>
            <span style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
              {q.content}
            </span>
            {q.type && (
              <Tag color="accent">
                {q.type === 'choice'
                  ? '选择题'
                  : q.type === 'fill_blank'
                    ? '填空题'
                    : q.type === 'true_false'
                      ? '判断题'
                      : '简答题'}
              </Tag>
            )}
          </div>

          {/* Answer area */}
          {renderAnswerArea(q, userAnswer, result)}

          {/* Result feedback */}
          {submitted && result && (
            <div
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-sm)',
                background: isCorrect
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: isCorrect
                    ? 'var(--color-success)'
                    : 'var(--color-error)',
                  marginBottom: 'var(--spacing-xs)',
                }}
              >
                {isCorrect ? '✓ 回答正确' : '✗ 回答错误'}
              </div>
              {!isCorrect && (
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  正确答案：{result.correctAnswer}
                </div>
              )}
              {result.explanation && (
                <div
                  style={{
                    color: 'var(--color-text-secondary)',
                    marginTop: 'var(--spacing-xs)',
                  }}
                >
                  解析：{result.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  function renderAnswerArea(
    q: QuestionItem,
    userAnswer: string,
    result: AnswerResultItem | undefined,
  ) {
    const qType = q.type as QuestionType;
    const options = parseOptions(q.options);

    switch (qType) {
      case 'choice':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {options.map((opt) => {
              const isSelected = userAnswer === opt.key;
              let bgColor = 'var(--color-bg-primary)';
              let borderColor = 'var(--color-border)';

              if (submitted && result) {
                if (opt.key === result.correctAnswer) {
                  bgColor = 'rgba(34, 197, 94, 0.1)';
                  borderColor = 'var(--color-success)';
                } else if (isSelected && !result.correct) {
                  bgColor = 'rgba(239, 68, 68, 0.1)';
                  borderColor = 'var(--color-error)';
                }
              } else if (isSelected && !submitted) {
                bgColor = 'var(--color-accent-light)';
                borderColor = 'var(--color-accent)';
              }

              return (
                <button
                  key={opt.key}
                  disabled={submitted}
                  onClick={() => handleAnswer(q.id, opt.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 'var(--radius-md)',
                    background: bgColor,
                    cursor: submitted ? 'default' : 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    textAlign: 'left',
                    color: 'var(--color-text-primary)',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: `2px solid ${isSelected && !submitted ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      flexShrink: 0,
                      background: isSelected && !submitted ? 'var(--color-accent)' : 'transparent',
                      color: isSelected && !submitted ? '#fff' : 'transparent',
                    }}
                  >
                    {opt.key.toUpperCase()}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        );

      case 'fill_blank':
        return (
          <Input
            placeholder="请输入答案"
            value={userAnswer}
            disabled={submitted}
            onChange={(e) => handleAnswer(q.id, e.target.value)}
            style={{ maxWidth: 400 }}
          />
        );

      case 'true_false':
        return (
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            {['正确', '错误'].map((label) => {
              const value = label === '正确' ? 'true' : 'false';
              const isSelected = userAnswer === value;
              return (
                <Button
                  key={value}
                  variant={isSelected && !submitted ? 'primary' : 'secondary'}
                  size="sm"
                  disabled={submitted}
                  onClick={() => handleAnswer(q.id, value)}
                  style={{
                    minWidth: 80,
                    ...(submitted && result
                      ? value === result.correctAnswer
                        ? { background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--color-success)', color: 'var(--color-success)' }
                        : isSelected && !result.correct
                          ? { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)' }
                          : {}
                      : {}),
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        );

      case 'short_answer':
        return (
          <textarea
            placeholder="请输入你的答案..."
            value={userAnswer}
            disabled={submitted}
            onChange={(e) => handleAnswer(q.id, e.target.value)}
            style={{
              width: '100%',
              minHeight: 80,
              padding: 'var(--spacing-sm) var(--spacing-md)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        );

      default:
        return (
          <Input
            placeholder="请输入答案"
            value={userAnswer}
            disabled={submitted}
            onChange={(e) => handleAnswer(q.id, e.target.value)}
          />
        );
    }
  }

  // No knowledgePointId: show placeholder
  if (!knowledgePointId) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: 960, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          练习中心
        </h1>
        <Card>
          <EmptyState
            title="请从学习中心选择知识点进行练习"
            description="选择一个知识点后，即可开始做练习题"
            action={
              <Button variant="primary" onClick={() => navigate('/study')}>
                前往学习中心
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: 960, margin: '0 auto' }}>
        <LoadingSpinner text="正在加载练习题..." />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: 960, margin: '0 auto' }}>
        <EmptyState
          title="加载失败"
          description={error || '知识点不存在'}
          action={
            <Button variant="secondary" onClick={() => navigate('/study')}>
              返回学习中心
            </Button>
          }
        />
      </div>
    );
  }

  const questions = detail.questions || [];

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: 960, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-tertiary)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <span
          style={{ cursor: 'pointer', color: 'var(--color-accent)' }}
          onClick={() => navigate('/study')}
        >
          学习中心
        </span>
        <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
        <span
          style={{ cursor: 'pointer', color: 'var(--color-accent)' }}
          onClick={() => navigate(`/study/${knowledgePointId}`)}
        >
          {detail.title}
        </span>
        <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
        <span>练习</span>
      </div>

      <h1
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 700,
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        {detail.title}
      </h1>

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        <Tag color="accent">{detail.subjectName}</Tag>
        <Tag>{detail.chapterTitle}</Tag>
        <Tag>共 {questions.length} 题</Tag>
      </div>

      {questions.length === 0 ? (
        <Card>
          <EmptyState
            title="暂无练习题"
            description="该知识点暂无练习题"
            action={
              <Button variant="secondary" onClick={() => navigate(`/study/${knowledgePointId}`)}>
                返回学习
              </Button>
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* Questions */}
          {questions.map((q, idx) => renderQuestion(q, idx))}

          {/* Submit / Result */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {!submitted ? (
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <Button
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={submitting}
                  >
                    提交答案
                  </Button>
                  <Button variant="ghost" onClick={() => navigate(`/study/${knowledgePointId}`)}>
                    返回学习
                  </Button>
                </div>
              ) : (
                <div>
                  {/* Score */}
                  {score !== null && total !== null && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-md) 0',
                        marginBottom: 'var(--spacing-md)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--font-size-3xl)',
                          fontWeight: 700,
                          color:
                            score >= 80
                              ? 'var(--color-success)'
                              : score >= 60
                                ? 'var(--color-warning)'
                                : 'var(--color-error)',
                        }}
                      >
                        {score} 分
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-secondary)',
                          marginTop: 'var(--spacing-xs)',
                        }}
                      >
                        正确率 {Math.round((score / 100) * total)}/{total}
                      </div>
                    </div>
                  )}

                  {/* Encouragement */}
                  {score !== null && score >= 60 && (
                    <div
                      style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-success)',
                        fontWeight: 600,
                        textAlign: 'center',
                        fontSize: 'var(--font-size-md)',
                        marginBottom: 'var(--spacing-md)',
                      }}
                    >
                      🎉 太棒了！你已经掌握了这个知识点！
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <Button variant="secondary" onClick={handleReset}>
                      再练一次
                    </Button>
                    <Button variant="ghost" onClick={() => navigate(`/study/${knowledgePointId}`)}>
                      返回学习
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}