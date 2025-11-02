const express = require('express');
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All cart routes require authentication
router.use(protect);

/**
 * GET /api/cart
 * Get user's cart
 * Requires authentication
 */
router.get('/', async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId })
      .populate('items.product', 'name price images inventory status');

    // If no cart exists, create one
    if (!cart) {
      cart = await Cart.create({
        user: req.userId,
        items: []
      });
    }

    // Calculate total
    const total = await cart.calculateTotal();
    const itemCount = cart.getItemCount();

    res.json({
      success: true,
      cart: {
        items: cart.items,
        itemCount,
        total
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/cart
 * Add item to cart
 * 
 * Body: { productId, quantity, variant }
 */
router.post('/',
  [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
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

      const { productId, quantity = 1, variant = null } = req.body;

      // Check if product exists and is available
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ 
          message: 'Product not found' 
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({ 
          message: 'Product is not available' 
        });
      }

      // Check inventory
      if (product.inventory.trackQuantity && product.inventory.quantity < quantity) {
        return res.status(400).json({ 
          message: `Only ${product.inventory.quantity} items available` 
        });
      }

      // Get or create cart
      let cart = await Cart.findOne({ user: req.userId });
      if (!cart) {
        cart = await Cart.create({
          user: req.userId,
          items: []
        });
      }

      // Add item to cart
      await cart.addItem(productId, quantity, variant);

      // Populate product details
      await cart.populate('items.product', 'name price images inventory status');

      const total = await cart.calculateTotal();
      const itemCount = cart.getItemCount();

      res.json({
        success: true,
        message: 'Item added to cart',
        cart: {
          items: cart.items,
          itemCount,
          total
        }
      });

    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * PUT /api/cart/:itemId
 * Update cart item quantity
 * 
 * Body: { quantity }
 */
router.put('/:itemId',
  [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
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

      const { quantity } = req.body;
      const cart = await Cart.findOne({ user: req.userId });

      if (!cart) {
        return res.status(404).json({ 
          message: 'Cart not found' 
        });
      }

      // Find the item
      const item = cart.items.find(item => item._id.toString() === req.params.itemId);
      if (!item) {
        return res.status(404).json({ 
          message: 'Item not found in cart' 
        });
      }

      // Check product inventory
      const product = await Product.findById(item.product);
      if (product.inventory.trackQuantity && product.inventory.quantity < quantity) {
        return res.status(400).json({ 
          message: `Only ${product.inventory.quantity} items available` 
        });
      }

      // Update quantity
      await cart.updateItemQuantity(req.params.itemId, quantity);

      // Populate product details
      await cart.populate('items.product', 'name price images inventory status');

      const total = await cart.calculateTotal();
      const itemCount = cart.getItemCount();

      res.json({
        success: true,
        message: 'Cart updated',
        cart: {
          items: cart.items,
          itemCount,
          total
        }
      });

    } catch (error) {
      console.error('Update cart error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * DELETE /api/cart/:itemId
 * Remove item from cart
 */
router.delete('/:itemId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({ 
        message: 'Cart not found' 
      });
    }

    await cart.removeItem(req.params.itemId);

    // Populate product details
    await cart.populate('items.product', 'name price images inventory status');

    const total = await cart.calculateTotal();
    const itemCount = cart.getItemCount();

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: {
        items: cart.items,
        itemCount,
        total
      }
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete('/', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({ 
        message: 'Cart not found' 
      });
    }

    await cart.clear();

    res.json({
      success: true,
      message: 'Cart cleared',
      cart: {
        items: [],
        itemCount: 0,
        total: 0
      }
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

