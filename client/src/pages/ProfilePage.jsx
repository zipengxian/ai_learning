import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/AuthContext';
import api from '../api/index';
import { formatRelativeTime } from '../utils/timeFormat';

function ProfilePage() {
  const { user } = useAuth();

  const [progress, setProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [progressRes, achievementsRes] = await Promise.all([
          api.get('/learning/progress'),
          api.get('/achievements'),
        ]);
        if (cancelled) return;

        const progressData = progressRes.data.progress || progressRes.data;
        setProgress(progressData);
        setAchievements(achievementsRes.data.achievements || []);
      } catch {
        if (!cancelled) {
          setError('获取数据失败，请稍后重试');
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="page profile-page">
        <h1>个人主页</h1>
        <div className="page-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page profile-page">
        <h1>个人主页</h1>
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

  const completedCourses = progress?.completed_courses ?? 0;
  const streakDays = progress?.streak_days ?? 0;

  return (
    <div className="page profile-page">
      <h1>个人主页</h1>
      <p className="page-description">管理你的个人信息和学习设置</p>

      {/* 用户信息区域 */}
      <div className="profile-card">
        <div className="avatar-large">
          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="profile-info">
          <h2>{user?.username || '用户'}</h2>
          <p>{user?.email || ''}</p>
          {user?.created_at && (
            <p className="profile-join-date">
              注册时间：{formatDate(user.created_at)}
            </p>
          )}
        </div>
      </div>

      {/* 学习统计摘要 */}
      <div className="profile-stats-grid">
        <div className="profile-stat-item">
          <span className="profile-stat-icon">📖</span>
          <span className="profile-stat-value">{completedCourses}</span>
          <span className="profile-stat-label">完成课程数</span>
        </div>
        <div className="profile-stat-item">
          <span className="profile-stat-icon">🔥</span>
          <span className="profile-stat-value">{streakDays}</span>
          <span className="profile-stat-label">连续学习天数</span>
        </div>
        <div className="profile-stat-item">
          <span className="profile-stat-icon">🏅</span>
          <span className="profile-stat-value">
            {achievements.filter((a) => a.earned).length}
          </span>
          <span className="profile-stat-label">获得成就</span>
        </div>
        <div className="profile-stat-item">
          <span className="profile-stat-icon">🎯</span>
          <span className="profile-stat-value">{achievements.length}</span>
          <span className="profile-stat-label">成就总数</span>
        </div>
      </div>

      {/* 成就徽章墙 */}
      <div className="achievements-section">
        <h2 className="section-title">🏆 成就徽章</h2>
        {achievements.length === 0 ? (
          <div className="empty-state">
            <p>暂无成就数据</p>
          </div>
        ) : (
          <div className="achievements-grid">
            {achievements.map((achievement) => {
              const earnedTime = achievement.earned_at
                ? formatRelativeTime(achievement.earned_at)
                : '';

              return (
                <div
                  key={achievement.id}
                  className={`achievement-card ${
                    achievement.earned
                      ? 'achievement-card--earned'
                      : 'achievement-card--locked'
                  }`}
                >
                  <div className="achievement-card-icon">
                    {achievement.earned ? (
                      <span className="achievement-icon-emoji">
                        {achievement.icon || '🏅'}
                      </span>
                    ) : (
                      <span className="achievement-icon-locked">🔒</span>
                    )}
                  </div>
                  <div className="achievement-card-info">
                    <span className="achievement-card-name">
                      {achievement.name}
                    </span>
                    {achievement.earned ? (
                      earnedTime && (
                        <span className="achievement-card-time">
                          获得于 {earnedTime}
                        </span>
                      )
                    ) : (
                      <span className="achievement-card-desc">
                        {achievement.description}
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

export default ProfilePage;