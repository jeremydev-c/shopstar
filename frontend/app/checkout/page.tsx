'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '@/lib/api';
import Navigation from '@/components/Navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Prevent double submission
    if (loading) return;
    
    setLoading(true);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    let orderId: string | null = null;

    try {
      // Create order
      const orderResponse = await api.post('/orders', { shippingAddress });
      const { clientSecret, order } = orderResponse.data;
      orderId = order._id;

      if (!clientSecret) {
        throw new Error('Payment processing not available. Please try again.');
      }

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (stripeError) {
        let errorMessage = stripeError.message || 'Payment failed';
        
        // Provide helpful message for test mode errors
        if (errorMessage.includes('test mode') || errorMessage.includes('non test card')) {
          errorMessage = '⚠️ Test Mode: Use test card 4242 4242 4242 4242. Real cards won\'t work in test mode.';
        }
        
        // Cancel/delete the order since payment failed
        if (orderId) {
          try {
            await api.delete(`/orders/${orderId}`);
          } catch (deleteError) {
            console.error('Failed to cancel order:', deleteError);
          }
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm payment with backend (send payment intent ID, not client_secret)
        await api.post(`/orders/${orderId}/confirm-payment`, {
          paymentIntentId: paymentIntent.id, // This is the payment intent ID, not client_secret
        });

        router.push(`/orders/${orderId}`);
      } else {
        // Payment didn't succeed - cancel order
        if (orderId) {
          try {
            await api.delete(`/orders/${orderId}`);
          } catch (deleteError) {
            console.error('Failed to cancel order:', deleteError);
          }
        }
        setError('Payment was not completed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      // Cancel order if it was created but something else failed
      if (orderId) {
        try {
          await api.delete(`/orders/${orderId}`);
        } catch (deleteError) {
          console.error('Failed to cancel order:', deleteError);
        }
      }
      setError(err.response?.data?.message || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shipping Address */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Shipping Address</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Street</label>
            <input
              type="text"
              required
              value={shippingAddress.street}
              onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">City</label>
            <input
              type="text"
              required
              value={shippingAddress.city}
              onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">State</label>
            <input
              type="text"
              required
              value={shippingAddress.state}
              onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Zip Code</label>
            <input
              type="text"
              required
              value={shippingAddress.zipCode}
              onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Payment</h2>
        
        {/* Test Mode Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-yellow-800 mb-2">🧪 Test Mode Active</p>
          <p className="text-xs text-yellow-700 mb-3">
            Use Stripe test cards. Real cards won't work in test mode.
          </p>
          <div className="text-xs text-yellow-700 space-y-1">
            <p><strong>Success:</strong> 4242 4242 4242 4242</p>
            <p><strong>Decline:</strong> 4000 0000 0000 0002</p>
            <p>Use any future expiry date, any CVC, and any ZIP code</p>
          </div>
        </div>

        <div className="border p-4 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-semibold mb-2">❌ {error}</p>
          {error.includes('test mode') && (
            <div className="mt-2 text-sm bg-white p-3 rounded border border-red-200">
              <p className="font-semibold mb-1">Use this test card:</p>
              <p className="font-mono text-lg">4242 4242 4242 4242</p>
              <p className="text-xs mt-2">Any future expiry date (e.g., 12/25), any CVC (e.g., 123), any ZIP</p>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Complete Order'}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      const response = await api.get('/cart');
      if (response.data.success) {
        setCart(response.data.cart);
        if (response.data.cart.items.length === 0) {
          router.push('/cart');
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  if (!cart) {
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
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Elements stripe={stripePromise}>
              <CheckoutForm />
            </Elements>
          </div>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {cart.items.map((item: any) => (
                <div key={item._id} className="flex justify-between">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

