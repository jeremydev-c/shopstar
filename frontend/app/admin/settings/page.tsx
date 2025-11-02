'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Navigation from '@/components/Navigation';
import { Settings, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    storeName: 'ShopStar',
    taxRate: 8,
    shippingCost: 5.99,
    lowStockThreshold: 10,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/products');
      return;
    }
  }, [isAuthenticated, authLoading, user, router]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, you'd save these to a database
      // For now, we'll just show a success message
      alert('Settings saved successfully! (In production, these would be saved to database)');
      localStorage.setItem('shopstar_settings', JSON.stringify(settings));
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Store Settings</h1>
          <p className="text-gray-600">Configure your store preferences</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          {/* General Settings */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              General Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-base font-semibold mb-2 text-gray-900">
                  Store Name
                </label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                />
              </div>
            </div>
          </div>

          {/* Pricing Settings */}
          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold mb-4">Pricing Settings</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-semibold mb-2 text-gray-900">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                />
                <p className="text-sm text-gray-500 mt-1">Current: {settings.taxRate}%</p>
              </div>

              <div>
                <label className="block text-base font-semibold mb-2 text-gray-900">
                  Shipping Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.shippingCost}
                  onChange={(e) => setSettings({ ...settings, shippingCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                />
              </div>
            </div>
          </div>

          {/* Inventory Settings */}
          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold mb-4">Inventory Settings</h2>
            
            <div>
              <label className="block text-base font-semibold mb-2 text-gray-900">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Products with stock below this number will be marked as low stock
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t pt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 flex items-center gap-2 font-semibold text-lg disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

