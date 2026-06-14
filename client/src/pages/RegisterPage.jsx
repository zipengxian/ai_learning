import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // 实时校验各字段
  const validateUsername = (value) => {
    if (!value.trim()) {
      setUsernameError('请输入用户名');
    } else {
      setUsernameError('');
    }
  };

  const validateEmail = (value) => {
    if (!value.trim()) {
      setEmailError('请输入邮箱');
    } else if (!EMAIL_REGEX.test(value)) {
      setEmailError('邮箱格式不正确');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('请输入密码');
    } else if (value.length < 6) {
      setPasswordError('密码至少6位');
    } else {
      setPasswordError('');
    }
  };

  const validateConfirmPassword = (value, pwd) => {
    if (!value) {
      setConfirmPasswordError('请再次输入密码');
    } else if (value !== pwd) {
      setConfirmPasswordError('密码不一致');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    if (usernameError) validateUsername(value);
  };

  const handleUsernameBlur = () => {
    validateUsername(username);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) validateEmail(value);
  };

  const handleEmailBlur = () => {
    validateEmail(email);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) validatePassword(value);
    // 密码变更时同步校验确认密码
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword, value);
    }
  };

  const handlePasswordBlur = () => {
    validatePassword(password);
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (confirmPasswordError) validateConfirmPassword(value, password);
  };

  const handleConfirmPasswordBlur = () => {
    validateConfirmPassword(confirmPassword, password);
  };

  const validateAll = () => {
    let valid = true;

    if (!username.trim()) {
      setUsernameError('请输入用户名');
      valid = false;
    }

    if (!email.trim()) {
      setEmailError('请输入邮箱');
      valid = false;
    } else if (!EMAIL_REGEX.test(email)) {
      setEmailError('邮箱格式不正确');
      valid = false;
    }

    if (!password) {
      setPasswordError('请输入密码');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('密码至少6位');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('请再次输入密码');
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('密码不一致');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateAll()) return;

    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || '注册失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>注册</h1>
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && <div className="form-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              onBlur={handleUsernameBlur}
              placeholder="请输入用户名"
            />
            {usernameError && <span className="field-error">{usernameError}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
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
              onBlur={handlePasswordBlur}
              placeholder="请输入密码（至少6位）"
            />
            {passwordError && <span className="field-error">{passwordError}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onBlur={handleConfirmPasswordBlur}
              placeholder="请再次输入密码"
            />
            {confirmPasswordError && <span className="field-error">{confirmPasswordError}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="auth-switch">
          已有账号？<Link to="/login">去登录</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;