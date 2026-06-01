import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';

const navSections = [
  {
    title: 'Main',
    items: [
      { path: '/',          label: 'Dashboard',   icon: '📊' },
      { path: '/products',  label: 'Products',    icon: '📦' },
      { path: '/customers', label: 'Customers',   icon: '👥' },
      { path: '/orders',    label: 'Orders',      icon: '🛒' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { path: '/monthly-orders', label: 'Monthly Orders', icon: '📅' },
      { path: '/revenue',        label: 'Total Revenue',  icon: '💰' },
    ],
  },
  {
    title: 'Alerts',
    items: [
      { path: '/low-stock', label: 'Low Stock', icon: '⚠️', alert: true },
    ],
  },
];

// Flat list for mobile nav
const allItems = navSections.flatMap((s) => s.items);

function Navbar() {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="sidebar" aria-label="Main navigation">
        <div className="sidebar-header">
          <div className="logo-wrapper">
            <span className="logo-icon">⚡</span>
            <h1 className="logo-text">InvenTrack</h1>
          </div>
          <p className="logo-subtitle">Management System</p>
        </div>

        <div className="sidebar-divider" />

        {navSections.map((section) => (
          <div key={section.title} className="nav-section">
            <p className="nav-section-title">{section.title}</p>
            <ul className="nav-list">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link--active' : ''} ${item.alert ? 'nav-link--alert' : ''}`
                    }
                    end={item.path === '/'}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {location.pathname === item.path && (
                      <span className="nav-active-indicator" />
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          <div className="sidebar-version">v1.0.0</div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {allItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `mobile-nav-link ${isActive ? 'mobile-nav-link--active' : ''}`
            }
            end={item.path === '/'}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default Navbar;
