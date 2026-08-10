import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { challanApi } from '../api';
import { Challan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, XCircle, Printer, AlertCircle } from 'lucide-react';

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const { hasRole } = useAuth();
  const canConfirm = hasRole(['Admin', 'Sales', 'Warehouse']);
  const canCancel = hasRole(['Admin', 'Sales']);

  const fetchChallan = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await challanApi.getChallanById(id);
      setChallan(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales challan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handleConfirm = async () => {
    if (!id || !challan) return;
    if (!window.confirm(`Confirm Sales Challan ${challan.challan_number}? This action will reduce inventory stock safely in a database transaction.`)) return;

    setActionError(null);
    setActionSuccess(null);
    setProcessing(true);

    try {
      const res = await challanApi.confirmChallan(id);
      setActionSuccess(`Challan #${res.data.challan_number} confirmed! Inventory stock successfully updated.`);
      fetchChallan();
    } catch (err: any) {
      setActionError(err.message || 'Failed to confirm challan');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !challan) return;
    if (!window.confirm(`Are you sure you want to cancel Draft Challan ${challan.challan_number}?`)) return;

    setActionError(null);
    setActionSuccess(null);
    setProcessing(true);

    try {
      await challanApi.cancelChallan(id);
      setActionSuccess(`Challan #${challan.challan_number} cancelled.`);
      fetchChallan();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel challan');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="page-container">Loading sales challan profile...</div>;
  }

  if (error || !challan) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">{error || 'Challan not found.'}</div>
        <Link to="/challans" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Sales Challans
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/challans" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Sales Challans
        </Link>
        <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
          <Printer size={14} /> Print Delivery Challan
        </button>
      </div>

      {actionError && (
        <div className="alert alert-danger" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="alert alert-success" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Printable Challan Document Card */}
      <div className="card" style={{ padding: '36px' }}>
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>SALES CHALLAN</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono font-bold" style={{ fontSize: '20px', color: '#2563eb' }}>
              {challan.challan_number}
            </div>
            <div style={{ marginTop: 6 }}>
              <StatusBadge status={challan.status} />
            </div>
          </div>
        </div>

        {/* Customer & Challan Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '28px' }}>
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>
              CONSIGNEE / CUSTOMER DETAILS
            </h4>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              {challan.customer_name}
            </div>
            <div style={{ fontWeight: 600, color: '#334155', marginTop: 2 }}>{challan.business_name}</div>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: 4, whiteSpace: 'pre-wrap' }}>
              {challan.address || 'Address not recorded'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: 6 }}>
              GSTIN: <span className="mono font-bold">{challan.gst_number || 'N/A'}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Contact: <span className="mono">{challan.mobile_number || 'N/A'}</span> ({challan.email})
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>
              CHALLAN METADATA
            </h4>
            <table className="table" style={{ border: 'none', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, border: 'none', padding: '4px 0' }}>Creation Date:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{new Date(challan.created_at).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, border: 'none', padding: '4px 0' }}>Confirmed Date:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>
                    {challan.confirmed_at ? new Date(challan.confirmed_at).toLocaleString('en-IN') : 'Pending Confirmation'}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, border: 'none', padding: '4px 0' }}>Generated By:</td>
                  <td style={{ border: 'none', padding: '4px 0' }}>{challan.created_by_name || 'System'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, border: 'none', padding: '4px 0' }}>Dispatch Notes:</td>
                  <td style={{ border: 'none', padding: '4px 0', color: '#64748b' }}>{challan.notes || 'None'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Snapshot Items Table */}
        <div className="table-responsive" style={{ marginBottom: '24px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Snapshot Name</th>
                <th>SKU Code</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th style={{ textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {challan.items?.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                  <td className="mono">{item.sku}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>
                    ₹{item.unit_price.toFixed(2)}
                  </td>
                  <td className="mono font-bold" style={{ textAlign: 'right' }}>
                    {item.quantity}
                  </td>
                  <td className="mono font-bold" style={{ textAlign: 'right' }}>
                    ₹{item.line_total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Summary Box */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '320px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '13px' }}>
              <span>Total Quantity Dispatched:</span>
              <span className="mono font-bold">{challan.total_quantity} units</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: 8 }}>
              <span>Grand Total Amount:</span>
              <span className="mono" style={{ color: '#2563eb' }}>
                ₹{challan.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Actions Footer */}
      {challan.status === 'Draft' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          {canCancel && (
            <button
              className="btn btn-danger"
              disabled={processing}
              onClick={handleCancel}
            >
              <XCircle size={16} /> Cancel Challan
            </button>
          )}

          {canConfirm && (
            <button
              className="btn btn-success"
              disabled={processing}
              onClick={handleConfirm}
            >
              <CheckCircle2 size={16} /> Confirm Challan & Deduct Stock
            </button>
          )}
        </div>
      )}
    </div>
  );
};
