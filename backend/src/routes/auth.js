const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Cart = require('../models/Cart');

const router = express.Router();

/**
 * Generate JWT Token
 * 
 * Creates a signed token containing the user ID.
 * Token expires in 7 days (configurable via JWT_EXPIRE env var).
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * POST /api/auth/register
 * 
 * Register a new user
 * 
 * Steps:
 * 1. Validate input (email format, password strength, etc.)
 * 2. Check if user already exists
 * 3. Create new user (password gets hashed automatically via User model pre-save hook)
 * 4. Create empty cart for user
 * 5. Generate JWT token
 * 6. Return token and user data (without password)
 */
router.post('/register', 
  // Validation middleware - checks input before route handler runs
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(), // Converts to lowercase, trims
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          errors: errors.array(),
          message: 'Validation failed' 
        });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User already exists with this email' 
        });
      }

      // Create new user
      // Password will be automatically hashed by User model's pre-save hook
      const user = await User.create({
        name,
        email,
        password // Will be hashed before saving
      });

      // Create empty cart for new user
      await Cart.create({
        user: user._id,
        items: []
      });

      // Generate JWT token
      const token = generateToken(user._id);

      // Return user data (password is excluded automatically via select: false in model)
      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        message: 'User registered successfully'
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: 'Server error during registration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/auth/login
 * 
 * Login existing user
 * 
 * Steps:
 * 1. Validate input
 * 2. Find user by email (include password for comparison)
 * 3. Check if user exists
 * 4. Compare password using bcrypt
 * 5. Check if user is active
 * 6. Generate JWT token
 * 7. Return token and user data
 */
router.post('/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          errors: errors.array(),
          message: 'Validation failed' 
        });
      }

      const { email, password } = req.body;

      // Find user and include password (normally excluded)
      // We need it to compare passwords
      const user = await User.findOne({ email }).select('+password');

      // Check if user exists
      if (!user) {
        return res.status(401).json({ 
          message: 'Invalid email or password' 
        });
      }

      // Compare password using the method we defined in User model
      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        return res.status(401).json({ 
          message: 'Invalid email or password' 
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ 
          message: 'Account is inactive. Please contact support.' 
        });
      }

      // Generate JWT token
      const token = generateToken(user._id);

      // Return user data (password excluded automatically)
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        message: 'Login successful'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        message: 'Server error during login',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/auth/me
 * 
 * Get current user profile
 * Requires authentication (protect middleware)
 * 
 * Returns the authenticated user's information
 */
router.get('/me', require('../middleware/auth').protect, async (req, res) => {
  try {
    // User is already attached to req by protect middleware
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

