import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';

  const validate = () => {
    let valid = true;
    if (!email.trim()) {
      setEmailError('请输入邮箱');
      valid = false;
    } else if (!EMAIL_REGEX.test(email)) {
      setEmailError('邮箱格式不正确');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('请输入密码');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) setEmailError('');
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) setPasswordError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || '邮箱或密码错误');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>登录</h1>
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && <div className="form-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="请输入邮箱"
            />
            {emailError && <span className="field-error">{emailError}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="请输入密码"
            />
            {passwordError && <span className="field-error">{passwordError}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="auth-switch">
          还没有账号？<Link to="/register">去注册</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;