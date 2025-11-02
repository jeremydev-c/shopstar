const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../services/emailService');
// Initialize Stripe only if API key exists (for development without Stripe)
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

const router = express.Router();

// All order routes require authentication
router.use(protect);

/**
 * POST /api/orders
 * Create order from cart
 * 
 * Body: { shippingAddress }
 */
router.post('/',
  [
    body('shippingAddress.street').notEmpty().withMessage('Street is required'),
    body('shippingAddress.city').notEmpty().withMessage('City is required'),
    body('shippingAddress.state').notEmpty().withMessage('State is required'),
    body('shippingAddress.zipCode').notEmpty().withMessage('Zip code is required'),
    body('shippingAddress.country').notEmpty().withMessage('Country is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          errors: errors.array(),
          message: 'Validation failed' 
        });
      }

      const { shippingAddress } = req.body;

      // Get user's cart
      const cart = await Cart.findOne({ user: req.userId })
        .populate('items.product');

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ 
          message: 'Cart is empty' 
        });
      }

      // Validate inventory and build order items
      const orderItems = [];
      let subtotal = 0;

      for (const cartItem of cart.items) {
        const product = cartItem.product;

        // Check if product exists and is active
        if (!product || product.status !== 'active') {
          return res.status(400).json({ 
            message: `Product ${product?.name || 'Unknown'} is no longer available` 
          });
        }

        // Check inventory
        if (product.inventory.trackQuantity && product.inventory.quantity < cartItem.quantity) {
          return res.status(400).json({ 
            message: `Insufficient inventory for ${product.name}. Only ${product.inventory.quantity} available` 
          });
        }

        // Build order item (snapshot of product at time of order)
        const itemPrice = product.price;
        const itemTotal = itemPrice * cartItem.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product: product._id,
          name: product.name,
          price: itemPrice,
          quantity: cartItem.quantity,
          variant: cartItem.variant || null,
          image: product.images[0] || ''
        });
      }

      // Calculate totals first (tax = 8%, shipping = $5.99)
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const shipping = 5.99;
      const total = Math.round((subtotal + tax + shipping) * 100) / 100;

      // Create Stripe Payment Intent BEFORE creating order (if Stripe is configured)
      let paymentIntent = null;
      let clientSecret = null;

      if (stripe) {
        try {
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total * 100), // Stripe uses cents
            currency: 'usd',
            metadata: {
              userId: req.userId.toString()
            }
          });
          clientSecret = paymentIntent.client_secret;
        } catch (stripeError) {
          console.error('Stripe payment intent creation error:', stripeError);
          // Continue without Stripe for development
        }
      }

      // Create order with totals
      const order = new Order({
        customer: req.userId,
        items: orderItems,
        shippingAddress,
        subtotal,
        tax,
        shipping,
        total,
        paymentStatus: 'pending',
        paymentIntentId: clientSecret || null // Set payment intent ID if available
      });

      // Save order (orderNumber will be auto-generated in pre-save hook)
      await order.save();

      // Update payment intent metadata with order ID now that we have it
      if (stripe && paymentIntent && order.orderNumber) {
        try {
          await stripe.paymentIntents.update(paymentIntent.id, {
            metadata: {
              orderId: order._id.toString(),
              orderNumber: order.orderNumber,
              userId: req.userId.toString()
            }
          });
        } catch (updateError) {
          console.error('Failed to update payment intent metadata:', updateError);
        }
      }

      res.status(201).json({
        success: true,
        order,
        clientSecret: clientSecret,
        message: clientSecret 
          ? 'Order created successfully. Please complete payment.'
          : 'Order created successfully. Stripe not configured - payment will need to be processed manually.'
      });

    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/orders/:id/confirm-payment
 * Confirm payment after Stripe payment succeeds
 * 
 * Body: { paymentIntentId }
 */
router.post('/:id/confirm-payment',
  [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          errors: errors.array(),
          message: 'Validation failed' 
        });
      }

      const { paymentIntentId } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ 
          message: 'Order not found' 
        });
      }

      // Verify order belongs to user
      if (order.customer.toString() !== req.userId.toString()) {
        return res.status(403).json({ 
          message: 'Not authorized to access this order' 
        });
      }

      // Verify payment with Stripe
      if (!stripe) {
        return res.status(500).json({ 
          message: 'Stripe not configured' 
        });
      }

      // paymentIntentId should be the payment intent ID (format: pi_xxx)
      // But handle both ID and client_secret formats for compatibility
      let paymentIntentIdToRetrieve = paymentIntentId;
      if (paymentIntentId && paymentIntentId.includes('_secret_')) {
        // If it's a client_secret, extract the ID part
        paymentIntentIdToRetrieve = paymentIntentId.split('_secret_')[0];
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentIdToRetrieve);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          message: `Payment not completed. Status: ${paymentIntent.status}` 
        });
      }

      // Update order status
      order.paymentStatus = 'paid';
      order.status = 'processing';
      await order.save();

      // Reduce inventory for each product
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product && product.inventory.trackQuantity) {
          await product.reduceInventory(item.quantity);
        }
      }

      // Clear user's cart
      const cart = await Cart.findOne({ user: req.userId });
      if (cart) {
        await cart.clear();
      }

      // Send order confirmation email
      const user = await User.findById(req.userId);
      if (user) {
        const emailResult = await sendOrderConfirmation(order, user);
        if (!emailResult.success) {
          console.warn(`⚠️ Email could not be sent to ${user.email}. Order was still created successfully.`);
          console.warn(`⚠️ Possible reasons: Email not verified in Resend, or Resend API issue.`);
          console.warn(`💡 Note: Resend's test mode may only send to verified email addresses.`);
        }
      }

      res.json({
        success: true,
        order,
        message: 'Payment confirmed. Order is being processed.'
      });

    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/orders
 * Get user's orders
 */
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.userId })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/orders/:id
 * Get single order
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images')
      .populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found' 
      });
    }

    // Verify order belongs to user (unless admin)
    if (order.customer._id.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Not authorized to access this order' 
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status (admin only)
 * 
 * Body: { status }
 */
router.put('/:id/status',
  admin,
  [
    body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          errors: errors.array(),
          message: 'Validation failed' 
        });
      }

      const { status, trackingNumber } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ 
          message: 'Order not found' 
        });
      }

      // Update status
      order.status = status;
      
      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
      }

      // Set timestamps based on status
      if (status === 'shipped') {
        order.shippedAt = new Date();
      } else if (status === 'delivered') {
        order.deliveredAt = new Date();
      } else if (status === 'cancelled') {
        order.cancelledAt = new Date();
      }

      await order.save();

      // Send email notification for status updates
      const user = await User.findById(order.customer);
      if (user && (status === 'shipped' || status === 'delivered' || status === 'cancelled')) {
        const emailResult = await sendOrderStatusUpdate(order, user, status);
        if (!emailResult.success) {
          console.warn(`⚠️ Status update email could not be sent to ${user.email}. Order status was still updated.`);
          console.warn(`⚠️ Possible reasons: Email not verified in Resend, or Resend API issue.`);
        }
      }

      res.json({
        success: true,
        order,
        message: 'Order status updated'
      });

    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * DELETE /api/orders/:id
 * Cancel/delete a pending order (only if payment not completed)
 */
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found' 
      });
    }

    // Verify order belongs to user
    if (order.customer.toString() !== req.userId.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to cancel this order' 
      });
    }

    // Only allow deletion of pending orders that haven't been paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ 
        message: 'Cannot cancel paid orders. Please contact support for refunds.' 
      });
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ 
        message: 'Cannot cancel shipped or delivered orders' 
      });
    }

    // Delete the order
    await order.deleteOne();

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/orders/admin/all
 * Get all orders (admin only)
 */
router.get('/admin/all',
  admin,
  async (req, res) => {
    try {
      const { status, paymentStatus, page = 1, limit = 20 } = req.query;
      
      const queryObj = {};
      if (status) queryObj.status = status;
      if (paymentStatus) queryObj.paymentStatus = paymentStatus;

      const skip = (Number(page) - 1) * Number(limit);

      const orders = await Order.find(queryObj)
        .populate('customer', 'name email')
        .populate('items.product', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Order.countDocuments(queryObj);

      res.json({
        success: true,
        count: orders.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        orders
      });

    } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;

