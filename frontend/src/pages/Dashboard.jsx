import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getProducts, getCustomers, getOrders, getAnalytics } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './Dashboard.css';

const CHART_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#a78bfa', '#f43f5e'];

// Custom tooltip for revenue chart
const RevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name === 'revenue' ? `Revenue: $${p.value.toFixed(2)}` : `Orders: ${p.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const InventoryTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p style={{ color: payload[0].payload.quantity < 10 ? '#ef4444' : '#0ea5e9' }}>
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodData, custData, ordData, analyticsData] = await Promise.all([
        getProducts(),
        getCustomers(),
        getOrders(),
        getAnalytics(),
      ]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCustomers(Array.isArray(custData) ? custData : []);
      setOrders(Array.isArray(ordData) ? ordData : []);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAll} />;

  const lowStockProducts = products.filter((p) => p.quantity < 10);

  const metrics = [
    { icon: '📦', label: 'Total Products',  value: products.length, color: 'blue',   trend: '+', link: '/products' },
    { icon: '👥', label: 'Total Customers', value: customers.length, color: 'purple', trend: '+', link: '/customers' },
    { icon: '🛒', label: 'Total Orders',    value: orders.length,   color: 'green',  trend: '+', link: '/orders' },
    {
      icon: '⚠️', label: 'Low Stock Items', value: lowStockProducts.length,
      color: lowStockProducts.length > 0 ? 'red' : 'green',
      trend: lowStockProducts.length > 0 ? '!' : '✓', link: '/low-stock',
    },
    {
      icon: '💰', label: 'Total Revenue',
      value: `$${(analytics?.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'teal', trend: '+', link: '/revenue',
    },
    {
      icon: '📅', label: 'This Month',
      value: `$${(analytics?.revenue_this_month || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'orange', trend: `${analytics?.orders_this_month || 0} orders`, link: '/monthly-orders',
    },
  ];

  // Inventory pie data — top 6 products for pie
  const inventoryPieData = (analytics?.inventory_status || []).slice(0, 6).map((p) => ({
    name: p.name,
    value: p.quantity,
  }));

  // Format date labels for revenue chart
  const revenueData = (analytics?.daily_revenue || []).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time overview of your inventory & orders</p>
        </div>
        <button className="btn-refresh" onClick={fetchAll} title="Refresh">
          ↻ Refresh
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div className="metrics-grid">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`metric-card metric-card--${m.color} fade-in ${m.link ? 'metric-card--clickable' : ''}`}
            style={{ animationDelay: `${i * 0.08}s` }}
            onClick={() => m.link && navigate(m.link)}
            title={m.link ? `Go to ${m.label}` : ''}
          >
            <div className="metric-card-inner">
              <div className="metric-info">
                <span className="metric-label">{m.label}</span>
                <span className="metric-value">{m.value}</span>
                <span className="metric-trend">{m.trend}</span>
              </div>
              <div className="metric-icon-wrapper">
                <span className="metric-icon">{m.icon}</span>
              </div>
            </div>
            {m.link && <span className="metric-arrow">→</span>}
            <div className="metric-glow" />
          </div>
        ))}
      </div>

      {/* ── Charts Row 1: Revenue Area + Orders Bar ── */}
      <div className="charts-row">
        {/* Revenue Trend */}
        <div className="chart-card fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="chart-header">
            <h2 className="chart-title">📈 Revenue Trend</h2>
            <span className="chart-subtitle">Last 30 days</span>
          </div>
          {revenueData.length === 0 ? (
            <div className="chart-empty">No order data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={{ fill: '#0ea5e9', r: 3 }}
                  activeDot={{ r: 6, fill: '#38bdf8' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily Orders Bar */}
        <div className="chart-card fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="chart-header">
            <h2 className="chart-title">📊 Daily Orders</h2>
            <span className="chart-subtitle">Last 30 days</span>
          </div>
          {revenueData.length === 0 ? (
            <div className="chart-empty">No order data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false}
                  allowDecimals={false} />
                <Tooltip content={<RevenueTooltip />} />
                <Bar dataKey="orders" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Charts Row 2: Top Products + Inventory Pie ── */}
      <div className="charts-row">
        {/* Top Products Horizontal Bar */}
        <div className="chart-card fade-in" style={{ animationDelay: '0.7s' }}>
          <div className="chart-header">
            <h2 className="chart-title">🏆 Top Products</h2>
            <span className="chart-subtitle">By units sold</span>
          </div>
          {(analytics?.top_products || []).length === 0 ? (
            <div className="chart-empty">Place some orders to see top products</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={analytics.top_products}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#e2e8f0', fontSize: 12 }}
                  tickLine={false} width={90} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'total_sold' ? [`${value} units`, 'Sold'] : [`$${value}`, 'Revenue']
                  }
                  contentStyle={{ background: '#16213e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }}
                />
                <Bar dataKey="total_sold" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {(analytics.top_products || []).map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inventory Status Pie */}
        <div className="chart-card fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="chart-header">
            <h2 className="chart-title">📦 Inventory Distribution</h2>
            <span className="chart-subtitle">Stock levels</span>
          </div>
          {inventoryPieData.length === 0 ? (
            <div className="chart-empty">Add products to see inventory</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={inventoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {inventoryPieData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} units`, 'Stock']}
                  contentStyle={{ background: '#16213e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Low Stock Alert Table ── */}
      {lowStockProducts.length > 0 && (
        <div className="low-stock-section fade-in" style={{ animationDelay: '0.9s' }}>
          <h2 className="section-title">
            <span className="section-icon">⚠️</span>
            Low Stock Alert
            <span className="section-badge">{lowStockProducts.length}</span>
          </h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td><span className="sku-tag">{p.sku}</span></td>
                    <td><span className="qty-danger">{p.quantity}</span></td>
                    <td>
                      <span className={`status-badge ${p.quantity === 0 ? 'status-out' : 'status-low'}`}>
                        {p.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
