import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  LogOut,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customers', label: 'Customer CRM', icon: Users },
    { to: '/products', label: 'Product and Inventory', icon: Package },
    { to: '/challans', label: 'Sales Challan', icon: FileText },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">Stockly</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} strokeWidth={1.8} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
        )}
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleLogout}
          id="logout-btn"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
