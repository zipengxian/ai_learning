import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/index';

function CoursesPage() {
  const navigate = useNavigate();

  const [languages, setLanguages] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedLanguageId, setSelectedLanguageId] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('入门');

  // 获取语种列表与课程列表
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [langRes, courseRes] = await Promise.all([
          api.get('/languages'),
          api.get('/courses'),
        ]);
        if (cancelled) return;

        const langData = Array.isArray(langRes.data)
          ? langRes.data
          : langRes.data.languages || [];
        setLanguages(langData);
        if (langData.length > 0) {
          setSelectedLanguageId((prev) => prev ?? langData[0].id);
        }

        const courseData = Array.isArray(courseRes.data)
          ? courseRes.data
          : courseRes.data.courses || [];
        setCourses(courseData);
      } catch {
        if (!cancelled) {
          setError('获取课程列表失败，请稍后重试');
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

  // 根据选中的语种和级别筛选课程
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const langMatch = selectedLanguageId
        ? course.languageId === selectedLanguageId || course.language_id === selectedLanguageId
        : true;
      const levelMatch = selectedLevel ? course.level === selectedLevel : true;
      return langMatch && levelMatch;
    });
  }, [courses, selectedLanguageId, selectedLevel]);

  const levels = ['入门', '初级', '中级'];

  // 获取语种名称
  const getLanguageName = (langId) => {
    const lang = languages.find((l) => l.id === langId);
    return lang ? lang.name || lang.languageName || lang.language_name : '未知语种';
  };

  if (loading) {
    return (
      <div className="page courses-page">
        <h1>课程中心</h1>
        <div className="page-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page courses-page">
        <h1>课程中心</h1>
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

  return (
    <div className="page courses-page">
      <h1>课程中心</h1>
      <p className="page-description">浏览所有可用的语言课程，选择你感兴趣的课程开始学习</p>

      {/* 语种选择区域 */}
      <div className="filter-section">
        <h3 className="filter-label">选择语种</h3>
        <div className="tab-group">
          {languages.map((lang) => (
            <button
              key={lang.id}
              className={`tab-btn ${selectedLanguageId === lang.id ? 'tab-btn-active' : ''}`}
              onClick={() => setSelectedLanguageId(lang.id)}
            >
              {lang.name || lang.languageName || lang.language_name}
            </button>
          ))}
        </div>
      </div>

      {/* 级别筛选区域 */}
      <div className="filter-section">
        <h3 className="filter-label">选择级别</h3>
        <div className="tab-group">
          {levels.map((level) => (
            <button
              key={level}
              className={`tab-btn ${selectedLevel === level ? 'tab-btn-active' : ''}`}
              onClick={() => setSelectedLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* 课程卡片网格 */}
      {filteredCourses.length === 0 ? (
        <div className="empty-state">
          <p>暂无课程</p>
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map((course) => {
            const langName = getLanguageName(
              course.languageId || course.language_id
            );
            return (
              <div key={course.id} className="course-card">
                <div className="course-card-body">
                  <h3 className="course-card-title">{course.title}</h3>
                  <p className="course-card-desc">
                    {course.description || '暂无描述'}
                  </p>
                  <div className="course-card-tags">
                    <span className="tag tag-language">{langName}</span>
                    <span className="tag tag-level">{course.level}</span>
                  </div>
                </div>
                <div className="course-card-footer">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    开始学习
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CoursesPage;