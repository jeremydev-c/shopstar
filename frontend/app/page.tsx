import Link from 'next/link';
import { ShoppingBag, ShoppingCart, CreditCard, Truck } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navigation />
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Welcome to
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {' '}ShopStar{' '}
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover amazing products with secure checkout
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/products"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Shop Now
            </Link>
            <Link
              href="/login"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold border-2 border-purple-600 hover:bg-purple-50 transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mt-20">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <ShoppingBag className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Wide Selection</h3>
            <p className="text-gray-600">Thousands of products</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <ShoppingCart className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Easy Shopping</h3>
            <p className="text-gray-600">Simple checkout process</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <CreditCard className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Secure Payment</h3>
            <p className="text-gray-600">Stripe powered</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Truck className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Fast Shipping</h3>
            <p className="text-gray-600">Quick delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
}
