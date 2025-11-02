'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Product } from '@/lib/types';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const params: any = { status: 'active' };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;

      const response = await api.get('/products', { params });
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('💡 Tip: Make sure your backend server is running on http://localhost:5000');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      // Check if user is logged in
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert('Please log in to add items to cart');
        window.location.href = '/login';
        return;
      }

      await api.post('/cart', {
        productId,
        quantity: 1,
      });
      alert('✅ Added to cart!');
    } catch (error: any) {
      if (error.response?.status === 401) {
        alert('Please log in to add items to cart');
        window.location.href = '/login';
      } else {
        alert(error.response?.data?.message || 'Failed to add to cart');
      }
    }
  };

  // Helper to check if product is in stock
  const isInStock = (product: Product) => {
    if (product.inStock !== undefined) return product.inStock;
    // Fallback: check inventory quantity directly
    return product.inventory.quantity > 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Products</h1>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No products found</div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <Link href={`/products/${product._id}`}>
                  <img
                    src={product.images[0] || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </Link>
                <div className="p-4">
                  <Link href={`/products/${product._id}`}>
                    <h3 className="font-semibold text-lg mb-2 hover:text-purple-600">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-2xl font-bold text-purple-600">${product.price}</span>
                      {product.compareAtPrice && (
                        <span className="text-gray-400 line-through ml-2">${product.compareAtPrice}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(product._id)}
                    className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors ${
                      isInStock(product)
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!isInStock(product)}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {isInStock(product) ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                  {isInStock(product) && product.inventory.quantity <= product.inventory.lowStockThreshold && (
                    <p className="text-xs text-orange-600 mt-1 text-center">⚠️ Low Stock - Only {product.inventory.quantity} left!</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

