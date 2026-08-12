import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import type { Customer, Product } from '../types';
import * as customerService from '../services/customerService';
import * as productService from '../services/productService';
import * as challanService from '../services/challanService';

interface ChallanItemRow {
  product_id: number;
  product: Product | null;
  quantity: number;
}

const CreateChallanPage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>('');
  const [items, setItems] = useState<ChallanItemRow[]>([{ product_id: 0, product: null, quantity: 1 }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      customerService.getCustomers({ status: 'Active' }),
      productService.getProducts(),
    ]).then(([c, p]) => {
      setCustomers(c);
      setProducts(p);
    });
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, { product_id: 0, product: null, quantity: 1 }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, productId: number) => {
    const product = products.find((p) => p.id === productId) || null;
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, product_id: productId, product } : item));
  };

  const updateQty = (idx: number, qty: number) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, qty) } : item));
  };

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => {
    if (!item.product) return sum;
    return sum + Number(item.product.unit_price) * item.quantity;
  }, 0);

  const handleSubmit = async (status: 'Draft' | 'Confirmed') => {
    setError('');

    if (!selectedCustomer) {
      setError('Please select a customer.');
      return;
    }

    const validItems = items.filter((i) => i.product_id > 0);
    if (validItems.length === 0) {
      setError('Please add at least one product.');
      return;
    }

    // Client-side stock check for Confirmed
    if (status === 'Confirmed') {
      for (const item of validItems) {
        if (item.product && item.quantity > item.product.current_stock) {
          setError(
            `Insufficient stock for product '${item.product.name}' (SKU: ${item.product.sku}). Available: ${item.product.current_stock}, Requested: ${item.quantity}.`
          );
          return;
        }
      }
    }

    setLoading(true);
    try {
      const challan = await challanService.createChallan({
        customer_id: Number(selectedCustomer),
        status,
        items: validItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      navigate(`/challans/${challan.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create challan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="breadcrumb">
        <a href="/challans">Sales Challan</a>
        <span>/</span>
        <span>Create Challan</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Create Sales Challan</h1>
          <div className="page-subtitle">Select customer and add products</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Customer Selection */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label required">Customer</label>
          <select
            id="challan-customer-select"
            className="form-control"
            style={{ maxWidth: 400 }}
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">— Select Customer —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.business_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Products</div>
          <button id="add-product-row-btn" className="btn btn-secondary btn-sm" onClick={addItem}>
            <Plus size={13} /> Add Product
          </button>
        </div>

        <div className="challan-items-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Available Stock</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Line Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const isLow = item.product && item.quantity > item.product.current_stock;
                return (
                  <tr key={idx}>
                    <td>
                      <select
                        id={`product-select-${idx}`}
                        className="form-control"
                        style={{ minWidth: 220 }}
                        value={item.product_id || ''}
                        onChange={(e) => updateItem(idx, Number(e.target.value))}
                      >
                        <option value="">— Select Product —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ fontSize: 12.5, color: '#64748b', fontFamily: 'monospace' }}>
                      {item.product?.sku || '—'}
                    </td>
                    <td>
                      {item.product ? (
                        <span style={{ fontWeight: 600, color: isLow ? '#dc2626' : '#16a34a' }}>
                          {item.product.current_stock}
                          {isLow && <span style={{ fontSize: 11, marginLeft: 4, color: '#dc2626' }}>⚠ Low</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {item.product ? `₹${Number(item.product.unit_price).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td>
                      <input
                        id={`qty-input-${idx}`}
                        type="number"
                        min="1"
                        className={`form-control${isLow ? ' error' : ''}`}
                        style={{ width: 80 }}
                        value={item.quantity}
                        onChange={(e) => updateQty(idx, Number(e.target.value))}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {item.product
                        ? `₹${(Number(item.product.unit_price) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td>
                      {items.length > 1 && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => removeItem(idx)}
                          title="Remove row"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="challan-summary">
          <div className="challan-summary-item">
            <span className="challan-summary-label">Total Products</span>
            <span className="challan-summary-value">{items.filter(i => i.product_id > 0).length}</span>
          </div>
          <div className="challan-summary-item">
            <span className="challan-summary-label">Total Quantity</span>
            <span className="challan-summary-value">{totalQty}</span>
          </div>
          <div className="challan-summary-item">
            <span className="challan-summary-label">Total Amount</span>
            <span className="challan-summary-value">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/challans')} disabled={loading}>
            Cancel
          </button>
          <button
            id="save-draft-btn"
            className="btn btn-secondary"
            onClick={() => handleSubmit('Draft')}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            id="confirm-challan-btn"
            className="btn btn-success"
            onClick={() => handleSubmit('Confirmed')}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Challan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateChallanPage;
