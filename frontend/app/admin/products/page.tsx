'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Navigation from '@/components/Navigation';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  category: Category;
  images: string[];
  inventory: {
    quantity: number;
    lowStockThreshold: number;
  };
  status: string;
  featured: boolean;
}

export default function AdminProductsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    sku: '',
    category: '',
    images: [''],
    inventory: {
      quantity: '',
      lowStockThreshold: '10'
    },
    status: 'draft',
    featured: false,
    tags: ''
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/products');
      return;
    }
    if (isAuthenticated && user?.role === 'admin') {
      fetchProducts();
      fetchCategories();
    }
  }, [isAuthenticated, authLoading, user]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        images: formData.images.filter(img => img.trim() !== ''),
        inventory: {
          quantity: parseInt(formData.inventory.quantity),
          lowStockThreshold: parseInt(formData.inventory.lowStockThreshold),
          trackQuantity: true
        },
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, productData);
        alert('Product updated successfully!');
      } else {
        await api.post('/products', productData);
        alert('Product created successfully!');
      }

      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving product');
      console.error('Error saving product:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      compareAtPrice: '',
      sku: '',
      category: '',
      images: [''],
      inventory: {
        quantity: '',
        lowStockThreshold: '10'
      },
      status: 'draft',
      featured: false,
      tags: ''
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      compareAtPrice: '',
      sku: product.sku,
      category: product.category._id,
      images: product.images.length > 0 ? product.images : [''],
      inventory: {
        quantity: product.inventory.quantity.toString(),
        lowStockThreshold: product.inventory.lowStockThreshold.toString()
      },
      status: product.status,
      featured: product.featured,
      tags: ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      alert('Product deleted successfully!');
      fetchProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting product');
    }
  };

  const handleStockUpdate = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    try {
      // Find the product to get current lowStockThreshold
      const product = products.find(p => p._id === productId);
      if (!product) return;

      await api.put(`/products/${productId}`, {
        inventory: {
          quantity: newQuantity,
          lowStockThreshold: product.inventory.lowStockThreshold || 10,
          trackQuantity: true
        }
      });
      // Refresh products list
      fetchProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating stock');
      fetchProducts(); // Refresh to revert changes
    }
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Manage Products</h1>
          <button
            onClick={() => {
              resetForm();
              setEditingProduct(null);
              setShowForm(!showForm);
            }}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {showForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        {/* Product Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg border-2 border-purple-200 p-8 mb-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold mb-2 text-gray-900">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-lg"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold mb-2 text-gray-900">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-lg"
                    placeholder="PROD-001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold mb-2 text-gray-900">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-lg"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-base font-semibold mb-2 text-gray-900">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-lg"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold mb-2 text-gray-900">Compare At Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-lg"
                    placeholder="Original price (for sale)"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold mb-2 text-gray-900">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-lg"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold mb-2 text-gray-900">Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formData.inventory.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inventory: { ...formData.inventory, quantity: e.target.value }
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-lg"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold mb-2 text-gray-900">Low Stock Threshold</label>
                  <input
                    type="number"
                    value={formData.inventory.lowStockThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inventory: { ...formData.inventory, lowStockThreshold: e.target.value }
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold mb-2 text-gray-900">Image URLs</label>
                {formData.images.map((img, index) => (
                  <input
                    key={index}
                    type="url"
                    value={img}
                    onChange={(e) => updateImage(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-lg"
                  />
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="text-purple-700 hover:text-purple-900 font-semibold text-base underline"
                >
                  + Add Another Image
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold mb-2 text-gray-900">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-lg"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-semibold mb-2 text-gray-900">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-lg"
                  />
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="mr-3 w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <label className="text-base font-semibold text-gray-900">Feature this product</label>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Stock Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No products found. Add your first product!</p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.images[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.jpg';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.category?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{product.sku}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">${product.price.toFixed(2)}</div>
                        {product.inventory.quantity <= product.inventory.lowStockThreshold && (
                          <div className="text-xs text-red-500">Low Stock</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={product.inventory.quantity}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                handleStockUpdate(product._id, value);
                              }}
                              onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                handleStockUpdate(product._id, value);
                              }}
                              className="w-24 px-2 py-2 border-2 border-gray-300 rounded text-base font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            <span className={`px-3 py-1 text-sm rounded-full font-bold ${
                              product.inventory.quantity > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.inventory.quantity > 0 ? '✓ In Stock' : '✗ Out of Stock'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const newQty = product.inventory.quantity > 0 ? 0 : 100;
                              handleStockUpdate(product._id, newQty);
                            }}
                            className={`text-xs px-3 py-1 rounded font-semibold ${
                              product.inventory.quantity > 0
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {product.inventory.quantity > 0 ? 'Set Out of Stock' : 'Set In Stock (100)'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            product.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : product.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

