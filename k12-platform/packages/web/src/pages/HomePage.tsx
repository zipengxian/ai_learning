import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import {
  getStudyStats,
  getStudyProgress,
  type StudyStats,
  type StudyProgress,
  type WeekTrendItem,
  type RecentActivity,
  type SubjectProgressItem,
} from '@/api/study';

const ACCENT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function HomePage() {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [statsData, progressData] = await Promise.all([
          getStudyStats(),
          getStudyProgress(),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setProgress(progressData);
        }
      } catch {
        if (!cancelled) {
          setStats(null);
          setProgress(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>
          学习看板
        </h1>
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>
          学习看板
        </h1>
        <EmptyState
          icon="📊"
          title="暂无学习数据"
          description="开始学习后，这里将展示您的学习统计"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>
        学习看板
      </h1>

      {/* ---- Stats Cards ---- */}
      <div
        className="responsive-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: ACCENT_COLORS[0] }}>
              {stats.todayCompleted}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              今日完成知识点
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: ACCENT_COLORS[1] }}>
              {stats.todayQuestions}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              今日练习题目
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: ACCENT_COLORS[2] }}>
              {stats.todayCorrectRate}%
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              今日正确率
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: ACCENT_COLORS[3] }}>
              {stats.pendingWrongAnswers}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              错题待复习
            </div>
          </div>
        </Card>
      </div>

      {/* ---- Week Trend Chart ---- */}
      <Card title="本周学习趋势" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ minHeight: 140, padding: 'var(--spacing-sm) 0' }}>
          {stats.weekTrend && stats.weekTrend.length > 0 ? (
            <WeekChart data={stats.weekTrend} />
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              暂无本周数据
            </div>
          )}
        </div>
        {stats.weekCompleted > 0 && (
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginTop: 'var(--spacing-sm)' }}>
            本周共完成 <strong style={{ color: 'var(--color-accent)' }}>{stats.weekCompleted}</strong> 个知识点
          </div>
        )}
      </Card>

      <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        {/* ---- Subject Progress ---- */}
        <Card title="学科进度">
          {progress?.subjectProgress && progress.subjectProgress.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {progress.subjectProgress.map((item: SubjectProgressItem, idx: number) => (
                <SubjectProgressBar key={item.subjectId} item={item} color={ACCENT_COLORS[idx % ACCENT_COLORS.length]} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              暂无学科数据
            </div>
          )}
        </Card>

        {/* ---- Recent Activities ---- */}
        <Card title="最近学习记录">
          {progress?.recentActivities && progress.recentActivities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {progress.recentActivities.slice(0, 10).map((activity: RecentActivity) => (
                <RecentActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              暂无学习记录
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ===== Sub-components ===== */

function WeekChart({ data }: { data: WeekTrendItem[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barMaxHeight = 100;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        gap: 'var(--spacing-xs)',
        height: barMaxHeight + 40,
        padding: '0 var(--spacing-sm)',
      }}
    >
      {data.map((item, idx) => {
        const height = Math.max((item.count / maxCount) * barMaxHeight, 4);
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              maxWidth: 48,
            }}
          >
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
              {item.count}
            </div>
            <div
              style={{
                width: '100%',
                maxWidth: 32,
                height,
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                background: `linear-gradient(180deg, ${ACCENT_COLORS[0]}, ${ACCENT_COLORS[0]}88)`,
                transition: 'height var(--transition-normal)',
              }}
            />
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 6, whiteSpace: 'nowrap' }}>
              {formatDate(item.date)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubjectProgressBar({ item, color }: { item: SubjectProgressItem; color: string }) {
  const pct = Math.round(item.rate * 100);
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
          fontSize: 'var(--font-size-sm)',
        }}
      >
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{item.subjectName}</span>
        <span style={{ color: 'var(--color-text-tertiary)' }}>{item.completed}/{item.total}</span>
      </div>
      <div
        style={{
          height: 8,
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--transition-slow)',
          }}
        />
      </div>
    </div>
  );
}

function RecentActivityItem({ activity }: { activity: RecentActivity }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--color-accent)',
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
          {activity.knowledgePointTitle}
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 2, flexWrap: 'wrap' }}>
          <Tag color="default">{activity.subjectName}</Tag>
          <Tag color="default">{activity.chapterTitle}</Tag>
          {activity.score !== undefined && (
            <Badge count={activity.score} variant={activity.score >= 60 ? 'success' : 'warning'} />
          )}
        </div>
      </div>
      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
        {formatTime(activity.createdAt)}
      </div>
    </div>
  );
}