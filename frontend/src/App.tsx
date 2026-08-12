import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ProductsPage from './pages/ProductsPage';
import ChallansPage from './pages/ChallansPage';
import CreateChallanPage from './pages/CreateChallanPage';
import ChallanDetailPage from './pages/ChallanDetailPage';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customer CRM',
  '/products': 'Product and Inventory',
  '/challans': 'Sales Challan',
  '/challans/new': 'Create Challan',
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;
  const title =
    PAGE_TITLES[path] ||
    (path.startsWith('/challans/') && path !== '/challans/new' ? 'Challan Details' : '') ||
    (path.startsWith('/customers/') ? 'Customer Details' : 'Stockly');

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title={title} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/customers/:id" element={<CustomerDetailPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/challans" element={<ChallansPage />} />
                    <Route path="/challans/new" element={
                      <ProtectedRoute allowedRoles={['Admin', 'Sales']}>
                        <CreateChallanPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/challans/:id" element={<ChallanDetailPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
