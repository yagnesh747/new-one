import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerApi, challanApi } from '../api';
import { Customer, CustomerFollowUp, Challan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Calendar, User, FileText } from 'lucide-react';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<CustomerFollowUp[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Follow-up State
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [note, setNote] = useState('');
  const [nextDate, setNextDate] = useState('');

  const { hasRole } = useAuth();
  const canAddFollowUp = hasRole(['Admin', 'Sales']);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [custRes, followRes, challanRes] = await Promise.all([
        customerApi.getCustomerById(id),
        customerApi.getFollowUps(id),
        challanApi.getChallans({ customer_id: id }),
      ]);
      setCustomer(custRes.data);
      setFollowUps(followRes.data);
      setChallans(challanRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !note.trim()) return;

    try {
      await customerApi.addFollowUp(id, {
        note: note.trim(),
        follow_up_date: nextDate || undefined,
      });
      setShowFollowUpModal(false);
      setNote('');
      setNextDate('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add follow-up note');
    }
  };

  if (loading) {
    return <div className="page-container">Loading customer profile...</div>;
  }

  if (error || !customer) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">{error || 'Customer profile not found.'}</div>
        <Link to="/customers" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16 }}>
        <Link to="/customers" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Customers Directory
        </Link>
      </div>

      <div className="page-header">
        <div className="page-header-text">
          <h1>{customer.customer_name}</h1>
          <p>{customer.business_name}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StatusBadge status={customer.status} />
          {canAddFollowUp && (
            <button className="btn btn-primary" onClick={() => setShowFollowUpModal(true)}>
              <Plus size={16} /> Record Follow-Up Note
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Profile Card */}
        <div className="card">
          <div className="card-title">Customer Overview</div>
          <table className="table" style={{ border: 'none' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: '130px', border: 'none' }}>Email Address:</td>
                <td style={{ border: 'none' }}>{customer.email}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, border: 'none' }}>Mobile Number:</td>
                <td className="mono" style={{ border: 'none' }}>{customer.mobile_number}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, border: 'none' }}>Customer Type:</td>
                <td style={{ border: 'none' }}>
                  <span className="badge badge-lead">{customer.customer_type}</span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, border: 'none' }}>GST Number:</td>
                <td className="mono" style={{ border: 'none' }}>{customer.gst_number || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, border: 'none' }}>Address:</td>
                <td style={{ border: 'none' }}>{customer.address}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, border: 'none' }}>Scheduled Follow-up:</td>
                <td style={{ border: 'none', fontWeight: 600, color: '#2563eb' }}>
                  {customer.follow_up_date
                    ? new Date(customer.follow_up_date).toLocaleDateString('en-IN')
                    : 'None'}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, border: 'none' }}>Internal Notes:</td>
                <td style={{ border: 'none', color: '#64748b' }}>{customer.notes || 'No notes added.'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer Sales Challans */}
        <div className="card">
          <div className="card-title">Associated Sales Challans</div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {challans.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#64748b', padding: '16px' }}>
                      No sales challans created for this customer yet.
                    </td>
                  </tr>
                ) : (
                  challans.map((ch) => (
                    <tr key={ch.id}>
                      <td className="mono font-bold">
                        <Link to={`/challans/${ch.id}`}>{ch.challan_number}</Link>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(ch.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="mono">₹{ch.total_amount.toFixed(2)}</td>
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

      {/* CRM Follow-up Timeline */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-title">
          <span>CRM Communication & Follow-up Timeline</span>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
            {followUps.length} entries
          </span>
        </div>

        {followUps.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
            No follow-up notes recorded yet. Click "Record Follow-Up Note" to log phone calls, site visits, or quotation updates.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {followUps.map((f) => (
              <div
                key={f.id}
                style={{
                  padding: '16px',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                    <User size={14} />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{f.created_by_name || 'System User'}</span>
                    <span>•</span>
                    <span>{new Date(f.created_at).toLocaleString('en-IN')}</span>
                  </div>

                  {f.follow_up_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
                      <Calendar size={14} />
                      Target Date: {new Date(f.follow_up_date).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap' }}>{f.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Follow-up Modal */}
      {showFollowUpModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Record CRM Follow-Up Note</h3>
              <button
                className="btn btn-secondary btn-sm btn-icon"
                onClick={() => setShowFollowUpModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddFollowUp}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Follow-Up Note / Discussion Summary *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Enter details of conversation, quotation sent, payment reminder, or site visit feedback..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Next Scheduled Follow-Up Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFollowUpModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
