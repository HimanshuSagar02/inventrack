import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  getOrders,
  createOrder,
  deleteOrder,
  getCustomers,
  getProducts,
} from '../api';
import { BASE_URL } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Create order modal
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: '' }]);
  const [submitting, setSubmitting] = useState(false);

  // View order modal
  const [viewOrder, setViewOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [custData, prodData] = await Promise.all([getCustomers(), getProducts()]);
      setCustomers(Array.isArray(custData) ? custData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (err) {
      // silent — dropdown data errors will show when modal opens
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchDropdownData();
  }, [fetchOrders, fetchDropdownData]);

  // ── Create Order Logic ──
  const openCreate = () => {
    setSelectedCustomer('');
    setItems([{ product_id: '', quantity: '' }]);
    fetchDropdownData();
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setSelectedCustomer('');
    setItems([{ product_id: '', quantity: '' }]);
  };

  const addItem = () => {
    setItems((prev) => [...prev, { product_id: '', quantity: '' }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const getProductById = (id) =>
    products.find((p) => (p.id || p._id) === parseInt(id));

  const calculatedTotal = items.reduce((sum, item) => {
    const product = getProductById(item.product_id);
    const qty = parseInt(item.quantity) || 0;
    return sum + (product ? product.price * qty : 0);
  }, 0);

  const validateOrder = () => {
    if (!selectedCustomer) return 'Please select a customer';
    for (let i = 0; i < items.length; i++) {
      if (!items[i].product_id) return `Please select a product for item #${i + 1}`;
      const qty = parseInt(items[i].quantity);
      if (!qty || qty <= 0) return `Quantity must be greater than 0 for item #${i + 1}`;
      const product = getProductById(items[i].product_id);
      if (product && qty > product.quantity) {
        return `Insufficient stock for "${product.name}" (available: ${product.quantity})`;
      }
    }
    return null;
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const err = validateOrder();
    if (err) { toast.error(err); return; }

    const payload = {
      customer_id: parseInt(selectedCustomer),
      items: items.map((item) => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
      })),
    };

    setSubmitting(true);
    try {
      await createOrder(payload);
      toast.success('Order created successfully');
      closeCreate();
      fetchOrders();
      fetchDropdownData();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Order ──
  const handleDelete = async (order) => {
    if (!window.confirm(`Delete Order #${order.id}? Stock will be restored.`)) return;
    try {
      await deleteOrder(order.id || order._id);
      toast.success('Order deleted — stock restored');
      fetchOrders();
      fetchDropdownData();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Delete failed');
    }
  };

  // ── View Order ──
  const openView = (order) => setViewOrder(order);
  const closeView = () => setViewOrder(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'id',
      label: 'Order #',
      render: (val) => <span className="order-id">#{val}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (val) => val?.full_name || '—',
    },
    {
      key: 'items',
      label: 'Items',
      render: (val) => (
        <span className="items-count">{Array.isArray(val) ? val.length : 0} items</span>
      ),
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (val) => (
        <span className="total-amount">${parseFloat(val).toFixed(2)}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => formatDate(val),
    },
  ];

  const filteredOrders = orders.filter((o) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const orderIdStr = o.id?.toString() || '';
    const matchesId = orderIdStr.includes(query) || `#${orderIdStr}`.includes(query);

    const matchesCustomer =
      o.customer?.full_name?.toLowerCase().includes(query) ||
      o.customer?.email?.toLowerCase().includes(query);

    const matchesTotal = o.total_amount?.toString().includes(query);

    return matchesId || matchesCustomer || matchesTotal;
  });

  if (loading) return <LoadingSpinner text="Loading orders..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOrders} />;

  return (
    <div className="orders-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage customer orders</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Create Order
        </button>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by customer, email, order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" type="button" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        emptyMessage="No orders match your search."
        actions={(row) => (
          <>
            <button className="action-btn action-btn-view" onClick={() => openView(row)}>
              👁️ View
            </button>
            <button className="action-btn action-btn-delete" onClick={() => handleDelete(row)}>
              🗑️ Delete
            </button>
          </>
        )}
      />

      {/* ── Create Order Modal ── */}
      <Modal isOpen={createOpen} onClose={closeCreate} title="Create Order">
        <form onSubmit={handleCreateOrder}>
          <div className="form-group">
            <label htmlFor="customer-select">Customer</label>
            <select
              id="customer-select"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              required
            >
              <option value="">— Select a customer —</option>
              {customers.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="order-items-section">
            <div className="items-header">
              <label>Order Items</label>
              <button type="button" className="btn-add-item" onClick={addItem}>
                + Add Item
              </button>
            </div>

            {items.map((item, index) => {
              const selectedProduct = getProductById(item.product_id);
              return (
                <div className="order-item-row" key={index}>
                  {/* Product image preview */}
                  <div className="item-image-preview">
                    {selectedProduct?.image_url ? (
                      <img
                        src={selectedProduct.image_url.startsWith('http') ? selectedProduct.image_url : `${BASE_URL}${selectedProduct.image_url}`}
                        alt={selectedProduct.name}
                        className="order-product-thumb"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div
                      className="order-product-placeholder"
                      style={{ display: selectedProduct?.image_url ? 'none' : 'flex' }}
                    >
                      📦
                    </div>
                  </div>

                  {/* Product selector + stock badge */}
                  <div className="item-product">
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                      required
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id || p._id} value={p.id || p._id}>
                          {p.name} — ${p.price.toFixed(2)} (Stock: {p.quantity})
                        </option>
                      ))}
                    </select>
                    {selectedProduct && (
                      <div className="product-meta">
                        <span className="product-price-badge">${selectedProduct.price.toFixed(2)} each</span>
                        <span className={`stock-badge ${selectedProduct.quantity < 10 ? 'stock-low' : 'stock-ok'}`}>
                          {selectedProduct.quantity} in stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quantity — no spinners */}
                  <div className="item-quantity">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="item-subtotal">
                    {item.product_id && item.quantity ? (
                      <span className="subtotal-text">
                        ${(
                          (getProductById(item.product_id)?.price || 0) *
                          (parseInt(item.quantity) || 0)
                        ).toFixed(2)}
                      </span>
                    ) : (
                      <span className="subtotal-text text-muted">$0.00</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-remove-item"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <div className="order-total-row">
            <span className="total-label">Estimated Total:</span>
            <span className="total-value">${calculatedTotal.toFixed(2)}</span>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={closeCreate}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── View Order Modal ── */}
      <Modal
        isOpen={!!viewOrder}
        onClose={closeView}
        title={viewOrder ? `Order #${viewOrder.id}` : 'Order Details'}
      >
        {viewOrder && (
          <div className="order-details">
            <div className="detail-section">
              <h3 className="detail-heading">Customer</h3>
              <div className="detail-card">
                <p><strong>{viewOrder.customer?.full_name || '—'}</strong></p>
                <p className="detail-muted">{viewOrder.customer?.email}</p>
                {viewOrder.customer?.phone && (
                  <p className="detail-muted">{viewOrder.customer?.phone}</p>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h3 className="detail-heading">Items</h3>
              <div className="detail-items-list">
                {(viewOrder.items || []).map((item, i) => (
                  <div className="detail-item-card" key={i}>
                    {/* Product image in view modal */}
                    <div className="detail-item-image">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url.startsWith('http') ? item.product.image_url : `${BASE_URL}${item.product.image_url}`}
                          alt={item.product?.name}
                          className="detail-product-thumb"
                          onError={(e) => { e.target.style.display='none'; }}
                        />
                      ) : (
                        <div className="detail-product-placeholder">📦</div>
                      )}
                    </div>
                    <div className="detail-item-info">
                      <span className="detail-item-name">
                        {item.product?.name || `Product #${item.product_id}`}
                      </span>
                      <span className="detail-item-meta">
                        {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
                      </span>
                    </div>
                    <div className="detail-item-subtotal">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-total">
              <span>Total Amount</span>
              <span className="detail-total-value">
                ${parseFloat(viewOrder.total_amount).toFixed(2)}
              </span>
            </div>

            <div className="detail-date">
              Placed on {formatDate(viewOrder.created_at)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Orders;
