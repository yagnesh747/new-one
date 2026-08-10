import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../api';
import { Product, Pagination as PaginationType } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, AlertTriangle, Edit2, Boxes, X } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationType | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    category: 'Hardware',
    unit_price: 100,
    current_stock: 10,
    min_stock_alert: 5,
    location: '',
  });

  const { hasRole } = useAuth();
  const canEdit = hasRole(['Admin', 'Warehouse']);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productApi.getProducts({
        search,
        category: categoryFilter,
        lowStock: lowStockFilter,
        page,
        limit: 10,
      });
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, lowStockFilter, page]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      product_name: '',
      sku: '',
      category: 'Hardware',
      unit_price: 100,
      current_stock: 10,
      min_stock_alert: 5,
      location: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      sku: product.sku,
      category: product.category,
      unit_price: product.unit_price,
      current_stock: product.current_stock,
      min_stock_alert: product.min_stock_alert,
      location: product.location || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, formData as any);
      } else {
        await productApi.createProduct(formData as any);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Product and Inventory</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/inventory" className="btn btn-secondary">
            <Boxes size={16} /> Stock Movement Log
          </Link>
          {canEdit && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by product name, SKU, or category..."
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
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          <option value="Hardware">Hardware</option>
          <option value="Power Tools">Power Tools</option>
          <option value="Safety Equipment">Safety Equipment</option>
          <option value="Electronics">Electronics</option>
          <option value="Heavy Equipment">Heavy Equipment</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={lowStockFilter}
            onChange={(e) => {
              setLowStockFilter(e.target.checked);
              setPage(1);
            }}
          />
          <span style={{ color: lowStockFilter ? '#dc2626' : '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={14} /> Low Stock Warning Only
          </span>
        </label>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU Code</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Current Stock</th>
                <th>Min Alert Qty</th>
                <th>Warehouse Location</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isLowStock = prod.current_stock <= prod.min_stock_alert;

                  return (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{prod.product_name}</div>
                      </td>
                      <td className="mono font-bold">{prod.sku}</td>
                      <td>{prod.category}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        ₹{prod.unit_price.toFixed(2)}
                      </td>
                      <td>
                        <span className="mono font-bold" style={{ fontSize: '14px', marginRight: 6 }}>
                          {prod.current_stock}
                        </span>
                        {isLowStock && <StatusBadge status="Low Stock" />}
                      </td>
                      <td className="mono">{prod.min_stock_alert}</td>
                      <td style={{ fontSize: '12px' }}>{prod.location || 'Unassigned'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Link
                            to={`/inventory?productId=${prod.id}`}
                            className="btn btn-secondary btn-sm"
                            title="View Stock Movement History"
                          >
                            <Boxes size={14} /> History
                          </Link>
                          {canEdit && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEdit(prod)}
                              title="Edit Product Details"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? 'Edit Product Configuration' : 'Add New Inventory Product'}
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
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>SKU Code *</label>
                    <input
                      type="text"
                      className="form-control mono"
                      placeholder="e.g. PWR-DRL-800"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Hardware, Power Tools"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Unit Selling Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control mono"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Stock Qty *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control mono"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value, 10) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Min Stock Alert Level *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control mono"
                      value={formData.min_stock_alert}
                      onChange={(e) => setFormData({ ...formData, min_stock_alert: parseInt(e.target.value, 10) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Warehouse Rack / Location</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Aisle 3 - Shelf B"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
