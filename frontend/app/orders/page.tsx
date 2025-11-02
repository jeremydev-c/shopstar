'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Order } from '@/lib/types';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No orders yet</p>
            <Link href="/products" className="text-purple-600 hover:underline">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link href={`/orders/${order._id}`} className="block">
                      <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
                      <p className="text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {order.items.length} item(s)
                      </p>
                    </Link>
                    {order.paymentStatus === 'pending' && order.status === 'pending' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to cancel this order?')) {
                            try {
                              await api.delete(`/orders/${order._id}`);
                              fetchOrders();
                            } catch (error: any) {
                              alert(error.response?.data?.message || 'Failed to cancel order');
                            }
                          }
                        }}
                        className="mt-3 text-sm px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                    <div className="flex flex-col items-end gap-2 mt-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.paymentStatus === 'pending' && (
                        <span className="text-xs text-orange-600 font-semibold">
                          Payment Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

