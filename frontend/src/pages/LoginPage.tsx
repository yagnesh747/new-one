import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TEST_ROLES = [
  { label: 'Admin', subtitle: 'Administrator Access', email: 'admin@example.com', badgeColor: '#2563eb', bg: '#eff6ff' },
  { label: 'Sales', subtitle: 'Sales Manager', email: 'sales@example.com', badgeColor: '#16a34a', bg: '#f0fdf4' },
  { label: 'Warehouse', subtitle: 'Stock & Inventory', email: 'warehouse@example.com', badgeColor: '#d97706', bg: '#fffbeb' },
  { label: 'Accounts', subtitle: 'Billing & Accounts', email: 'accounts@example.com', badgeColor: '#9333ea', bg: '#faf5ff' },
];

const ROLES = ['Sales', 'Admin', 'Warehouse', 'Accounts'];

const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up state
  const [name, setName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [role, setRole] = useState('Sales');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      setError('All fields are required.');
      return;
    }

    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        role,
      });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const autofillRole = (item: typeof TEST_ROLES[0]) => {
    setMode('signin');
    setEmail(item.email);
    setPassword('password123');
    setSelectedRole(item.label);
    setError('');
    setSuccessMsg(`Selected ${item.label} role credentials!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">Stockly</div>
        <div className="login-tagline">ERP & CRM Operations Portal</div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: 20,
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'signin' ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2,
              fontWeight: 600,
              fontSize: 14,
              color: mode === 'signin' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'signup' ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2,
              fontWeight: 600,
              fontSize: 14,
              color: mode === 'signup' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="alert alert-error" id="auth-error">{error}</div>}
        {successMsg && (
          <div
            className="alert"
            style={{
              background: '#dcfce7',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            {successMsg}
          </div>
        )}

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn}>
            <div className="form-group">
              <label className="form-label required" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                className={`form-control${error ? ' error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label required" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className={`form-control${error ? ' error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <div className="form-group">
              <label className="form-label required" htmlFor="signup-name">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label className="form-label required" htmlFor="signup-email">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                className="form-control"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label required" htmlFor="signup-password">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                className="form-control"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Select Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: role === r ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: role === r ? '#eff6ff' : '#ffffff',
                      color: role === r ? '#1e40af' : '#475569',
                      fontWeight: role === r ? 600 : 500,
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Quick Role Selection Box */}
        <div
          style={{
            marginTop: 24,
            padding: '14px 16px',
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Quick Demo Roles</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8', textTransform: 'none' }}>
              Click to autofill
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TEST_ROLES.map((item) => {
              const isSelected = selectedRole === item.label && mode === 'signin';
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => autofillRole(item)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: isSelected ? `1.5px solid ${item.badgeColor}` : '1px solid #e2e8f0',
                    background: isSelected ? item.bg : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: item.badgeColor }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>
                    {item.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
