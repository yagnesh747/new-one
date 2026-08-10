import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Challans } from './pages/Challans';
import { CreateChallan } from './pages/CreateChallan';
import { ChallanDetail } from './pages/ChallanDetail';
import { UsersPage } from './pages/Users';
import { UserRole } from './types';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-container">Verifying session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopHeader />
        <Outlet />
      </div>
    </div>
  );
};

const RoleGuard: React.FC<{ allowedRoles: UserRole[]; children: React.ReactElement }> = ({
  allowedRoles,
  children,
}) => {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">
          Access Denied: You do not have permission to view this page.
        </div>
      </div>
    );
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/products" element={<Products />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/challans" element={<Challans />} />
        <Route path="/challans/new" element={<CreateChallan />} />
        <Route path="/challans/:id" element={<ChallanDetail />} />

        <Route
          path="/users"
          element={
            <RoleGuard allowedRoles={['Admin']}>
              <UsersPage />
            </RoleGuard>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
