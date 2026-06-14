import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Tabs } from '@/components/ui/Tabs';
import {
  getWrongAnswers,
  deleteWrongAnswer,
  type WrongAnswerItem,
  type WrongAnswersResponse,
} from '@/api/study';
import { getSubjects, type SubjectItem } from '@/api/courses';

const PAGE_LIMIT = 10;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseOptions(optionsStr: string | null): string[] {
  if (!optionsStr) return [];
  try {
    const parsed = JSON.parse(optionsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function WrongBookPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('all');
  const [data, setData] = useState<WrongAnswersResponse | null>(null);
  const [items, setItems] = useState<WrongAnswerItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const fetchSubjects = useCallback(async () => {
    try {
      const list = await getSubjects();
      setSubjects(list);
    } catch {
      // subjects are optional, non-fatal
    }
  }, []);

  const fetchData = useCallback(async (p: number, subjectId: string) => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; subjectId?: string } = {
        page: p,
        limit: PAGE_LIMIT,
      };
      if (subjectId !== 'all') {
        params.subjectId = subjectId;
      }
      const result = await getWrongAnswers(params);
      setData(result);
      setItems(result.list);
    } catch {
      setData(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    setPage(1);
    fetchData(1, activeSubjectId);
  }, [activeSubjectId, fetchData]);

  useEffect(() => {
    if (page !== 1) {
      fetchData(page, activeSubjectId);
    }
  }, [page, activeSubjectId, fetchData]);

  const handleSubjectChange = (key: string) => {
    setActiveSubjectId(key);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDelete = async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteWrongAnswer(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setData((prev) => (prev ? { ...prev, total: prev.total - 1 } : null));
    } catch {
      // silently fail
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const uniqueSubjects = data
    ? new Set(items.map((i) => i.subjectName)).size
    : 0;

  const tabItems = [
    { key: 'all', label: '全部' },
    ...subjects.map((s) => ({ key: s.id, label: s.name })),
  ];

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>
        错题本
      </h1>

      {/* Subject Filter Tabs */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <Tabs items={tabItems} activeKey={activeSubjectId} onChange={handleSubjectChange} />
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        <Card hoverable>
          <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-accent)' }}>
              {data?.total ?? 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>全部错题</div>
          </div>
        </Card>
        <Card hoverable>
          <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-warning)' }}>
              {uniqueSubjects}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>涉及学科</div>
          </div>
        </Card>
        <Card hoverable>
          <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-success)' }}>
              {data?.total ?? 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>待复习</div>
          </div>
        </Card>
      </div>

      {/* Wrong Answer List */}
      {loading ? (
        <LoadingSpinner size="lg" text="加载中..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon="📝"
          title="错题本为空"
          description="你还没有错题记录，继续练习将自动收录错题"
          action={<Button variant="primary" size="sm">去练习</Button>}
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            {items.map((item) => (
              <WrongAnswerCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                isDeleting={deletingIds.has(item.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md) 0',
              }}
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                上一页
              </Button>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                第 {page} / {data.totalPages} 页
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ===== Wrong Answer Card ===== */

function WrongAnswerCard({
  item,
  onDelete,
  isDeleting,
}: {
  item: WrongAnswerItem;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const options = item.questionType === 'choice' ? parseOptions(item.questionContent) : [];

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {/* Header: subject + knowledge point + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Tag color="accent">{item.subjectName}</Tag>
          <Tag color="default">{item.knowledgePointTitle}</Tag>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
            {formatDate(item.createdAt)}
          </div>
        </div>

        {/* Question Content */}
        <div>
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-xs)' }}>
            题目
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
            {item.questionContent}
          </div>
          {/* Options for choice questions */}
          {options.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 'var(--spacing-sm)' }}>
              {options.map((opt, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    padding: '2px var(--spacing-sm)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg-secondary)',
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Answer Comparison */}
        <div className="responsive-col2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>
              你的答案
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--color-warning)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                background: 'rgba(245, 158, 11, 0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                wordBreak: 'break-all',
              }}
            >
              {item.userAnswer || '（未作答）'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>
              正确答案
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--color-success)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                background: 'rgba(34, 197, 94, 0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                wordBreak: 'break-all',
              }}
            >
              {item.correctAnswer}
            </div>
          </div>
        </div>

        {/* Explanation (expandable) */}
        {item.explanation && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-accent)',
                fontWeight: 500,
              }}
            >
              <span style={{ transition: 'transform var(--transition-fast)', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ▶
              </span>
              解析
            </button>
            {expanded && (
              <div
                style={{
                  marginTop: 'var(--spacing-sm)',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {item.explanation}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--spacing-xs)' }}>
          <Button
            variant="ghost"
            size="sm"
            loading={isDeleting}
            onClick={() => onDelete(item.id)}
            style={{ color: 'var(--color-success)' }}
          >
            ✓ 已掌握
          </Button>
        </div>
      </div>
    </Card>
  );
}