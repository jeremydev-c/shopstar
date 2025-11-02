'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Navigation from '@/components/Navigation';
import { BarChart3, DollarSign, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';

interface Analytics {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  recentOrders: number;
  lowStockProducts: number;
}

export default function AdminAnalyticsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    recentOrders: 0,
    lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/products');
      return;
    }
    if (isAuthenticated && user?.role === 'admin') {
      fetchAnalytics();
    }
  }, [isAuthenticated, authLoading, user]);

  const fetchAnalytics = async () => {
    try {
      // Fetch all data in parallel
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        api.get('/products?limit=1000'),
        api.get('/orders/admin/all?limit=1000'),
        api.get('/users/admin/all'),
      ]);

      const products = productsRes.data.products || [];
      const orders = ordersRes.data.orders || [];
      const users = usersRes.data.users || [];

      // Calculate revenue from paid orders
      const totalRevenue = orders
        .filter((o: any) => o.paymentStatus === 'paid')
        .reduce((sum: number, o: any) => sum + o.total, 0);

      // Count low stock products
      const lowStockProducts = products.filter((p: any) => 
        p.inventory.quantity <= p.inventory.lowStockThreshold
      ).length;

      // Recent orders (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentOrders = orders.filter((o: any) => 
        new Date(o.createdAt) >= sevenDaysAgo
      ).length;

      setAnalytics({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        totalCustomers: users.length,
        recentOrders,
        lowStockProducts,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
          <p className="text-gray-600">View sales data and store performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  ${analytics.totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.totalOrders}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Products</p>
                <p className="text-3xl font-bold text-purple-600">{analytics.totalProducts}</p>
              </div>
              <Package className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-yellow-600">{analytics.totalCustomers}</p>
              </div>
              <Users className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Recent Orders (7 days)</p>
                <p className="text-3xl font-bold text-indigo-600">{analytics.recentOrders}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Low Stock Products</p>
                <p className="text-3xl font-bold text-red-600">{analytics.lowStockProducts}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-red-600" />
            </div>
            {analytics.lowStockProducts > 0 && (
              <p className="text-sm text-red-600 mt-2">⚠️ Action needed: Restock these products</p>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Performance Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-bold text-lg">
                ${analytics.totalOrders > 0 
                  ? (analytics.totalRevenue / analytics.totalOrders).toFixed(2) 
                  : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue per Customer</span>
              <span className="font-bold text-lg">
                ${analytics.totalCustomers > 0 
                  ? (analytics.totalRevenue / analytics.totalCustomers).toFixed(2) 
                  : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Orders per Customer</span>
              <span className="font-bold text-lg">
                {analytics.totalCustomers > 0 
                  ? (analytics.totalOrders / analytics.totalCustomers).toFixed(2) 
                  : '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

