const express = require('express');
// Initialize Stripe only if API key exists (for development without Stripe)
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderConfirmation } = require('../services/emailService');

const router = express.Router();

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler
 * 
 * This endpoint receives events from Stripe when payments succeed/fail
 * Must use raw body to verify webhook signature
 */
router.post('/stripe', 
  express.raw({ type: 'application/json' }), // Raw body for signature verification
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    if (!stripe) {
      return res.status(500).send('Stripe not configured');
    }

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        if (!stripe) break;
        const paymentIntent = event.data.object;
        
        // Find order by payment intent ID (stored in metadata)
        const orderId = paymentIntent.metadata.orderId;
        const order = await Order.findById(orderId);

        if (order && order.paymentStatus === 'pending') {
          // Update order status
          order.paymentStatus = 'paid';
          order.status = 'processing';
          await order.save();

          // Reduce inventory
          for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product && product.inventory.trackQuantity) {
              await product.reduceInventory(item.quantity);
            }
          }

          // Clear user's cart
          const userId = paymentIntent.metadata.userId;
          const cart = await Cart.findOne({ user: userId });
          if (cart) {
            await cart.clear();
          }

          // Send order confirmation email
          const user = await User.findById(userId);
          if (user) {
            await sendOrderConfirmation(order, user);
          }

          console.log(`✅ Order ${orderId} payment confirmed via webhook`);
        }
        break;

      case 'payment_intent.payment_failed':
        if (!stripe) break;
        const failedPayment = event.data.object;
        const failedOrderId = failedPayment.metadata.orderId;
        const failedOrder = await Order.findById(failedOrderId);

        if (failedOrder) {
          failedOrder.paymentStatus = 'failed';
          await failedOrder.save();
          console.log(`❌ Order ${failedOrderId} payment failed`);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return response to Stripe
    res.json({ received: true });
  }
);

module.exports = router;

