'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Package, ShoppingBag, Users, BarChart3, Settings } from 'lucide-react';

function QuickStats() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        api.get('/products?limit=1000'),
        api.get('/orders/admin/all?limit=1000'),
      ]);

      const products = productsRes.data.products || [];
      const orders = ordersRes.data.orders || [];
      const revenue = orders
        .filter((o: any) => o.paymentStatus === 'paid')
        .reduce((sum: number, o: any) => sum + o.total, 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Quick Stats</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-3xl font-bold text-purple-600">
            {loading ? '...' : stats.totalProducts}
          </p>
          <p className="text-gray-600 mt-2">Total Products</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-3xl font-bold text-blue-600">
            {loading ? '...' : stats.totalOrders}
          </p>
          <p className="text-gray-600 mt-2">Total Orders</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-3xl font-bold text-green-600">
            {loading ? '...' : `$${stats.totalRevenue.toFixed(2)}`}
          </p>
          <p className="text-gray-600 mt-2">Total Revenue</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/products');
      return;
    }
  }, [isAuthenticated, authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your ShopStar store</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Manage Products */}
          <Link
            href="/admin/products"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-lg">
                <Package className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Products</h2>
                <p className="text-gray-600 text-sm">Add, edit, and manage products</p>
              </div>
            </div>
          </Link>

          {/* Manage Orders */}
          <Link
            href="/admin/orders"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-lg">
                <ShoppingBag className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Orders</h2>
                <p className="text-gray-600 text-sm">View and process orders</p>
              </div>
            </div>
          </Link>

          {/* Manage Users */}
          <Link
            href="/admin/users"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-4 rounded-lg">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Users</h2>
                <p className="text-gray-600 text-sm">View and manage customers</p>
              </div>
            </div>
          </Link>

          {/* Analytics */}
          <Link
            href="/admin/analytics"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-4 rounded-lg">
                <BarChart3 className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
                <p className="text-gray-600 text-sm">View sales and reports</p>
              </div>
            </div>
          </Link>

          {/* Settings */}
          <Link
            href="/admin/settings"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <Settings className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-600 text-sm">Store configuration</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <QuickStats />
      </div>
    </div>
  );
}

