import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getCustomers, createCustomer, deleteCustomer } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './Customers.css';

const emptyForm = { full_name: '', email: '', phone: '' };

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openAdd = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.full_name.trim()) return 'Full name is required';
    if (!form.email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) return 'Please enter a valid email address';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
    };

    setSubmitting(true);
    try {
      await createCustomer(payload);
      toast.success('Customer added successfully');
      closeModal();
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete "${customer.full_name}"? This action cannot be undone.`)) return;
    try {
      await deleteCustomer(customer.id || customer._id);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Delete failed');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    { key: 'full_name', label: 'Full Name' },
    {
      key: 'email',
      label: 'Email',
      render: (val) => <span className="email-text">{val}</span>,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => val || <span className="text-muted">—</span>,
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (val) => formatDate(val),
    },
  ];

  if (loading) return <LoadingSpinner text="Loading customers..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchCustomers} />;

  return (
    <div className="customers-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your customer base</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Customer
        </button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        emptyMessage="No customers yet. Add your first customer!"
        actions={(row) => (
          <button className="action-btn action-btn-delete" onClick={() => handleDelete(row)}>
            🗑️ Delete
          </button>
        )}
      />

      <Modal isOpen={modalOpen} onClose={closeModal} title="Add Customer">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="e.g. John Doe"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="e.g. john@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="e.g. +1 555-123-4567"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Customers;
