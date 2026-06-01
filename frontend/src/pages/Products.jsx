import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../api';
import { BASE_URL } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './Products.css';

const emptyForm = { name: '', sku: '', price: '', quantity: '' };

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRef = useRef(null);
  const inlineFileRef = useRef(null);

  // Lightbox state
  const [lightbox, setLightbox] = useState(null); // { url, name, sku }
  const [imgSize, setImgSize] = useState(null);
  const imgRef = useRef(null);

  const openLightbox = (product) => {
    if (!product.image_url) return;
    setLightbox({
      url: `${BASE_URL}${product.image_url}`,
      name: product.name,
      sku: product.sku,
    });
  };

  const closeLightbox = () => setLightbox(null);

  // Close lightbox on Escape key
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Observe image size to fit wrapper exactly on desktop/mobile
  useEffect(() => {
    if (!lightbox || !imgRef.current) {
      setImgSize(null);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === imgRef.current) {
          setImgSize({
            width: entry.contentRect.width,
          });
        }
      }
    });

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [lightbox]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      price: product.price?.toString() || '',
      quantity: product.quantity?.toString() || '',
    });
    setImageFile(null);
    setImagePreview(product.image_url ? `${BASE_URL}${product.image_url}` : null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or GIF images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Product name is required';
    if (!form.sku.trim()) return 'SKU is required';
    if (!form.price || parseFloat(form.price) <= 0) return 'Price must be greater than 0';
    if (form.quantity === '' || parseInt(form.quantity, 10) < 0)
      return 'Quantity must be 0 or greater';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity, 10),
    };

    setSubmitting(true);
    try {
      let savedProduct;
      if (editing) {
        savedProduct = await updateProduct(editing.id, payload);
        toast.success('Product updated successfully');
      } else {
        savedProduct = await createProduct(payload);
        toast.success('Product created successfully');
      }

      // Upload image if one was selected
      if (imageFile && savedProduct?.id) {
        try {
          await uploadProductImage(savedProduct.id, imageFile);
          toast.success('Image uploaded');
        } catch {
          toast.error('Product saved but image upload failed');
        }
      }

      closeModal();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Delete failed');
    }
  };

  // Quick inline image upload (without opening modal)
  const handleQuickUpload = async (product, file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or GIF images are allowed');
      return;
    }
    setUploadingId(product.id);
    try {
      await uploadProductImage(product.id, file);
      toast.success(`Image uploaded for "${product.name}"`);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Image upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const columns = [
    {
      key: 'image_url',
      label: 'Photo',
      render: (val, row) => (
        <div className="product-image-cell">
          {val ? (
            <div className="product-thumb-wrapper" onClick={() => openLightbox(row)} title="Click to view full image">
              <img
                src={`${BASE_URL}${val}`}
                alt={row.name}
                className="product-thumb"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="product-thumb-overlay">🔍</div>
            </div>
          ) : (
            <div className="product-thumb-placeholder">📦</div>
          )}
        </div>
      ),
    },
    { key: 'name', label: 'Name' },
    {
      key: 'sku',
      label: 'SKU',
      render: (val) => <span className="sku-tag">{val}</span>,
    },
    {
      key: 'price',
      label: 'Price',
      render: (val) => `$${parseFloat(val).toFixed(2)}`,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (val) =>
        val < 10 ? <span className="qty-danger">{val}</span> : val,
    },
  ];

  if (loading) return <LoadingSpinner text="Loading products..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProducts} />;

  return (
    <div className="products-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product inventory</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Product
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        emptyMessage="No products yet. Add your first product!"
        actions={(row) => (
          <>
            {row.image_url && (
              <button
                className="action-btn action-btn-view"
                onClick={() => openLightbox(row)}
                title="View full image"
              >
                👁️ View
              </button>
            )}
            <button className="action-btn action-btn-edit" onClick={() => openEdit(row)}>
              ✏️ Edit
            </button>
            <label className="action-btn action-btn-upload" title="Upload photo">
              {uploadingId === row.id ? '⏳' : '📷'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleQuickUpload(row, e.target.files[0])}
              />
            </label>
            <button className="action-btn action-btn-delete" onClick={() => handleDelete(row)}>
              🗑️
            </button>
          </>
        )}
      />

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleSubmit}>
          {/* Image upload area */}
          <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="image-preview" />
            ) : (
              <div className="image-placeholder">
                <span className="upload-icon">📷</span>
                <span className="upload-hint">Click to upload product photo</span>
                <span className="upload-sub">JPEG, PNG, WebP, GIF · Max 5MB</span>
              </div>
            )}
            {imagePreview && (
              <div className="image-overlay">
                <span>Change Photo</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />

          <div className="form-group">
            <label htmlFor="name">Product Name</label>
            <input
              id="name" name="name" type="text"
              placeholder="e.g. Wireless Mouse"
              value={form.name} onChange={handleChange} required
            />
          </div>

          <div className="form-group">
            <label htmlFor="sku">SKU</label>
            <input
              id="sku" name="sku" type="text"
              placeholder="e.g. WM-001"
              value={form.sku} onChange={handleChange} required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input
                id="price" name="price" type="number"
                step="0.01" min="0.01" placeholder="29.99"
                value={form.price} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity" name="quantity" type="number"
                min="0" placeholder="100"
                value={form.quantity} onChange={handleChange} required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Lightbox ── */}
      {lightbox && createPortal(
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-frame" onClick={(e) => e.stopPropagation()}>

            {/* Image wrapper — shrinks to exact photo size so ✕ is always on the corner */}
            <div 
              className="lightbox-img-wrap"
              style={imgSize ? { width: `${imgSize.width}px` } : {}}
            >
              <button
                className="lightbox-close"
                onClick={closeLightbox}
                title="Close (Esc)"
                aria-label="Close image"
              >
                ✕
              </button>
              <img
                ref={imgRef}
                src={lightbox.url}
                alt={lightbox.name}
                className="lightbox-image"
              />
            </div>

            {/* Name + SKU pill below photo */}
            <div className="lightbox-caption">
              <span className="lightbox-caption-name">{lightbox.name}</span>
              <span className="lightbox-caption-sku">SKU: {lightbox.sku}</span>
            </div>

          </div>
        </div>,
        document.body
      )}


    </div>
  );
}

export default Products;
