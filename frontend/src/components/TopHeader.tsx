import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export const TopHeader: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleClass = user.role.toLowerCase();

  return (
    <header className="top-header">
      <div className="header-title">Stockly</div>

      <div className="header-user">
        <div className="user-badge">
          <div className="user-avatar">{user.full_name.charAt(0)}</div>
          <div className="user-info">
            <span className="user-name">{user.full_name}</span>
            <span className={`user-role-badge ${roleClass}`}>{user.role}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Sign out of Stockly"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
