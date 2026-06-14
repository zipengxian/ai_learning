import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/index';

const ACTIVITIES = [
  {
    key: 'vocabulary',
    icon: '📝',
    title: '单词记忆',
    description: '通过闪卡和拼写练习记忆课程核心词汇',
  },
  {
    key: 'grammar',
    icon: '📖',
    title: '语法练习',
    description: '通过例句和填空练习掌握语法知识点',
  },
  {
    key: 'speaking',
    icon: '🎤',
    title: '口语跟读',
    description: '跟读标准发音，提升口语流利度',
  },
  {
    key: 'listening',
    icon: '🎧',
    title: '听力训练',
    description: '通过听写和听力理解提升听力水平',
  },
];

function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [courseRes, langRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get('/languages'),
        ]);
        if (cancelled) return;

        const courseData = Array.isArray(courseRes.data)
          ? courseRes.data[0]
          : courseRes.data.course || courseRes.data;
        setCourse(courseData);

        const langData = Array.isArray(langRes.data)
          ? langRes.data
          : langRes.data.languages || [];
        setLanguages(langData);
      } catch {
        if (!cancelled) {
          setError('获取课程信息失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  // 获取语种名称
  const getLanguageName = (langId) => {
    const lang = languages.find((l) => l.id === langId);
    return lang ? lang.name || lang.languageName || lang.language_name : '未知语种';
  };

  if (loading) {
    return (
      <div className="page course-detail-page">
        <h1>课程详情</h1>
        <div className="page-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page course-detail-page">
        <h1>课程详情</h1>
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

  if (!course) {
    return (
      <div className="page course-detail-page">
        <h1>课程详情</h1>
        <div className="empty-state">
          <p>课程不存在</p>
        </div>
      </div>
    );
  }

  const langId = course.languageId || course.language_id;
  const langName = getLanguageName(langId);

  return (
    <div className="page course-detail-page">
      {/* 面包屑导航 */}
      <nav className="breadcrumb">
        <Link to="/courses">课程中心</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span>{langName}</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span>{course.level}</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">{course.title}</span>
      </nav>

      {/* 课程信息区域 */}
      <div className="course-info">
        <h1>{course.title}</h1>
        <div className="course-info-tags">
          <span className="tag tag-language">{langName}</span>
          <span className="tag tag-level">{course.level}</span>
        </div>
        <p className="course-info-desc">
          {course.description || '暂无课程描述'}
        </p>
      </div>

      {/* 学习活动入口卡片 */}
      <h2 className="section-title">学习活动</h2>
      <div className="activities-grid">
        {ACTIVITIES.map((activity) => (
          <div
            key={activity.key}
            className="activity-card"
          >
            <div className="activity-card-body">
              <span className="activity-icon">{activity.icon}</span>
              <h3 className="activity-title">{activity.title}</h3>
              <p className="activity-desc">{activity.description}</p>
            </div>
            <div className="activity-card-footer">
              <button
                className="btn btn-primary btn-block"
                onClick={() =>
                  navigate(`/courses/${id}/${activity.key}`)
                }
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

export default CourseDetailPage;