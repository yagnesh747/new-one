import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerApi, productApi, challanApi } from '../api';
import { Customer, Product } from '../types';
import { ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SelectedLineItem {
  product_id: string;
  quantity: number;
}

export const CreateChallan: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SelectedLineItem[]>([
    { product_id: '', quantity: 1 },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          customerApi.getCustomers({ limit: 100 }),
          productApi.getProducts({ limit: 100 }),
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data);

        if (custRes.data.length > 0) {
          setCustomerId(custRes.data[0].id);
        }
        if (prodRes.data.length > 0) {
          setItems([{ product_id: prodRes.data[0].id, quantity: 1 }]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize create challan form');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleAddItem = () => {
    const defaultProdId = products.length > 0 ? products[0].id : '';
    setItems([...items, { product_id: defaultProdId, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const newItems = [...items];
    newItems[index].product_id = prodId;
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, qty);
    setItems(newItems);
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.product_id);
      if (!prod) return sum;
      return sum + prod.unit_price * item.quantity;
    }, 0);
  };

  const calculateTotalQuantity = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSave = async (confirmImmediately: boolean) => {
    setError(null);
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    if (items.some((it) => !it.product_id || it.quantity <= 0)) {
      setError('All challan line items must have a selected product and quantity >= 1.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await challanApi.createChallan({
        customer_id: customerId,
        notes,
        items,
        confirm_immediately: confirmImmediately,
      });

      navigate(`/challans/${res.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create sales challan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container">Initializing sales challan builder...</div>;
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16 }}>
        <Link to="/challans" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Sales Challans
        </Link>
      </div>

      <div className="page-header">
        <div className="page-header-text">
          <h1>Create New Sales Challan</h1>
          <p>Generate a new wholesale sales challan with snapshot product pricing and stock verification</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <div className="card-title">Challan Header Details</div>
        <div className="form-row">
          <div className="form-group">
            <label>Select Customer *</label>
            <select
              className="form-control"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name} — {c.business_name} ({c.customer_type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Internal Notes / Dispatch Instructions</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Delivery via Express Cargo, Payment terms Net 30"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Line Items Table Builder */}
      <div className="card">
        <div className="card-title">
          <span>Challan Product Line Items</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
            <Plus size={14} /> Add Product Line
          </button>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Product Selection</th>
                <th>SKU</th>
                <th>Unit Price</th>
                <th>Available Stock</th>
                <th style={{ width: '120px' }}>Quantity</th>
                <th>Line Total</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const selectedProd = products.find((p) => p.id === item.product_id);
                const unitPrice = selectedProd ? selectedProd.unit_price : 0;
                const stock = selectedProd ? selectedProd.current_stock : 0;
                const isStockInsufficient = selectedProd ? item.quantity > stock : false;
                const lineTotal = unitPrice * item.quantity;

                return (
                  <tr key={idx}>
                    <td>
                      <select
                        className="form-control"
                        value={item.product_id}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.product_name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="mono font-bold">{selectedProd?.sku || '-'}</td>
                    <td className="mono">₹{unitPrice.toFixed(2)}</td>
                    <td>
                      <span className="mono font-bold" style={{ color: isStockInsufficient ? '#dc2626' : '#16a34a' }}>
                        {stock} units
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="form-control mono"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value, 10) || 1)}
                      />
                    </td>
                    <td className="mono font-bold">₹{lineTotal.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm btn-icon"
                        disabled={items.length <= 1}
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '2px solid #e2e8f0',
          }}
        >
          <div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Total Quantity: </span>
            <span className="mono font-bold" style={{ fontSize: '16px', color: '#0f172a' }}>
              {calculateTotalQuantity()} units
            </span>
          </div>
          <div>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Grand Total Amount: </span>
            <span className="mono font-bold" style={{ fontSize: '22px', color: '#2563eb', marginLeft: '8px' }}>
              ₹{calculateGrandTotal().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={submitting}
          onClick={() => handleSave(false)}
        >
          Save as Draft
        </button>

        <button
          type="button"
          className="btn btn-success"
          disabled={submitting}
          onClick={() => handleSave(true)}
        >
          <CheckCircle2 size={16} /> Confirm Challan & Reduce Stock
        </button>
      </div>
    </div>
  );
};
