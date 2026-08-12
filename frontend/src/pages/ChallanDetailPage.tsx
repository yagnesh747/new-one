import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import type { Challan } from '../types';
import * as challanService from '../services/challanService';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const canConfirmCancel = user?.role === 'Admin' || user?.role === 'Sales' || user?.role === 'Accounts';

  const load = async () => {
    try {
      const data = await challanService.getChallanById(Number(id));
      setChallan(data);
    } catch {
      setError('Challan not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleConfirm = async () => {
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);
    try {
      await challanService.confirmChallan(Number(id));
      setActionSuccess('Challan confirmed successfully. Stock has been deducted.');
      load();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to confirm challan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this challan?')) return;
    setActionError('');
    setActionLoading(true);
    try {
      await challanService.cancelChallan(Number(id));
      setActionSuccess('Challan cancelled.');
      load();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to cancel challan.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading challan...</div>;
  if (error || !challan) return <div className="alert alert-error">{error || 'Not found.'}</div>;

  const totalAmount = challan.items?.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) ?? challan.total_amount;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/challans">Sales Challan</Link>
        <span>/</span>
        <span>{challan.challan_number}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{challan.challan_number}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <StatusBadge status={challan.status} />
            <span className="page-subtitle">
              Created by {challan.created_by_name} on{' '}
              {new Date(challan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/challans')}>
            <ArrowLeft size={14} /> Back
          </button>
          {canConfirmCancel && challan.status === 'Draft' && (
            <>
              <button
                id="confirm-btn"
                className="btn btn-success"
                onClick={handleConfirm}
                disabled={actionLoading}
              >
                <CheckCircle size={14} />
                {actionLoading ? 'Processing...' : 'Confirm Challan'}
              </button>
              <button
                id="cancel-btn"
                className="btn btn-danger"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                <XCircle size={14} />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="alert alert-error" id="challan-action-error">
          ⚠ {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="alert alert-success">{actionSuccess}</div>
      )}

      {/* Challan Header Info */}
      <div className="detail-grid" style={{ marginBottom: 20 }}>
        <div className="detail-section">
          <div className="detail-section-title">Challan Information</div>
          <div className="detail-field">
            <span className="detail-field-label">Challan Number</span>
            <span className="detail-field-value" style={{ fontFamily: 'monospace', fontSize: 15 }}>{challan.challan_number}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Status</span>
            <span className="detail-field-value"><StatusBadge status={challan.status} /></span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Total Quantity</span>
            <span className="detail-field-value">{challan.total_quantity} units</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Total Amount</span>
            <span className="detail-field-value" style={{ fontWeight: 700, fontSize: 16 }}>
              ₹{Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Customer Details</div>
          <div className="detail-field">
            <span className="detail-field-label">Customer Name</span>
            <span className="detail-field-value">{challan.customer_name}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Business</span>
            <span className="detail-field-value">{challan.customer_business}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Created By</span>
            <span className="detail-field-value">{challan.created_by_name}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Created Date</span>
            <span className="detail-field-value">
              {new Date(challan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Challan Items */}
      <div className="table-container">
        <div className="table-toolbar">
          <span className="table-toolbar-title">Challan Items (Product Snapshot)</span>
        </div>
        {!challan.items || challan.items.length === 0 ? (
          <div className="empty-state"><p>No items in this challan.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Unit Price (at sale)</th>
                <th>Quantity</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#64748b' }}>{item.product_sku}</td>
                  <td>₹{Number(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                  <td style={{ fontWeight: 600 }}>
                    ₹{(Number(item.unit_price) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600, paddingRight: 16, fontSize: 13 }}>Total</td>
                <td style={{ fontWeight: 700 }}>{challan.total_quantity}</td>
                <td style={{ fontWeight: 700, fontSize: 15 }}>
                  ₹{Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default ChallanDetailPage;
