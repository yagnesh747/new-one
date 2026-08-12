import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import type { Customer, CustomerFollowup } from '../types';
import * as customerService from '../services/customerService';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followups, setFollowups] = useState<CustomerFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFollowupOpen, setIsFollowupOpen] = useState(false);
  const [followupNote, setFollowupNote] = useState('');
  const [followupError, setFollowupError] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === 'Admin' || user?.role === 'Sales';

  const load = async () => {
    try {
      const [c, f] = await Promise.all([
        customerService.getCustomerById(Number(id)),
        customerService.getCustomerFollowups(Number(id)),
      ]);
      setCustomer(c);
      setFollowups(f);
    } catch {
      setError('Customer not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleAddFollowup = async () => {
    if (!followupNote.trim()) {
      setFollowupError('Note is required.');
      return;
    }
    setSaving(true);
    setFollowupError('');
    try {
      await customerService.addCustomerFollowup(Number(id), followupNote);
      setFollowupNote('');
      setIsFollowupOpen(false);
      load();
    } catch (err: any) {
      setFollowupError(err?.response?.data?.message || 'Failed to add follow-up.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading customer...</div>;
  if (error || !customer) return <div className="alert alert-error">{error || 'Not found.'}</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/customers">Customer CRM</Link>
        <span>/</span>
        <span>{customer.name}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{customer.name}</h1>
          <div className="page-subtitle">{customer.business_name}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/customers')}>
            <ArrowLeft size={14} /> Back
          </button>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setIsFollowupOpen(true)} id="add-followup-btn">
              <Plus size={14} /> Add Follow-up
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        {/* Customer Info */}
        <div className="detail-section">
          <div className="detail-section-title">Customer Information</div>
          <div className="detail-field">
            <span className="detail-field-label">Status</span>
            <span className="detail-field-value"><StatusBadge status={customer.status} /></span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Customer Type</span>
            <span className="detail-field-value"><StatusBadge status={customer.type} /></span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Follow-up Date</span>
            <span className="detail-field-value">
              {customer.followup_date
                ? new Date(customer.followup_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                : '—'}
            </span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Added On</span>
            <span className="detail-field-value">
              {new Date(customer.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Business & Contact */}
        <div className="detail-section">
          <div className="detail-section-title">Contact & Business</div>
          <div className="detail-field">
            <span className="detail-field-label">Email</span>
            <span className="detail-field-value">{customer.email}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Mobile</span>
            <span className="detail-field-value">{customer.mobile}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Business Name</span>
            <span className="detail-field-value">{customer.business_name}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">GST Number</span>
            <span className="detail-field-value">{customer.gst_number || '—'}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Address</span>
            <span className="detail-field-value">{customer.address}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="detail-section" style={{ marginBottom: 20 }}>
          <div className="detail-section-title">Notes</div>
          <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{customer.notes}</p>
        </div>
      )}

      {/* Follow-up History */}
      <div className="table-container">
        <div className="table-toolbar">
          <span className="table-toolbar-title">Follow-up Notes</span>
          {canEdit && (
            <button className="btn btn-secondary btn-sm" onClick={() => setIsFollowupOpen(true)}>
              <Plus size={13} /> Add Note
            </button>
          )}
        </div>
        {followups.length === 0 ? (
          <div className="empty-state">
            <p>No follow-up notes yet.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Note</th>
                <th>Added By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {followups.map((f) => (
                <tr key={f.id}>
                  <td style={{ maxWidth: 480 }}>{f.note}</td>
                  <td style={{ color: '#475569' }}>{f.created_by_name}</td>
                  <td style={{ color: '#64748b', fontSize: 12.5 }}>
                    {new Date(f.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' '}
                    {new Date(f.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Follow-up Modal */}
      <Modal
        isOpen={isFollowupOpen}
        onClose={() => { setIsFollowupOpen(false); setFollowupNote(''); setFollowupError(''); }}
        title="Add Follow-up Note"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsFollowupOpen(false)}>Cancel</button>
            <button id="save-followup-btn" className="btn btn-primary" onClick={handleAddFollowup} disabled={saving}>
              {saving ? 'Saving...' : 'Add Note'}
            </button>
          </>
        }
      >
        {followupError && <div className="alert alert-error">{followupError}</div>}
        <div className="form-group">
          <label className="form-label required">Note</label>
          <textarea
            className="form-control"
            id="followup-note-input"
            rows={4}
            value={followupNote}
            onChange={(e) => setFollowupNote(e.target.value)}
            placeholder="Enter follow-up details, next action, or observations..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetailPage;
