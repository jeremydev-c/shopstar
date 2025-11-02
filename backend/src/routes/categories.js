const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/categories
 * Get all categories (public - anyone can view)
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/categories/:id
 * Get single category with subcategories
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug')
      .populate('subcategories', 'name slug description');

    if (!category) {
      return res.status(404).json({ 
        message: 'Category not found' 
      });
    }

    res.json({
      success: true,
      category
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/categories
 * Create new category (admin only)
 */
router.post('/',
  protect,
  admin,
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('slug').optional().trim().toLowerCase(),
    body('description').optional()
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

      const { name, slug: providedSlug, description, parent, image } = req.body;

      // Auto-generate slug from name if not provided
      let slug = providedSlug;
      if (!slug) {
        slug = name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
          .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      }

      // Check if category with same slug exists
      const existing = await Category.findOne({ slug });
      if (existing) {
        return res.status(400).json({ 
          message: 'Category with this slug already exists' 
        });
      }

      const category = await Category.create({
        name,
        slug,
        description,
        parent: parent || null,
        image: image || ''
      });

      res.status(201).json({
        success: true,
        category,
        message: 'Category created successfully'
      });

    } catch (error) {
      console.error('Create category error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          message: 'Category with this name or slug already exists' 
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
 * PUT /api/categories/:id
 * Update category (admin only)
 */
router.put('/:id',
  protect,
  admin,
  async (req, res) => {
    try {
      const category = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('parent', 'name slug');

      if (!category) {
        return res.status(404).json({ 
          message: 'Category not found' 
        });
      }

      res.json({
        success: true,
        category,
        message: 'Category updated successfully'
      });

    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * DELETE /api/categories/:id
 * Delete category (admin only - soft delete)
 */
router.delete('/:id',
  protect,
  admin,
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);

      if (!category) {
        return res.status(404).json({ 
          message: 'Category not found' 
        });
      }

      // Soft delete - set isActive to false
      category.isActive = false;
      await category.save();

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });

    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;

