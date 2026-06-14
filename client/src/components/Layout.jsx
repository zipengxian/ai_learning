import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-container">
          <Link to="/" className="logo">
            多语种学习平台
          </Link>
          <nav className="nav-links">
            <Link to="/">首页</Link>
            <Link to="/courses">课程</Link>
            <Link to="/recommend">推荐</Link>
            <Link to="/community">社区</Link>
            <Link to="/dashboard">看板</Link>
          </nav>
          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="user-info">
                  <span className="avatar-placeholder">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className="username">{user?.username || '用户'}</span>
                </Link>
                <button className="btn-logout" onClick={handleLogout}>
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-link">
                  登录
                </Link>
                <Link to="/register" className="btn-link btn-primary">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-container">
          <p>&copy; {new Date().getFullYear()} 多语种学习平台. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;