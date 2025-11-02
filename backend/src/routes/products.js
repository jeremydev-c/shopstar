const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/products
 * Get all products (public route - anyone can view)
 * 
 * Query parameters:
 * - category: Filter by category ID
 * - search: Search by name/description
 * - minPrice, maxPrice: Filter by price range
 * - status: Filter by status (active, draft, archived)
 * - featured: Get only featured products
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 12)
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      status = 'active',
      featured,
      page = 1,
      limit = 12
    } = req.query;

    // Build query object
    const queryObj = {};

    // Filter by category
    if (category) {
      queryObj.category = category;
    }

    // Filter by status
    if (status) {
      queryObj.status = status;
    }

    // Filter by featured
    if (featured === 'true') {
      queryObj.featured = true;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }

    // Text search
    if (search) {
      queryObj.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    let productsQuery = Product.find(queryObj)
      .populate('category', 'name slug')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // If searching, sort by relevance
    if (search) {
      productsQuery = productsQuery.sort({ score: { $meta: 'textScore' } });
    }

    const products = await productsQuery;
    const total = await Product.countDocuments(queryObj);

    res.json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/products/:id
 * Get single product by ID (public route)
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found' 
      });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/products
 * Create new product (admin only)
 */
router.post('/',
  protect,
  admin,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('sku').trim().notEmpty().withMessage('SKU is required').toUpperCase(),
    body('category').isMongoId().withMessage('Valid category ID is required'),
    body('inventory.quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
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

      const product = await Product.create(req.body);

      res.status(201).json({
        success: true,
        product,
        message: 'Product created successfully'
      });

    } catch (error) {
      console.error('Create product error:', error);
      
      // Handle duplicate SKU error
      if (error.code === 11000) {
        return res.status(400).json({ 
          message: 'Product with this SKU already exists' 
        });
      }

      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * PUT /api/products/:id
 * Update product (admin only)
 */
router.put('/:id',
  protect,
  admin,
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('category', 'name slug');

      if (!product) {
        return res.status(404).json({ 
          message: 'Product not found' 
        });
      }

      res.json({
        success: true,
        product,
        message: 'Product updated successfully'
      });

    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * DELETE /api/products/:id
 * Delete product (admin only)
 */
router.delete('/:id',
  protect,
  admin,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ 
          message: 'Product not found' 
        });
      }

      // Soft delete - set status to archived instead of actually deleting
      product.status = 'archived';
      await product.save();

      res.json({
        success: true,
        message: 'Product archived successfully'
      });

    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;

