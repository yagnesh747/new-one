import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api';
import { DashboardStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Users, Package, AlertTriangle, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardApi.getStats();
        setStats(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  if (error || !stats) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">{error || 'Dashboard data unavailable.'}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Dashboard</h1>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>TOTAL CUSTOMERS</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {stats.customers.total}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {stats.customers.active} Active
              </div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>TOTAL PRODUCTS</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {stats.products.total}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Catalog items
              </div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>LOW STOCK PRODUCTS</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: stats.products.lowStockCount > 0 ? '#dc2626' : '#0f172a', marginTop: '4px' }}>
                {stats.products.lowStockCount}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                At or below alert level
              </div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>TOTAL CHALLANS</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {stats.challans.total}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {stats.challans.confirmed} Confirmed
              </div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f0f9ff', color: '#0284c7' }}>
              <FileText size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Section */}
      {stats.lowStockItems.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="card-title" style={{ color: '#dc2626' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              Low Stock Alert
            </span>
            <Link to="/products?lowStock=true" className="btn btn-secondary btn-sm">
              View Products
            </Link>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Current Stock</th>
                  <th>Min Alert Qty</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockItems.map((prod) => (
                  <tr key={prod.id}>
                    <td style={{ fontWeight: 600 }}>{prod.product_name}</td>
                    <td className="mono">{prod.sku}</td>
                    <td>{prod.category}</td>
                    <td>{prod.location || 'Unassigned'}</td>
                    <td>
                      <StatusBadge status="Low Stock" />{' '}
                      <span className="mono font-bold" style={{ marginLeft: 6, color: '#dc2626' }}>
                        {prod.current_stock}
                      </span>
                    </td>
                    <td className="mono">{prod.min_stock_alert}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Recent Stock Movements */}
        <div className="card">
          <div className="card-title">
            <span>Recent Stock Movements</span>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentMovements.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#64748b' }}>
                      No stock movements.
                    </td>
                  </tr>
                ) : (
                  stats.recentMovements.map((sm) => (
                    <tr key={sm.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{sm.product_name}</div>
                        <div className="mono" style={{ fontSize: '11px', color: '#64748b' }}>
                          {sm.sku}
                        </div>
                      </td>
                      <td>
                        {sm.movement_type === 'IN' ? (
                          <span className="badge badge-active" style={{ gap: 2 }}>
                            <ArrowDownRight size={12} /> IN
                          </span>
                        ) : (
                          <span className="badge badge-inactive" style={{ gap: 2 }}>
                            <ArrowUpRight size={12} /> OUT
                          </span>
                        )}
                      </td>
                      <td className="mono font-bold">{sm.quantity_changed}</td>
                      <td style={{ fontSize: '12px' }}>{sm.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales Challans */}
        <div className="card">
          <div className="card-title">
            <span>Recent Sales Challans</span>
            <Link to="/challans" className="btn btn-secondary btn-sm">
              View All
            </Link>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentChallans.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#64748b' }}>
                      No challans generated.
                    </td>
                  </tr>
                ) : (
                  stats.recentChallans.map((ch) => (
                    <tr key={ch.id}>
                      <td className="mono font-bold">
                        <Link to={`/challans/${ch.id}`}>{ch.challan_number}</Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ch.customer_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{ch.business_name}</div>
                      </td>
                      <td className="mono">{ch.total_quantity}</td>
                      <td>
                        <StatusBadge status={ch.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
