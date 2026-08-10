import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { challanApi } from '../api';
import { Challan, Pagination as PaginationType } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Eye, FileText } from 'lucide-react';

export const Challans: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState<PaginationType | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { hasRole } = useAuth();
  const canCreate = hasRole(['Admin', 'Sales']);

  const fetchChallans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await challanApi.getChallans({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      setChallans(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [search, statusFilter, page]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Sales Challans Workflow</h1>
          <p>Generate, confirm, and audit sales dispatch challans with stock deduction safeguards</p>
        </div>
        {canCreate && (
          <Link to="/challans/new" className="btn btn-primary">
            <Plus size={16} /> Create New Challan
          </Link>
        )}
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by challan # or customer business name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Challan Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Challan Number</th>
                <th>Customer & Business</th>
                <th>Total Qty</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Confirmed Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading sales challans...
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No sales challans found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch.id}>
                    <td className="mono font-bold" style={{ color: '#2563eb' }}>
                      <Link to={`/challans/${ch.id}`}>{ch.challan_number}</Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{ch.customer_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{ch.business_name}</div>
                    </td>
                    <td className="mono font-bold">{ch.total_quantity}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>
                      ₹{ch.total_amount.toFixed(2)}
                    </td>
                    <td>
                      <StatusBadge status={ch.status} />
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(ch.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {ch.confirmed_at ? new Date(ch.confirmed_at).toLocaleDateString('en-IN') : 'Pending'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/challans/${ch.id}`}
                        className="btn btn-secondary btn-sm"
                        title="View Challan Details & Confirm"
                      >
                        <Eye size={14} /> View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
    </div>
  );
};
