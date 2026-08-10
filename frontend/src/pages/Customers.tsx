import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerApi } from '../api';
import { Customer, Pagination as PaginationType } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Eye, Edit2, Trash2, X } from 'lucide-react';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationType | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    mobile_number: '',
    email: '',
    business_name: '',
    gst_number: '',
    customer_type: 'Wholesale',
    address: '',
    status: 'Active',
    follow_up_date: '',
    notes: '',
  });

  const { hasRole } = useAuth();
  const canEdit = hasRole(['Admin', 'Sales']);
  const canDelete = hasRole(['Admin']);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.getCustomers({
        search,
        status: statusFilter,
        type: typeFilter,
        page,
        limit: 10,
      });
      setCustomers(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, typeFilter, page]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      customer_name: '',
      mobile_number: '',
      email: '',
      business_name: '',
      gst_number: '',
      customer_type: 'Wholesale',
      address: '',
      status: 'Active',
      follow_up_date: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customer_name: customer.customer_name,
      mobile_number: customer.mobile_number,
      email: customer.email,
      business_name: customer.business_name,
      gst_number: customer.gst_number || '',
      customer_type: customer.customer_type,
      address: customer.address,
      status: customer.status,
      follow_up_date: customer.follow_up_date ? customer.follow_up_date.split('T')[0] : '',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, formData as any);
      } else {
        await customerApi.createCustomer(formData as any);
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to save customer');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete customer '${name}'?`)) return;
    try {
      await customerApi.deleteCustomer(id);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Customer CRM Directory</h1>
          <p>Manage wholesale buyers, retail leads, distributors, and CRM follow-up schedules</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Add New Customer
          </button>
        )}
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by customer name, business, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '160px' }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Lead">Lead</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          className="form-control"
          style={{ width: '160px' }}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="Wholesale">Wholesale</option>
          <option value="Distributor">Distributor</option>
          <option value="Retail">Retail</option>
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Customer & Business</th>
                <th>Contact Info</th>
                <th>Type</th>
                <th>GST Number</th>
                <th>Status</th>
                <th>Next Follow-up</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading customer data...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{cust.customer_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{cust.business_name}</div>
                    </td>
                    <td>
                      <div>{cust.email}</div>
                      <div className="mono" style={{ fontSize: '12px', color: '#64748b' }}>
                        {cust.mobile_number}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-lead">{cust.customer_type}</span>
                    </td>
                    <td className="mono">{cust.gst_number || 'N/A'}</td>
                    <td>
                      <StatusBadge status={cust.status} />
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {cust.follow_up_date ? new Date(cust.follow_up_date).toLocaleDateString('en-IN') : 'None'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link
                          to={`/customers/${cust.id}`}
                          className="btn btn-secondary btn-sm"
                          title="View Details & Follow-up Log"
                        >
                          <Eye size={14} />
                        </Link>
                        {canEdit && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(cust)}
                            title="Edit Customer"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(cust.id, cust.customer_name)}
                            title="Delete Customer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCustomer ? 'Edit Customer Information' : 'Add New Customer Record'}
              </h3>
              <button
                className="btn btn-secondary btn-sm btn-icon"
                onClick={() => setShowModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Customer Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Business Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Customer Type *</label>
                    <select
                      className="form-control"
                      value={formData.customer_type}
                      onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                    >
                      <option value="Retail">Retail</option>
                      <option value="Wholesale">Wholesale</option>
                      <option value="Distributor">Distributor</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>GST Number (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 27AAACA1080P1ZP"
                      value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status *</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Lead">Lead</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Next Follow-up Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Business Address *</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Notes / Context</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
