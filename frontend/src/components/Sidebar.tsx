import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  UserCheck,
  Boxes,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  const showCustomers = ['Admin', 'Sales', 'Accounts'].includes(role);
  const showProducts = ['Admin', 'Sales', 'Warehouse', 'Accounts'].includes(role);
  const showChallans = ['Admin', 'Sales', 'Warehouse', 'Accounts'].includes(role);
  const showUsers = role === 'Admin';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <Boxes size={22} className="text-primary" />
          <span>Mini ERP + CRM</span>
        </div>
        <div className="sidebar-subtitle">Operations Portal</div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        {showCustomers && (
          <NavLink
            to="/customers"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Customer CRM</span>
          </NavLink>
        )}

        {showProducts && (
          <NavLink
            to="/products"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Package size={18} />
            <span>Product and Inventory</span>
          </NavLink>
        )}

        {showChallans && (
          <NavLink
            to="/challans"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>Sales Challan</span>
          </NavLink>
        )}

        {showUsers && (
          <NavLink
            to="/users"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <UserCheck size={18} />
            <span>Users</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
};
