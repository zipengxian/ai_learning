import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/index';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 应用初始化时恢复 token 并获取用户信息
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      api
        .get('/auth/me')
        .then((res) => {
          setUser(res.data.user || res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setToken(newToken);
    setUser(userData || null);
    return res.data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setToken(newToken);
    setUser(userData || null);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;