import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/index';

function getReasonClass(reason) {
  if (reason.startsWith('继续学习')) return 'recommend-reason-continue';
  if (reason.startsWith('开启')) return 'recommend-reason-explore';
  return 'recommend-reason-default';
}

function RecommendPage() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendations() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/recommendations');
        if (cancelled) return;
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.recommendations || [];
        setRecommendations(data);
      } catch {
        if (!cancelled) {
          setError('获取推荐失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRecommendations();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="page recommend-page">
        <h1>学习推荐</h1>
        <p className="page-description">根据你的学习进度，为你推荐以下课程</p>
        <div className="page-loading">正在为你生成推荐...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page recommend-page">
        <h1>学习推荐</h1>
        <p className="page-description">根据你的学习进度，为你推荐以下课程</p>
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

  if (recommendations.length === 0) {
    return (
      <div className="page recommend-page">
        <h1>学习推荐</h1>
        <p className="page-description">根据你的学习进度，为你推荐以下课程</p>
        <div className="empty-state">
          <p>暂无推荐</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page recommend-page">
      <h1>学习推荐</h1>
      <p className="page-description">根据你的学习进度，为你推荐以下课程</p>

      <div className="recommend-grid">
        {recommendations.map((rec) => (
          <div key={rec.id} className="recommend-card">
            <div className="recommend-card-body">
              <div className="recommend-card-header">
                <h3 className="recommend-card-title">{rec.title}</h3>
                <span className={`recommend-reason ${getReasonClass(rec.reason)}`}>
                  {rec.reason}
                </span>
              </div>

              <div className="recommend-card-tags">
                <span className="tag tag-language">{rec.language}</span>
                <span className="tag tag-level">{rec.level}</span>
              </div>

              <p className="recommend-card-desc">
                {rec.description || '暂无描述'}
              </p>
            </div>

            <div className="recommend-card-footer">
              <button
                className="btn btn-primary btn-block"
                onClick={() => navigate(`/courses/${rec.id}`)}
              >
                开始学习
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecommendPage;