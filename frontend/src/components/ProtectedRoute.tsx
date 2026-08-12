import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
