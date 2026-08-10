import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { UserCheck, Key, Mail, AlertCircle, User as UserIcon, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Sales' | 'Warehouse' | 'Accounts'>('Sales');
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError('Please provide your full name.');
          setLoading(false);
          return;
        }

        const res = await authApi.register({
          email,
          password,
          full_name: fullName.trim(),
          role,
        });
        login(res.data.token, res.data.user);
        setSuccessMsg('Account registered successfully! Email alert sent.');
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        const res = await authApi.login(email, password);
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || (isSignUp ? 'Registration failed.' : 'Login failed. Please check credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (demoEmail: string) => {
    setIsSignUp(false);
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <h2>Stockly</h2>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: 4 }}>
            {isSignUp ? 'Create a New Account' : 'Internal Operations Portal'}
          </div>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            borderRadius: '6px',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              fontSize: '13px',
              padding: '6px 12px',
              backgroundColor: !isSignUp ? '#ffffff' : 'transparent',
              color: !isSignUp ? '#0f172a' : '#64748b',
              fontWeight: !isSignUp ? 600 : 400,
              boxShadow: !isSignUp ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              border: 'none',
            }}
            onClick={() => {
              setIsSignUp(false);
              setError(null);
              setSuccessMsg(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              fontSize: '13px',
              padding: '6px 12px',
              backgroundColor: isSignUp ? '#ffffff' : 'transparent',
              color: isSignUp ? '#0f172a' : '#64748b',
              fontWeight: isSignUp ? 600 : 400,
              boxShadow: isSignUp ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              border: 'none',
            }}
            onClick={() => {
              setIsSignUp(true);
              setError(null);
              setSuccessMsg(null);
            }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <UserCheck size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <UserIcon
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: 36 }}
                  placeholder="e.g. Yaganesh Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email Address *</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: 36 }}
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password *</label>
            <div style={{ position: 'relative' }}>
              <Key
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: 36 }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div className="form-group">
              <label>Role Assignment *</label>
              <div style={{ position: 'relative' }}>
                <Shield
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <select
                  className="form-control"
                  style={{ paddingLeft: 36 }}
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="Sales">Sales (CRM & Challans)</option>
                  <option value="Warehouse">Warehouse (Inventory & Stock)</option>
                  <option value="Accounts">Accounts (Financial Review)</option>
                  <option value="Admin">Admin (Full System Access)</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading
              ? isSignUp
                ? 'Creating Account...'
                : 'Authenticating...'
              : isSignUp
              ? 'Register New Account'
              : 'Sign In to Stockly'}
          </button>
        </form>

        {!isSignUp && (
          <div className="demo-credentials">
            <h4>Click demo role credentials to test:</h4>
            <div className="demo-users-grid">
              <button
                type="button"
                className="demo-user-btn"
                onClick={() => setDemoUser('admin@example.com')}
              >
                👑 Admin (Full)
              </button>
              <button
                type="button"
                className="demo-user-btn"
                onClick={() => setDemoUser('sales@example.com')}
              >
                💼 Sales (CRM/Challans)
              </button>
              <button
                type="button"
                className="demo-user-btn"
                onClick={() => setDemoUser('warehouse@example.com')}
              >
                📦 Warehouse (Inventory)
              </button>
              <button
                type="button"
                className="demo-user-btn"
                onClick={() => setDemoUser('accounts@example.com')}
              >
                📊 Accounts (Read-only)
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
              Demo Password: <code className="mono font-bold">password123</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
