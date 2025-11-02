'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Navigation from '@/components/Navigation';
import { Users, Search, Shield } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/products');
      return;
    }
    if (isAuthenticated && user?.role === 'admin') {
      fetchUsers();
    }
  }, [isAuthenticated, authLoading, user]);

  const fetchUsers = async () => {
    try {
      // Note: We'll need to create this endpoint
      // For now, we'll use a placeholder or create it
      const response = await api.get('/users/admin/all');
      if (response.data.success) {
        let usersData = response.data.users;
        
        if (search) {
          usersData = usersData.filter((u: User) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        setUsers(usersData);
      }
    } catch (error: any) {
      // If endpoint doesn't exist, create a mock list or show message
      if (error.response?.status === 404) {
        console.log('Users endpoint not yet created');
      }
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (userId: string) => {
    if (!confirm('Make this user an admin?')) return;
    try {
      await api.put(`/users/${userId}/role`, { role: 'admin' });
      fetchUsers();
      alert('User role updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const removeAdmin = async (userId: string) => {
    if (!confirm('Remove admin privileges from this user?')) return;
    try {
      await api.put(`/users/${userId}/role`, { role: 'customer' });
      fetchUsers();
      alert('User role updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update user role');
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
            <h1 className="text-4xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-gray-600 mt-2">View and manage customer accounts</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No users found</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-semibold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {u.role === 'admin' ? (
                            <span className="flex items-center gap-1">
                              <Shield size={14} /> Admin
                            </span>
                          ) : (
                            'Customer'
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'admin' ? (
                          <button
                            onClick={() => removeAdmin(u._id)}
                            className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Remove Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => makeAdmin(u._id)}
                            className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Make Admin
                          </button>
                        )}
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

