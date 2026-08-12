import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { Product, StockMovement } from '../types';
import * as productService from '../services/productService';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const EMPTY_PRODUCT = {
  name: '', sku: '', category: '', unit_price: 0, current_stock: 0, min_stock_alert: 5, location: '',
};

const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [movForm, setMovForm] = useState({ quantity: 1, movement_type: 'IN' as 'IN' | 'OUT', reason: '' });
  const [movError, setMovError] = useState('');
  const [movSaving, setMovSaving] = useState(false);

  const [isAllMovementsOpen, setIsAllMovementsOpen] = useState(false);

  const canEdit = user?.role === 'Admin' || user?.role === 'Warehouse';

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts({
        search: search || undefined,
        category: categoryFilter || undefined,
      });
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, [search, categoryFilter]);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_PRODUCT);
    setFormError('');
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, sku: p.sku, category: p.category,
      unit_price: p.unit_price, current_stock: p.current_stock,
      min_stock_alert: p.min_stock_alert, location: p.location,
    });
    setFormError('');
    setIsProductModalOpen(true);
  };

  const handleProductSave = async () => {
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        unit_price: Number(form.unit_price),
        current_stock: Number(form.current_stock),
        min_stock_alert: Number(form.min_stock_alert),
      };
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, payload);
      } else {
        await productService.createProduct(payload);
      }
      setIsProductModalOpen(false);
      loadProducts();
    } catch (err: any) {
      setFormError(err?.response?.data?.errors?.join(', ') || err?.response?.data?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const openMovementModal = async (p: Product) => {
    setMovementProduct(p);
    setMovForm({ quantity: 1, movement_type: 'IN', reason: '' });
    setMovError('');
    setMovementsLoading(true);
    setIsMovementModalOpen(true);
    try {
      const data = await productService.getStockMovements(p.id);
      setMovements(data);
    } finally {
      setMovementsLoading(false);
    }
  };

  const handleAddMovement = async () => {
    if (!movementProduct) return;
    if (!movForm.reason.trim()) { setMovError('Reason is required.'); return; }
    setMovSaving(true);
    setMovError('');
    try {
      await productService.addStockMovement({
        product_id: movementProduct.id,
        quantity: Number(movForm.quantity),
        movement_type: movForm.movement_type,
        reason: movForm.reason,
      });
      const updated = await productService.getProducts({ search: search || undefined, category: categoryFilter || undefined });
      setProducts(updated);
      const data = await productService.getStockMovements(movementProduct.id);
      setMovements(data);
      setMovForm({ quantity: 1, movement_type: 'IN', reason: '' });
    } catch (err: any) {
      setMovError(err?.response?.data?.message || 'Failed to record movement.');
    } finally {
      setMovSaving(false);
    }
  };

  const openAllMovements = async () => {
    setMovementsLoading(true);
    setIsAllMovementsOpen(true);
    try {
      const data = await productService.getStockMovements();
      setMovements(data);
    } finally {
      setMovementsLoading(false);
    }
  };

  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product and Inventory</h1>
          <div className="page-subtitle">Manage products and track stock</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button id="all-movements-btn" className="btn btn-secondary" onClick={openAllMovements}>
            Stock Movements Log
          </button>
          {canEdit && (
            <button id="add-product-btn" className="btn btn-primary" onClick={openAddModal}>
              <Plus size={15} /> Add Product
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: '#94a3b8' }} />
            <input
              id="product-search"
              className="search-input"
              style={{ paddingLeft: 30 }}
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select id="category-filter" className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>No products found. {canEdit && 'Click "Add Product" to get started.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Current Stock</th>
                <th>Min. Stock</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.current_stock <= p.min_stock_alert;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: '#64748b', fontSize: 12.5, fontFamily: 'monospace' }}>{p.sku}</td>
                    <td>{p.category}</td>
                    <td>₹{Number(p.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: isLow ? '#dc2626' : '#0f172a' }}>{p.current_stock}</span>
                      {isLow && <span className="badge badge-low-stock" style={{ marginLeft: 6 }}>Low</span>}
                    </td>
                    <td style={{ color: '#64748b' }}>{p.min_stock_alert}</td>
                    <td style={{ color: '#64748b', fontSize: 12.5 }}>{p.location}</td>
                    <td>
                      <div className="table-actions">
                        {canEdit && <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(p)}>Edit</button>}
                        <button className="btn btn-secondary btn-sm" onClick={() => openMovementModal(p)}>Stock</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</button>
            <button id="save-product-btn" className="btn btn-primary" onClick={handleProductSave} disabled={saving}>
              {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </>
        }
      >
        {formError && <div className="alert alert-error">{formError}</div>}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label required">Product Name</label>
            <input className="form-control" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Product name" />
          </div>
          <div className="form-group">
            <label className="form-label required">SKU / Code</label>
            <input className="form-control" value={form.sku} onChange={e => setForm(f => ({...f, sku: e.target.value}))} placeholder="e.g. ELEC-CB-032" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label required">Category</label>
            <input className="form-control" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} placeholder="e.g. Electrical" />
          </div>
          <div className="form-group">
            <label className="form-label required">Unit Price (₹)</label>
            <input className="form-control" type="number" min="0" step="0.01" value={form.unit_price} onChange={e => setForm(f => ({...f, unit_price: Number(e.target.value)}))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label required">Current Stock</label>
            <input className="form-control" type="number" min="0" value={form.current_stock} onChange={e => setForm(f => ({...f, current_stock: Number(e.target.value)}))} />
          </div>
          <div className="form-group">
            <label className="form-label required">Min. Stock Alert</label>
            <input className="form-control" type="number" min="0" value={form.min_stock_alert} onChange={e => setForm(f => ({...f, min_stock_alert: Number(e.target.value)}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label required">Warehouse Location</label>
          <input className="form-control" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="e.g. Warehouse A - Bay 3" />
        </div>
      </Modal>

      {/* Stock Movement Modal (per product) */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title={`Stock: ${movementProduct?.name || ''}`}
        size="lg"
      >
        {movementProduct && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 5, border: '1px solid #e2e8f0' }}>
              <div><span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block' }}>SKU</span><span style={{ fontFamily: 'monospace', fontSize: 13 }}>{movementProduct.sku}</span></div>
              <div><span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block' }}>Current Stock</span><span style={{ fontWeight: 700, fontSize: 16, color: movementProduct.current_stock <= movementProduct.min_stock_alert ? '#dc2626' : '#0f172a' }}>{products.find(p => p.id === movementProduct.id)?.current_stock ?? movementProduct.current_stock}</span></div>
              <div><span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block' }}>Min. Alert</span><span style={{ fontSize: 13 }}>{movementProduct.min_stock_alert}</span></div>
              <div><span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block' }}>Location</span><span style={{ fontSize: 13 }}>{movementProduct.location}</span></div>
            </div>

            {canEdit && (
              <div style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: 5, marginBottom: 16, background: '#fff' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Record Movement</div>
                {movError && <div className="alert alert-error">{movError}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Movement Type</label>
                    <select className="form-control" value={movForm.movement_type} onChange={e => setMovForm(f => ({...f, movement_type: e.target.value as 'IN' | 'OUT'}))}>
                      <option value="IN">IN (Stock Received)</option>
                      <option value="OUT">OUT (Stock Dispatched)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Quantity</label>
                    <input className="form-control" type="number" min="1" value={movForm.quantity} onChange={e => setMovForm(f => ({...f, quantity: Number(e.target.value)}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label required">Reason</label>
                  <input className="form-control" value={movForm.reason} onChange={e => setMovForm(f => ({...f, reason: e.target.value}))} placeholder="e.g. Received from supplier / Manual adjustment" />
                </div>
                <button id="save-movement-btn" className="btn btn-primary btn-sm" onClick={handleAddMovement} disabled={movSaving}>
                  {movSaving ? 'Recording...' : 'Record Movement'}
                </button>
              </div>
            )}

            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Movement History</div>
            {movementsLoading ? (
              <div className="loading-spinner" style={{ padding: '20px 0' }}>Loading...</div>
            ) : movements.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}><p>No movements recorded.</p></div>
            ) : (
              <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 5 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Reason</th>
                      <th>By</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id}>
                        <td><StatusBadge status={m.movement_type} /></td>
                        <td style={{ fontWeight: 600 }}>{m.quantity}</td>
                        <td style={{ maxWidth: 200, fontSize: 12.5 }}>{m.reason}</td>
                        <td style={{ color: '#64748b', fontSize: 12 }}>{m.created_by_name}</td>
                        <td style={{ color: '#64748b', fontSize: 12 }}>
                          {new Date(m.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* All Stock Movements Modal */}
      <Modal
        isOpen={isAllMovementsOpen}
        onClose={() => setIsAllMovementsOpen(false)}
        title="Stock Movements Log"
        size="lg"
      >
        {movementsLoading ? (
          <div className="loading-spinner">Loading...</div>
        ) : movements.length === 0 ? (
          <div className="empty-state"><p>No stock movements recorded.</p></div>
        ) : (
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Reason</th>
                  <th>Created By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{m.product_name}</div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', fontFamily: 'monospace' }}>{m.product_sku}</div>
                    </td>
                    <td><StatusBadge status={m.movement_type} /></td>
                    <td style={{ fontWeight: 600 }}>{m.quantity}</td>
                    <td style={{ fontSize: 12.5 }}>{m.reason}</td>
                    <td style={{ color: '#64748b', fontSize: 12.5 }}>{m.created_by_name}</td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>
                      {new Date(m.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductsPage;
