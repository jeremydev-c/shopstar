'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-purple-600">
            ⭐ ShopStar
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-gray-700 hover:text-purple-600">
              Products
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link href="/cart" className="text-gray-700 hover:text-purple-600 flex items-center gap-1">
                  <ShoppingCart className="w-5 h-5" />
                  Cart
                </Link>
                <Link href="/orders" className="text-gray-700 hover:text-purple-600">
                  Orders
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="text-gray-700 hover:text-purple-600">
                    Admin
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 text-gray-700 hover:text-purple-600"
                  >
                    <User className="w-5 h-5" />
                    {user?.name}
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowMenu(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-purple-600">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setShowMenu(!showMenu)}
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden py-4 border-t">
            <Link href="/products" className="block py-2 text-gray-700">Products</Link>
            {isAuthenticated ? (
              <>
                <Link href="/cart" className="block py-2 text-gray-700">Cart</Link>
                <Link href="/orders" className="block py-2 text-gray-700">Orders</Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="block py-2 text-gray-700">Admin</Link>
                )}
                <button onClick={logout} className="block py-2 text-red-600 w-full text-left">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-2 text-gray-700">Login</Link>
                <Link href="/register" className="block py-2 text-gray-700">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

