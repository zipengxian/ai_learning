import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="page home-page">
      <section className="hero-section">
        <h1>欢迎来到多语种学习平台</h1>
        <p className="hero-subtitle">开启你的多语言学习之旅，探索世界文化</p>
        {!isAuthenticated && (
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">
              立即开始
            </Link>
            <Link to="/login" className="btn btn-outline">
              已有账号？登录
            </Link>
          </div>
        )}
      </section>

      <section className="features-section">
        <h2>平台特色</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>多语种课程</h3>
            <p>提供英语、日语、韩语、法语等多种语言课程</p>
          </div>
          <div className="feature-card">
            <h3>个性化推荐</h3>
            <p>根据你的学习进度和兴趣智能推荐学习路径</p>
          </div>
          <div className="feature-card">
            <h3>社区互动</h3>
            <p>与全球学习者交流，共同进步</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;