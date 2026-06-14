import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../api/index';

const ACTIVITY_LABELS = {
  vocabulary: '词汇',
  grammar: '语法',
  speaking: '口语',
  listening: '听力',
};

function getScoreColor(score) {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-mid';
  return 'score-low';
}

function DashboardPage() {
  const navigate = useNavigate();

  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [progressRes, historyRes] = await Promise.all([
          api.get('/learning/progress'),
          api.get('/learning/history', { params: { page: 1, limit: 50 } }),
        ]);
        if (cancelled) return;

        setProgress(progressRes.data);
        const records = Array.isArray(historyRes.data)
          ? historyRes.data
          : historyRes.data.records || [];
        setHistory(records);
      } catch {
        if (!cancelled) {
          setError('获取学习数据失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="page dashboard-page">
        <h1>学习看板</h1>
        <div className="page-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page dashboard-page">
        <h1>学习看板</h1>
        <div className="page-error">
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  const hasNoData = !progress && history.length === 0;

  if (hasNoData) {
    return (
      <div className="page dashboard-page">
        <h1>学习看板</h1>
        <p className="page-description">查看你的学习进度、统计数据和学习报告</p>
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">📚</div>
          <p className="dashboard-empty-text">还没有学习记录，快去开始学习吧！</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/courses')}
          >
            前往课程中心
          </button>
        </div>
      </div>
    );
  }

  const completedCourses = progress?.completedCourses ?? 0;
  const totalActivities = progress?.totalActivities ?? 0;
  const streakDays = progress?.streakDays ?? 0;
  const averageScore = progress?.averageScore ?? 0;
  const skills = progress?.skills || {};

  const skillChartData = [
    { name: '词汇', score: skills.vocabulary ?? 0 },
    { name: '语法', score: skills.grammar ?? 0 },
    { name: '口语', score: skills.speaking ?? 0 },
    { name: '听力', score: skills.listening ?? 0 },
  ];

  const recentHistory = history.slice(0, 10);

  return (
    <div className="page dashboard-page">
      <h1>学习看板</h1>
      <p className="page-description">查看你的学习进度、统计数据和学习报告</p>

      {/* 统计卡片 */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card dashboard-stat-card--blue">
          <div className="dashboard-stat-icon">📖</div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-value">{completedCourses}</span>
            <span className="dashboard-stat-label">完成课程数</span>
          </div>
        </div>
        <div className="dashboard-stat-card dashboard-stat-card--green">
          <div className="dashboard-stat-icon">🏃</div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-value">{totalActivities}</span>
            <span className="dashboard-stat-label">总活动次数</span>
          </div>
        </div>
        <div className="dashboard-stat-card dashboard-stat-card--purple">
          <div className="dashboard-stat-icon">🔥</div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-value">{streakDays}</span>
            <span className="dashboard-stat-label">连续学习天数</span>
          </div>
        </div>
        <div className="dashboard-stat-card dashboard-stat-card--orange">
          <div className="dashboard-stat-icon">⭐</div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-value">{averageScore}</span>
            <span className="dashboard-stat-label">总体平均分</span>
          </div>
        </div>
      </div>

      {/* 技能得分图表 */}
      <div className="dashboard-chart-card">
        <h2 className="dashboard-section-title">技能得分</h2>
        <div className="dashboard-chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 14 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 13 }} />
              <Tooltip
                formatter={(value) => [`${value} 分`, '得分']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar
                dataKey="score"
                fill="#4f46e5"
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 最近学习活动时间线 */}
      <div className="dashboard-chart-card">
        <h2 className="dashboard-section-title">最近学习活动</h2>
        {recentHistory.length === 0 ? (
          <p className="dashboard-timeline-empty">暂无学习活动记录</p>
        ) : (
          <div className="dashboard-timeline">
            {recentHistory.map((record, index) => {
              const dateStr = record.date
                ? new Date(record.date).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })
                : '未知日期';
              const activityLabel =
                ACTIVITY_LABELS[record.activityType] || record.activityType || '未知';
              const scoreClass = getScoreColor(record.score);

              return (
                <div
                  key={record.id || index}
                  className={`dashboard-timeline-item ${index === recentHistory.length - 1 ? 'dashboard-timeline-item--last' : ''}`}
                >
                  <div className="dashboard-timeline-dot" />
                  <div className="dashboard-timeline-content">
                    <span className="dashboard-timeline-date">{dateStr}</span>
                    <div className="dashboard-timeline-info">
                      <span className="dashboard-timeline-course">
                        {record.courseName || '未知课程'}
                      </span>
                      <span className="dashboard-timeline-type">{activityLabel}</span>
                    </div>
                    {record.score != null && (
                      <span className={`dashboard-timeline-score ${scoreClass}`}>
                        {record.score} 分
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;