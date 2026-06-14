import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getSubjects,
  getGrades,
  getChapters,
  getKnowledgePoints,
  type SubjectItem,
  type GradeItem,
  type ChapterItem,
  type KnowledgePointOutlineItem,
} from '@/api/courses';

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  completed: { icon: '✅', label: '已完成', color: 'var(--color-success)' },
  learning: { icon: '🔄', label: '学习中', color: 'var(--color-warning)' },
  null: { icon: '⬜', label: '未开始', color: 'var(--color-text-tertiary)' },
};

function getStatusInfo(status: string | null) {
  return STATUS_CONFIG[status || 'null'] || STATUS_CONFIG['null'];
}

export default function StudyCenterPage() {
  const navigate = useNavigate();

  // Data state
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [knowledgePointsMap, setKnowledgePointsMap] = useState<
    Record<string, KnowledgePointOutlineItem[]>
  >({});

  // Selection state
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // UI state
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingKpMap, setLoadingKpMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Load subjects and grades on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingSubjects(true);
      setLoadingGrades(true);
      setError(null);
      try {
        const [subjectsData, gradesData] = await Promise.all([
          getSubjects(),
          getGrades(),
        ]);
        if (cancelled) return;
        setSubjects(subjectsData);
        setGrades(gradesData);
        if (subjectsData.length > 0) {
          setSelectedSubjectId(String(subjectsData[0].id));
        }
        if (gradesData.length > 0) {
          setSelectedGradeId(String(gradesData[0].id));
        }
      } catch (e) {
        if (cancelled) return;
        setError('加载学科和年级列表失败，请检查网络连接后重试');
      } finally {
        if (!cancelled) {
          setLoadingSubjects(false);
          setLoadingGrades(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Load chapters when subject or grade changes
  useEffect(() => {
    if (!selectedSubjectId || !selectedGradeId) return;

    let cancelled = false;

    async function load() {
      setLoadingChapters(true);
      setChapters([]);
      setKnowledgePointsMap({});
      setExpandedChapters(new Set());
      setError(null);
      try {
        const chaptersData = await getChapters(selectedSubjectId, selectedGradeId);
        if (cancelled) return;
        setChapters(chaptersData);
      } catch (e) {
        if (cancelled) return;
        setError('加载章节列表失败，请重试');
      } finally {
        if (!cancelled) {
          setLoadingChapters(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedSubjectId, selectedGradeId]);

  // Toggle chapter expansion & load knowledge points
  async function toggleChapter(chapterId: string) {
    const newExpanded = new Set(expandedChapters);

    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
      setExpandedChapters(newExpanded);
    } else {
      newExpanded.add(chapterId);
      setExpandedChapters(newExpanded);

      // Load knowledge points if not already loaded
      if (!knowledgePointsMap[chapterId]) {
        setLoadingKpMap((prev) => ({ ...prev, [chapterId]: true }));
        try {
          const kps = await getKnowledgePoints(chapterId);
          setKnowledgePointsMap((prev) => ({
            ...prev,
            [chapterId]: kps,
          }));
        } catch {
          // Silently fail for individual chapter
        } finally {
          setLoadingKpMap((prev) => ({ ...prev, [chapterId]: false }));
        }
      }
    }
  }

  // Build subject tabs
  const subjectTabs = subjects.map((s) => ({
    key: String(s.id),
    label: s.name,
  }));

  const isLoading = loadingSubjects || loadingGrades;

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: 960, margin: '0 auto' }}>
      <h1
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 700,
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        学习中心
      </h1>

      {error && (
        <div
          style={{
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {error}
        </div>
      )}

      {/* Grade selector */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 600,
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          选择年级
        </h2>
        {loadingGrades ? (
          <LoadingSpinner size="sm" text="加载年级..." />
        ) : (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
            {grades.map((grade) => (
              <Button
                key={String(grade.id)}
                variant={selectedGradeId === String(grade.id) ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedGradeId(String(grade.id))}
              >
                {grade.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Subject selector */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        {loadingSubjects ? (
          <LoadingSpinner size="sm" text="加载学科..." />
        ) : (
          <Tabs
            items={subjectTabs}
            activeKey={selectedSubjectId}
            onChange={setSelectedSubjectId}
          />
        )}
      </div>

      {/* Chapter outline */}
      <h2
        style={{
          fontSize: 'var(--font-size-md)',
          fontWeight: 600,
          marginBottom: 'var(--spacing-md)',
        }}
      >
        课程大纲
      </h2>

      {isLoading ? (
        <LoadingSpinner text="正在加载课程大纲..." />
      ) : !selectedSubjectId || !selectedGradeId ? (
        <Card>
          <EmptyState
            title="请选择学科和年级"
            description="选择学科和年级后，即可查看课程大纲"
          />
        </Card>
      ) : loadingChapters ? (
        <LoadingSpinner text="加载章节列表..." />
      ) : chapters.length === 0 ? (
        <Card>
          <EmptyState
            title="暂无课程大纲"
            description="该学科和年级下暂无章节内容，请联系老师添加"
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {chapters.map((chapter) => {
            const chapterId = String(chapter.id);
            const isExpanded = expandedChapters.has(chapterId);
            const kps = knowledgePointsMap[chapterId] || [];
            const kpLoading = loadingKpMap[chapterId];
            const completedCount = kps.filter(
              (k) => k.status === 'completed',
            ).length;
            const totalCount = kps.length;

            return (
              <Card key={chapterId} padding="0">
                {/* Chapter header */}
                <div
                  onClick={() => toggleChapter(chapterId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      ▶
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--font-size-md)',
                        fontWeight: 600,
                      }}
                    >
                      {chapter.title}
                    </span>
                  </div>
                  {isExpanded && totalCount > 0 && (
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      {completedCount}/{totalCount}
                    </span>
                  )}
                </div>

                {/* Knowledge points list */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      padding: 'var(--spacing-sm) 0',
                    }}
                  >
                    {kpLoading ? (
                      <LoadingSpinner size="sm" text="加载知识点..." />
                    ) : kps.length === 0 ? (
                      <div
                        style={{
                          padding: 'var(--spacing-md) var(--spacing-lg)',
                          color: 'var(--color-text-tertiary)',
                          fontSize: 'var(--font-size-sm)',
                          textAlign: 'center',
                        }}
                      >
                        暂无知识点
                      </div>
                    ) : (
                      kps.map((kp) => {
                        const statusInfo = getStatusInfo(kp.status);
                        return (
                          <div
                            key={String(kp.id)}
                            onClick={() => navigate(`/study/${kp.id}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: 'var(--spacing-sm) var(--spacing-lg)',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLDivElement).style.background =
                                'var(--color-bg-secondary)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLDivElement).style.background = '';
                            }}
                          >
                            <span
                              style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-text-primary)',
                              }}
                            >
                              {kp.title}
                            </span>
                            <span
                              title={statusInfo.label}
                              style={{
                                fontSize: 'var(--font-size-xs)',
                                color: statusInfo.color,
                              }}
                            >
                              {statusInfo.icon}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}