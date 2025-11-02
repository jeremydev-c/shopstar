const express = require('express');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/users/admin/all
 * Get all users (admin only)
 */
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Don't return passwords
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/users/:id/role
 * Update user role (admin only)
 */
router.put('/:id/role',
  protect,
  admin,
  [
    param('id').isMongoId().withMessage('Valid user ID is required'),
    body('role').isIn(['customer', 'admin']).withMessage('Role must be either customer or admin')
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

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ 
          message: 'User not found' 
        });
      }

      // Don't allow removing the last admin
      if (req.body.role === 'customer' && user.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          return res.status(400).json({ 
            message: 'Cannot remove the last admin user' 
          });
        }
      }

      user.role = req.body.role;
      await user.save();

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        message: 'User role updated successfully'
      });

    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;

