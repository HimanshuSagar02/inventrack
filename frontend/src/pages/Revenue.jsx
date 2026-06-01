import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { getOrders, getAnalytics } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import './Revenue.css';

function Revenue() {
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordData, analyticsData] = await Promise.all([getOrders(), getAnalytics()]);
      setOrders(Array.isArray(ordData) ? ordData : []);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = analytics?.total_revenue || 0;
  const thisMonthRevenue = analytics?.revenue_this_month || 0;
  const ordersThisMonth = analytics?.orders_this_month || 0;

  const avgOrderValue = orders.length
    ? orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0) / orders.length
    : 0;

  const now = new Date();
  const lastMonthRevenue = orders
    .filter((o) => {
      const d = new Date(o.created_at);
      return d.getMonth() === (now.getMonth() - 1 + 12) % 12 && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  const monthGrowth = lastMonthRevenue > 0
    ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : null;

  const revenueData = (analytics?.daily_revenue || []).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const topProducts = (analytics?.top_products || []).slice(0, 8);

  const RevenueTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="rv-tooltip">
          <p className="rv-tooltip-label">{label}</p>
          <p style={{ color: '#0ea5e9' }}>Revenue: ${payload[0]?.value?.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <LoadingSpinner text="Loading revenue data..." />;
  if (error) return <div className="rv-error">⚠️ {error} <button onClick={fetchData}>Retry</button></div>;

  return (
    <div className="rv-page">
      {/* Header */}
      <div className="rv-header">
        <div>
          <button className="mo-back" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="page-title">💰 Total Revenue</h1>
          <p className="page-subtitle">Complete revenue analytics & breakdown</p>
        </div>
        <button className="btn-refresh" onClick={fetchData}>↻ Refresh</button>
      </div>

      {/* Stats Grid */}
      <div className="rv-stats-grid">
        <div className="rv-stat-card rv-stat--total">
          <div className="rv-stat-icon">💰</div>
          <div className="rv-stat-value">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="rv-stat-label">Total Revenue (All Time)</div>
        </div>
        <div className="rv-stat-card rv-stat--month">
          <div className="rv-stat-icon">📅</div>
          <div className="rv-stat-value">${thisMonthRevenue.toFixed(2)}</div>
          <div className="rv-stat-label">
            This Month
            {monthGrowth !== null && (
              <span className={`rv-growth ${parseFloat(monthGrowth) >= 0 ? 'rv-growth--up' : 'rv-growth--down'}`}>
                {parseFloat(monthGrowth) >= 0 ? '▲' : '▼'} {Math.abs(monthGrowth)}%
              </span>
            )}
          </div>
        </div>
        <div className="rv-stat-card rv-stat--avg">
          <div className="rv-stat-icon">📊</div>
          <div className="rv-stat-value">${avgOrderValue.toFixed(2)}</div>
          <div className="rv-stat-label">Avg. Order Value</div>
        </div>
        <div className="rv-stat-card rv-stat--orders">
          <div className="rv-stat-icon">🛒</div>
          <div className="rv-stat-value">{ordersThisMonth}</div>
          <div className="rv-stat-label">Orders This Month</div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="rv-chart-card">
        <div className="rv-chart-header">
          <h2 className="rv-chart-title">📈 Revenue Trend — Last 30 Days</h2>
        </div>
        {revenueData.length === 0 ? (
          <div className="rv-chart-empty">No revenue data yet. Create some orders!</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5}
                fill="url(#rvGradient)" dot={false} activeDot={{ r: 5, fill: '#0ea5e9' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Products by Revenue */}
      {topProducts.length > 0 && (
        <div className="rv-chart-card">
          <div className="rv-chart-header">
            <h2 className="rv-chart-title">🏆 Top Products by Sales</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts} layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={110} />
              <Tooltip formatter={(v) => [`${v} units`, 'Sold']}
                contentStyle={{ background: '#16213e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="total_sold" radius={[0, 4, 4, 0]}>
                {topProducts.map((_, i) => (
                  <Cell key={i} fill={['#0ea5e9','#22c55e','#f59e0b','#a78bfa','#f43f5e','#06b6d4','#84cc16','#fb923c'][i % 8]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-order Revenue Table */}
      <div className="rv-chart-card">
        <div className="rv-chart-header">
          <h2 className="rv-chart-title">🧾 All Orders Revenue</h2>
          <span className="rv-chart-sub">{orders.length} total orders</span>
        </div>
        <div className="rv-orders-table">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[...orders].reverse().slice(0, 20).map((o) => (
                <tr key={o.id}>
                  <td><span className="rv-order-id">#{o.id}</span></td>
                  <td>{o.customer?.full_name || '—'}</td>
                  <td><span className="rv-items-badge">{o.items?.length || 0} items</span></td>
                  <td className="rv-date">{new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td><span className="rv-amount">${parseFloat(o.total_amount).toFixed(2)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length > 20 && (
            <p className="rv-table-note">Showing latest 20 of {orders.length} orders</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Revenue;
