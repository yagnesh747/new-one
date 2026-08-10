import React, { useEffect, useState } from 'react';
import { authApi } from '../api';
import { User } from '../types';
import { UserCheck, Mail, Shield } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await authApi.getUsers();
        setUsers(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load system users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Authentication and Roles</h1>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>User Account Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading user accounts...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.full_name}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} className="text-muted" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`user-role-badge ${u.role.toLowerCase()}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
