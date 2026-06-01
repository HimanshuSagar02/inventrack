import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import './MonthlyOrders.css';

function MonthlyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const monthlyOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const monthRevenue = monthlyOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const avgOrderValue = monthlyOrders.length ? monthRevenue / monthlyOrders.length : 0;
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Group by day
  const byDay = monthlyOrders.reduce((acc, o) => {
    const day = new Date(o.created_at).getDate();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const peakDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (loading) return <LoadingSpinner text="Loading monthly orders..." />;
  if (error) return <div className="mo-error">⚠️ {error} <button onClick={fetchOrders}>Retry</button></div>;

  return (
    <div className="mo-page">
      {/* Header */}
      <div className="mo-header">
        <div>
          <button className="mo-back" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="page-title">📅 This Month's Orders</h1>
          <p className="page-subtitle">{monthName}</p>
        </div>
        <button className="btn-refresh" onClick={fetchOrders}>↻ Refresh</button>
      </div>

      {/* Summary Cards */}
      <div className="mo-stats-grid">
        <div className="mo-stat-card mo-stat--orders">
          <span className="mo-stat-icon">🛒</span>
          <div className="mo-stat-value">{monthlyOrders.length}</div>
          <div className="mo-stat-label">Orders This Month</div>
        </div>
        <div className="mo-stat-card mo-stat--revenue">
          <span className="mo-stat-icon">💰</span>
          <div className="mo-stat-value">${monthRevenue.toFixed(2)}</div>
          <div className="mo-stat-label">Month Revenue</div>
        </div>
        <div className="mo-stat-card mo-stat--avg">
          <span className="mo-stat-icon">📊</span>
          <div className="mo-stat-value">${avgOrderValue.toFixed(2)}</div>
          <div className="mo-stat-label">Avg. Order Value</div>
        </div>
        <div className="mo-stat-card mo-stat--peak">
          <span className="mo-stat-icon">🏆</span>
          <div className="mo-stat-value">{peakDay ? `Day ${peakDay[0]}` : '—'}</div>
          <div className="mo-stat-label">Peak Day {peakDay ? `(${peakDay[1]} orders)` : ''}</div>
        </div>
      </div>

      {/* Orders List */}
      <div className="mo-section-title">
        <h2>Order Details — {monthlyOrders.length} orders</h2>
      </div>

      {monthlyOrders.length === 0 ? (
        <div className="mo-empty">
          <div style={{ fontSize: '3rem' }}>📭</div>
          <h3>No orders this month yet</h3>
          <p>Orders placed in {monthName} will appear here.</p>
        </div>
      ) : (
        <div className="mo-orders-list">
          {[...monthlyOrders].reverse().map((order, i) => (
            <div key={order.id} className="mo-order-card" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="mo-order-left">
                <span className="mo-order-id">#{order.id}</span>
                <div className="mo-order-customer">{order.customer?.full_name || '—'}</div>
                <div className="mo-order-email">{order.customer?.email}</div>
              </div>
              <div className="mo-order-mid">
                <span className="mo-items-badge">{order.items?.length || 0} items</span>
                <div className="mo-order-date">{formatDate(order.created_at)}</div>
              </div>
              <div className="mo-order-right">
                <span className="mo-order-total">${parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MonthlyOrders;
