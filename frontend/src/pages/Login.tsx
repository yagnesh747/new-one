import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { Boxes, Key, Mail, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <Boxes size={36} style={{ color: '#2563eb', marginBottom: '8px' }} />
          <h2>ERP + CRM Portal</h2>
          <p>Wholesale & Distribution Operations System</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
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
            <label>Password</label>
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Operations Portal'}
          </button>
        </form>

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
      </div>
    </div>
  );
};
