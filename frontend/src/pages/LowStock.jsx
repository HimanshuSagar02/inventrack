import React, { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../api';
import { BASE_URL } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import './LowStock.css';

const LOW_STOCK_THRESHOLD = 5;

function LowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'critical' | 'out'

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      const all = Array.isArray(data) ? data : [];
      // Only keep items with quantity < threshold
      setProducts(all.filter((p) => p.quantity < LOW_STOCK_THRESHOLD));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const outOfStock   = products.filter((p) => p.quantity === 0);
  const critical     = products.filter((p) => p.quantity > 0 && p.quantity <= 2);
  const lowStock     = products.filter((p) => p.quantity > 2 && p.quantity < LOW_STOCK_THRESHOLD);

  const displayed =
    filter === 'out'      ? outOfStock :
    filter === 'critical' ? critical   :
    filter === 'low'      ? lowStock   :
    products;

  const getStatusInfo = (qty) => {
    if (qty === 0) return { label: 'Out of Stock', cls: 'status--out',      icon: '🚫' };
    if (qty <= 2)  return { label: 'Critical',     cls: 'status--critical', icon: '🔴' };
    return              { label: 'Low Stock',     cls: 'status--low',      icon: '🟡' };
  };

  const getProgressWidth = (qty) =>
    Math.min(100, (qty / LOW_STOCK_THRESHOLD) * 100);

  if (loading) return <LoadingSpinner text="Checking stock levels..." />;

  return (
    <div className="lowstock-page">
      {/* ── Header ── */}
      <div className="ls-header">
        <div>
          <h1 className="page-title">⚠️ Low Stock Alert</h1>
          <p className="page-subtitle">
            Products with fewer than <strong>{LOW_STOCK_THRESHOLD} units</strong> remaining
          </p>
        </div>
        <button className="btn-refresh" onClick={fetchProducts} title="Refresh">
          ↻ Refresh
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="ls-summary-grid">
        <div className="ls-summary-card ls-summary-card--out" onClick={() => setFilter(filter === 'out' ? 'all' : 'out')}>
          <span className="ls-summary-icon">🚫</span>
          <div>
            <div className="ls-summary-value">{outOfStock.length}</div>
            <div className="ls-summary-label">Out of Stock</div>
          </div>
          {filter === 'out' && <span className="ls-active-dot" />}
        </div>
        <div className="ls-summary-card ls-summary-card--critical" onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')}>
          <span className="ls-summary-icon">🔴</span>
          <div>
            <div className="ls-summary-value">{critical.length}</div>
            <div className="ls-summary-label">Critical (1–2)</div>
          </div>
          {filter === 'critical' && <span className="ls-active-dot" />}
        </div>
        <div className="ls-summary-card ls-summary-card--low" onClick={() => setFilter(filter === 'low' ? 'all' : 'low')}>
          <span className="ls-summary-icon">🟡</span>
          <div>
            <div className="ls-summary-value">{lowStock.length}</div>
            <div className="ls-summary-label">Low (3–4)</div>
          </div>
          {filter === 'low' && <span className="ls-active-dot" />}
        </div>
        <div className="ls-summary-card ls-summary-card--total" onClick={() => setFilter('all')}>
          <span className="ls-summary-icon">📦</span>
          <div>
            <div className="ls-summary-value">{products.length}</div>
            <div className="ls-summary-label">Total Alerts</div>
          </div>
          {filter === 'all' && <span className="ls-active-dot" />}
        </div>
      </div>

      {/* ── Filter label ── */}
      <div className="ls-filter-row">
        <span className="ls-showing">
          Showing <strong>{displayed.length}</strong> product{displayed.length !== 1 ? 's' : ''}
          {filter !== 'all' && (
            <button className="ls-clear-filter" onClick={() => setFilter('all')}>
              Clear filter ✕
            </button>
          )}
        </span>
      </div>

      {/* ── Empty state ── */}
      {products.length === 0 && !error && (
        <div className="ls-empty">
          <div className="ls-empty-icon">✅</div>
          <h2>All stock levels are healthy!</h2>
          <p>No products have fewer than {LOW_STOCK_THRESHOLD} units.</p>
        </div>
      )}

      {error && (
        <div className="ls-error">
          <span>⚠️ {error}</span>
          <button onClick={fetchProducts}>Retry</button>
        </div>
      )}

      {/* ── Product Cards Grid ── */}
      {displayed.length > 0 && (
        <div className="ls-grid">
          {displayed.map((product, i) => {
            const status = getStatusInfo(product.quantity);
            const progress = getProgressWidth(product.quantity);

            return (
              <div
                key={product.id}
                className={`ls-card ${status.cls}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Product Image */}
                <div className="ls-card-image">
                  {product.image_url ? (
                    <img
                      src={`${BASE_URL}${product.image_url}`}
                      alt={product.name}
                      className="ls-product-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="ls-product-img-placeholder"
                    style={{ display: product.image_url ? 'none' : 'flex' }}
                  >
                    📦
                  </div>
                  {/* Status badge on image */}
                  <span className={`ls-status-badge ${status.cls}`}>
                    {status.icon} {status.label}
                  </span>
                </div>

                {/* Card Body */}
                <div className="ls-card-body">
                  <h3 className="ls-product-name" title={product.name}>
                    {product.name}
                  </h3>
                  <span className="ls-sku">SKU: {product.sku}</span>

                  {/* Stock progress bar */}
                  <div className="ls-stock-section">
                    <div className="ls-stock-header">
                      <span className="ls-stock-label">Stock Level</span>
                      <span className={`ls-stock-qty ${status.cls}`}>
                        {product.quantity} / {LOW_STOCK_THRESHOLD}
                      </span>
                    </div>
                    <div className="ls-progress-bar">
                      <div
                        className={`ls-progress-fill ${status.cls}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer: price */}
                  <div className="ls-card-footer">
                    <span className="ls-price">${parseFloat(product.price).toFixed(2)}</span>
                    <span className="ls-reorder-hint">
                      {product.quantity === 0 ? 'Reorder immediately' :
                       product.quantity <= 2  ? 'Reorder urgently' :
                       'Reorder soon'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LowStock;
