import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import type { Customer } from '../types';
import * as customerService from '../services/customerService';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM: Partial<Customer> = {
  name: '', mobile: '', email: '', business_name: '', gst_number: '',
  type: 'Retail', address: '', status: 'Lead', followup_date: '', notes: '',
};

const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === 'Admin' || user?.role === 'Sales';

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers({
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setCustomers(data);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter, typeFilter]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setForm({ ...c, followup_date: c.followup_date?.split('T')[0] || '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError('');
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, form);
      } else {
        await customerService.createCustomer(form);
      }
      closeModal();
      loadCustomers();
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.join(', ') || err?.response?.data?.message || 'Failed to save customer.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer CRM</h1>
          <div className="page-subtitle">Manage customers and follow-ups</div>
        </div>
        {canEdit && (
          <button id="add-customer-btn" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={15} />
            Add Customer
          </button>
        )}
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: '#94a3b8' }} />
            <input
              id="customer-search"
              className="search-input"
              style={{ paddingLeft: 30 }}
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select id="status-filter" className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select id="type-filter" className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
            {customers.length} record{customers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>No customers found. {canEdit && 'Click "Add Customer" to get started.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Business</th>
                <th>Mobile</th>
                <th>Type</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/customers/${c.id}`} className="link">{c.name}</Link>
                  </td>
                  <td>{c.business_name}</td>
                  <td style={{ color: '#475569' }}>{c.mobile}</td>
                  <td><StatusBadge status={c.type} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>
                    {c.followup_date ? new Date(c.followup_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/customers/${c.id}`} className="btn btn-secondary btn-sm">View</Link>
                      {canEdit && (
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(c)}>Edit</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button id="save-customer-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Add Customer'}
            </button>
          </>
        }
      >
        {formError && <div className="alert alert-error">{formError}</div>}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label required">Customer Name</label>
            <input className="form-control" name="name" value={form.name || ''} onChange={handleChange} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label className="form-label required">Mobile</label>
            <input className="form-control" name="mobile" value={form.mobile || ''} onChange={handleChange} placeholder="+91 98000 00000" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label required">Email</label>
            <input className="form-control" name="email" type="email" value={form.email || ''} onChange={handleChange} placeholder="email@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label required">Business Name</label>
            <input className="form-control" name="business_name" value={form.business_name || ''} onChange={handleChange} placeholder="Company / Shop name" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">GST Number</label>
            <input className="form-control" name="gst_number" value={form.gst_number || ''} onChange={handleChange} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label className="form-label required">Customer Type</label>
            <select className="form-control" name="type" value={form.type || 'Retail'} onChange={handleChange}>
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Distributor">Distributor</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label required">Status</label>
            <select className="form-control" name="status" value={form.status || 'Lead'} onChange={handleChange}>
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Follow-up Date</label>
            <input className="form-control" name="followup_date" type="date" value={form.followup_date || ''} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label required">Address</label>
          <input className="form-control" name="address" value={form.address || ''} onChange={handleChange} placeholder="Full address" />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" name="notes" value={form.notes || ''} onChange={handleChange} placeholder="Optional notes..." rows={2} />
        </div>
      </Modal>
    </div>
  );
};

export default CustomersPage;
