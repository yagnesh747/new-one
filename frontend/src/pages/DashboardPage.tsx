import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getDashboardSummary,
  getDashboardLowStock,
  getDashboardRecentActivity,
  getDashboardSalesSummary,
  getDashboardCustomerSummary,
} from '../services/dashboardService';
import type {
  DashboardSummary,
  DashboardLowStockProduct,
  DashboardActivityItem,
  DashboardSalesPoint,
  DashboardCustomerSummary,
} from '../types';
import StatusBadge from '../components/StatusBadge';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lowStock, setLowStock] = useState<DashboardLowStockProduct[]>([]);
  const [activity, setActivity] = useState<DashboardActivityItem[]>([]);
  const [salesSummary, setSalesSummary] = useState<DashboardSalesPoint[]>([]);
  const [customerSummary, setCustomerSummary] = useState<DashboardCustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = user?.role ?? 'Sales';
  const isAdmin = role === 'Admin';
  const showSales = isAdmin || role === 'Sales' || role === 'Accounts';
  const showInventory = isAdmin || role === 'Warehouse';
  const showCustomers = isAdmin || role === 'Sales';
  const showFinance = isAdmin || role === 'Accounts';

  useEffect(() => {
    setLoading(true);
    setError('');

    const loadDashboard = async () => {
      try {
        const summaryData = await getDashboardSummary();
        const [lowStockResult, activityResult, salesResult, customerResult] = await Promise.allSettled([
          getDashboardLowStock(),
          getDashboardRecentActivity(),
          getDashboardSalesSummary(),
          getDashboardCustomerSummary(),
        ]);

        setSummary(summaryData);
        setLowStock(lowStockResult.status === 'fulfilled' ? lowStockResult.value : []);
        setActivity(activityResult.status === 'fulfilled' ? activityResult.value : []);
        setSalesSummary(salesResult.status === 'fulfilled' ? salesResult.value : []);
        setCustomerSummary(customerResult.status === 'fulfilled' ? customerResult.value : { topCustomers: [], recentCustomers: [] });
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const chartMax = useMemo(() => {
    if (!salesSummary.length) return 1;
    return Math.max(...salesSummary.map((item) => item.revenue), 1);
  }, [salesSummary]);

  const latestMonth = salesSummary[salesSummary.length - 1];
  const previousMonth = salesSummary[salesSummary.length - 2];
  const revenueChange = latestMonth && previousMonth ? latestMonth.revenue - previousMonth.revenue : 0;
  const revenueChangeLabel = latestMonth && previousMonth ? `${revenueChange >= 0 ? '+' : '-'}${formatCurrency(Math.abs(revenueChange))}` : '—';

  if (loading) return <div className="loading-spinner">Loading dashboard...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!summary || !customerSummary) return null;

  const summaryCards = [
    {
      label: 'Total Customers',
      value: summary.totalCustomers,
      show: showCustomers || isAdmin,
    },
    {
      label: 'Total Products',
      value: summary.totalProducts,
      show: showInventory || isAdmin,
    },
    {
      label: 'Total Challans',
      value: summary.totalChallans,
      show: showSales || showFinance || isAdmin,
    },
    {
      label: 'Total Sales',
      value: formatCurrency(summary.totalRevenue),
      show: showSales || showFinance || isAdmin,
    },
    {
      label: 'Low Stock Products',
      value: summary.lowStockCount,
      show: showInventory || isAdmin,
      warning: summary.lowStockCount > 0,
    },
    {
      label: 'Pending Payments',
      value: formatCurrency(summary.pendingPayments),
      show: showFinance || isAdmin,
    },
  ];

  const quickActions = [
    { label: 'Add Customer', to: '/customers', visible: isAdmin || role === 'Sales' },
    { label: 'Add Product', to: '/products', visible: isAdmin || role === 'Warehouse' },
    { label: 'Create Challan', to: '/challans/new', visible: isAdmin || role === 'Sales' },
    { label: 'View Inventory', to: '/products', visible: isAdmin || role === 'Warehouse' },
    { label: 'View Customers', to: '/customers', visible: true },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">Professional operations overview for your role</div>
        </div>
      </div>

      <div className="dashboard-actions">
        {quickActions.filter((action) => action.visible).map((action) => (
          <Link key={action.label} to={action.to} className="btn btn-secondary">
            {action.label}
          </Link>
        ))}
      </div>

      <div className="dashboard-summary-grid">
        {summaryCards.filter((item) => item.show).map((item) => (
          <div key={item.label} className="stat-card overview-card">
            <div className="stat-label">{item.label}</div>
            <div className={`stat-value${item.warning ? ' danger' : ''}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {(showSales || showFinance) && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Sales Analytics</h2>
              <p className="section-description">Revenue and order trends for the last 12 months.</p>
            </div>
            <div className="trend-pill">
              <span>Latest month change</span>
              <strong>{revenueChangeLabel}</strong>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-metric">
                <div className="metric-label">Revenue last 12 months</div>
                <div className="metric-value">{formatCurrency(salesSummary.reduce((sum, item) => sum + item.revenue, 0))}</div>
              </div>
              <div className="analytics-metric">
                <div className="metric-label">Confirmed challans</div>
                <div className="metric-value">{salesSummary.reduce((sum, item) => sum + item.order_count, 0)}</div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-grid">
                {salesSummary.map((point) => (
                  <div key={point.month} className="chart-column">
                    <div className="chart-bar" style={{ height: `${(point.revenue / chartMax) * 100}%` }}>
                      <span className="chart-bar-label">{point.order_count}</span>
                    </div>
                    <div className="chart-label">{point.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {(showInventory || isAdmin) && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Low Stock</h2>
              <p className="section-description">Products below their minimum stock alert level.</p>
            </div>
            <Link to="/products" className="btn btn-secondary btn-sm">
              Open Inventory
            </Link>
          </div>

          <div className="table-container">
            {lowStock.length === 0 ? (
              <div className="empty-state">
                <p>All products are stocked above the minimum alert level.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Min Level</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((product) => {
                    const statusText = product.current_stock <= product.min_stock_alert * 0.5 ? 'Critical' : 'Warning';
                    return (
                      <tr key={product.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{product.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{product.sku}</div>
                        </td>
                        <td>{product.current_stock}</td>
                        <td>{product.min_stock_alert}</td>
                        <td>
                          <span className={`badge badge-low-stock`} style={{ borderRadius: 999, padding: '5px 10px', fontSize: 12 }}>
                            {statusText}
                          </span>
                        </td>
                        <td>
                          <Link to="/products" className="btn btn-secondary btn-sm">
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {(showSales || isAdmin) && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Recent Activity</h2>
              <p className="section-description">Latest challans and order updates across the business.</p>
            </div>
            <Link to="/challans" className="btn btn-secondary btn-sm">
              View All Challans
            </Link>
          </div>

          <div className="table-container">
            {activity.length === 0 ? (
              <div className="empty-state">
                <p>No recent challans available.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Challan</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {activity.map((item) => (
                    <tr key={item.id}>
                      <td>{item.challan_number}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.customer_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{item.customer_business}</div>
                      </td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>{formatCurrency(item.total_amount)}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>
                        <Link to={`/challans/${item.id}`} className="btn btn-secondary btn-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {(showCustomers || isAdmin) && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Customer Snapshot</h2>
              <p className="section-description">Recent relationships and top customer revenue activity.</p>
            </div>
            <Link to="/customers" className="btn btn-secondary btn-sm">
              View CRM
            </Link>
          </div>

          <div className="dashboard-grid-two">
            <div className="card">
              <div className="table-toolbar">
                <span className="table-toolbar-title">Recent Customers</span>
              </div>
              <div className="customer-list">
                {customerSummary.recentCustomers.length === 0 ? (
                  <div className="empty-state">
                    <p>No recent customer records yet.</p>
                  </div>
                ) : (
                  customerSummary.recentCustomers.map((customer) => (
                    <div key={customer.id} className="customer-list-item">
                      <div>
                        <div className="customer-name">{customer.name}</div>
                        <div className="customer-meta">{customer.business_name}</div>
                      </div>
                      <div className="customer-date">{formatDate(customer.created_at)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <div className="table-toolbar">
                <span className="table-toolbar-title">Top Customers</span>
              </div>
              {customerSummary.topCustomers.length === 0 ? (
                <div className="empty-state">
                  <p>No customer sales data yet.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Sales</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerSummary.topCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.name}</td>
                        <td>{formatCurrency(customer.total_sales)}</td>
                        <td>{customer.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default DashboardPage;
