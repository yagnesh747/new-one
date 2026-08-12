import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import type { Challan } from '../types';
import * as challanService from '../services/challanService';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const ChallansPage: React.FC = () => {
  const { user } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const canCreate = user?.role === 'Admin' || user?.role === 'Sales';

  const loadChallans = async () => {
    setLoading(true);
    try {
      const data = await challanService.getChallans({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setChallans(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadChallans(); }, [search, statusFilter]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challan</h1>
          <div className="page-subtitle">Manage delivery challans and confirm stock dispatch</div>
        </div>
        {canCreate && (
          <Link id="create-challan-btn" to="/challans/new" className="btn btn-primary">
            <Plus size={15} /> Create Challan
          </Link>
        )}
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: '#94a3b8' }} />
            <input
              id="challan-search"
              className="search-input"
              style={{ paddingLeft: 30 }}
              placeholder="Search challans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select id="challan-status-filter" className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
            {challans.length} record{challans.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : challans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p>No challans found. {canCreate && 'Click "Create Challan" to get started.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Challan Number</th>
                <th>Customer</th>
                <th>Total Qty</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/challans/${c.id}`} className="link">{c.challan_number}</Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.customer_name}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{c.customer_business}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.total_quantity}</td>
                  <td>₹{Number(c.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ color: '#64748b', fontSize: 12.5 }}>{c.created_by_name}</td>
                  <td style={{ color: '#64748b', fontSize: 12.5 }}>
                    {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <Link to={`/challans/${c.id}`} className="btn btn-secondary btn-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ChallansPage;
