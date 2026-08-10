import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { stockApi, productApi } from '../api';
import { StockMovement, Product, Pagination as PaginationType } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { Plus, ArrowDownRight, ArrowUpRight, X, AlertCircle } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get('productId') || '';

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationType | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [movementTypeFilter, setMovementTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal State for Manual Adjustment
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [adjData, setAdjData] = useState({
    product_id: '',
    quantity_changed: 1,
    movement_type: 'IN' as 'IN' | 'OUT',
    reason: '',
  });

  const { hasRole } = useAuth();
  const canAdjust = hasRole(['Admin', 'Warehouse']);

  const fetchMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await stockApi.getAllStockMovements({
        product_id: selectedProductId || undefined,
        movement_type: movementTypeFilter || undefined,
        page,
        limit: 15,
      });
      setMovements(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load stock movement log');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsList = async () => {
    try {
      const res = await productApi.getProducts({ limit: 100 });
      setProducts(res.data);
      if (res.data.length > 0 && !adjData.product_id) {
        setAdjData((prev) => ({ ...prev, product_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load products list for dropdown');
    }
  };

  useEffect(() => {
    fetchProductsList();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [selectedProductId, movementTypeFilter, page]);

  const handleOpenModal = () => {
    setModalError(null);
    setAdjData({
      product_id: products.length > 0 ? products[0].id : '',
      quantity_changed: 1,
      movement_type: 'IN',
      reason: 'Vendor Inward Receiving',
    });
    setShowModal(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!adjData.product_id) {
      setModalError('Please select a target product.');
      return;
    }

    try {
      await productApi.addStockMovement(adjData.product_id, {
        quantity_changed: Number(adjData.quantity_changed),
        movement_type: adjData.movement_type,
        reason: adjData.reason,
      });

      setShowModal(false);
      fetchMovements();
    } catch (err: any) {
      setModalError(err.message || 'Failed to apply stock movement adjustment');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Stock Movement Log</h1>
        </div>
        {canAdjust && (
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={16} /> Record Stock Movement
          </button>
        )}
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar">
        <select
          className="form-control"
          style={{ width: '280px' }}
          value={selectedProductId}
          onChange={(e) => {
            setSelectedProductId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Inventory Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.product_name} ({p.sku})
            </option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: '180px' }}
          value={movementTypeFilter}
          onChange={(e) => {
            setMovementTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Movement Types</option>
          <option value="IN">Stock IN (Receiving)</option>
          <option value="OUT">Stock OUT (Dispatch)</option>
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Audit Log Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product & SKU</th>
                <th>Movement Type</th>
                <th>Quantity Changed</th>
                <th>Reason / Reference</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading stock movements...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No stock movement audit records found.
                  </td>
                </tr>
              ) : (
                movements.map((sm) => (
                  <tr key={sm.id}>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(sm.created_at).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{sm.product_name}</div>
                      <div className="mono" style={{ fontSize: '11px', color: '#64748b' }}>
                        {sm.sku}
                      </div>
                    </td>
                    <td>
                      {sm.movement_type === 'IN' ? (
                        <span className="badge badge-active" style={{ gap: 4 }}>
                          <ArrowDownRight size={14} /> Stock IN
                        </span>
                      ) : (
                        <span className="badge badge-inactive" style={{ gap: 4 }}>
                          <ArrowUpRight size={14} /> Stock OUT
                        </span>
                      )}
                    </td>
                    <td className="mono font-bold" style={{ fontSize: '14px' }}>
                      {sm.movement_type === 'IN' ? `+${sm.quantity_changed}` : `-${sm.quantity_changed}`}
                    </td>
                    <td style={{ fontSize: '13px' }}>{sm.reason}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {sm.created_by_name || 'System'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />

      {/* Manual Adjustment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Record Manual Stock Adjustment</h3>
              <button
                className="btn btn-secondary btn-sm btn-icon"
                onClick={() => setShowModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label>Select Target Product *</label>
                  <select
                    className="form-control"
                    value={adjData.product_id}
                    onChange={(e) => setAdjData({ ...adjData, product_id: e.target.value })}
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name} ({p.sku}) — Available Stock: {p.current_stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Movement Direction *</label>
                    <select
                      className="form-control"
                      value={adjData.movement_type}
                      onChange={(e) =>
                        setAdjData({ ...adjData, movement_type: e.target.value as 'IN' | 'OUT' })
                      }
                    >
                      <option value="IN">Stock IN (Inward Batch Receiving)</option>
                      <option value="OUT">Stock OUT (Manual Deduction / Damaged)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control mono"
                      value={adjData.quantity_changed}
                      onChange={(e) =>
                        setAdjData({ ...adjData, quantity_changed: parseInt(e.target.value, 10) || 1 })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Reason / Audit Note *</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Vendor Inward Shipment #4410, Physical Audit Reconciliation, Damaged goods removal..."
                    value={adjData.reason}
                    onChange={(e) => setAdjData({ ...adjData, reason: e.target.value })}
                    required
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
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
