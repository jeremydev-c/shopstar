'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Navigation from '@/components/Navigation';
import { Package, Search, Filter } from 'lucide-react';

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export default function AdminOrdersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', paymentStatus: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/products');
      return;
    }
    if (isAuthenticated && user?.role === 'admin') {
      fetchOrders();
    }
  }, [isAuthenticated, authLoading, user, filter.status, filter.paymentStatus]);
  
  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (isAuthenticated && user?.role === 'admin') {
        fetchOrders();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = async () => {
    try {
      const params: any = {};
      if (filter.status) params.status = filter.status;
      if (filter.paymentStatus) params.paymentStatus = filter.paymentStatus;

      const response = await api.get('/orders/admin/all', { params });
      if (response.data.success) {
        let ordersData = response.data.orders;
        
        // Filter by search term if provided
        if (search) {
          ordersData = ordersData.filter((order: Order) =>
            order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            order.customer.email.toLowerCase().includes(search.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, trackingNumber?: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus, trackingNumber });
      fetchOrders();
      alert('Order status updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update order status');
    }
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Manage Orders</h1>
            <p className="text-gray-600 mt-2">View and process customer orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by order number, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchOrders()}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filter.paymentStatus}
              onChange={(e) => setFilter({ ...filter, paymentStatus: e.target.value })}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No orders found</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{order.customer.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.items.length} item(s)
                      </td>
                      <td className="px-6 py-4 font-bold">${order.total.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            if (newStatus === 'shipped') {
                              const tracking = prompt('Enter tracking number (optional):');
                              updateOrderStatus(order._id, newStatus, tracking || undefined);
                            } else {
                              updateOrderStatus(order._id, newStatus);
                            }
                          }}
                          className={`text-sm px-3 py-1 rounded-full font-semibold border-2 ${
                            order.status === 'delivered'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : order.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            order.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : order.paymentStatus === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            const orderDetails = `
Order: ${order.orderNumber}
Customer: ${order.customer.name}
Email: ${order.customer.email}
Address: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
Items: ${order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
Total: $${order.total.toFixed(2)}
Status: ${order.status}
Payment: ${order.paymentStatus}
                            `;
                            alert(orderDetails);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                        >
                          View Details
                        </button>
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

