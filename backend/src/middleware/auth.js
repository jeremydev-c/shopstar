const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware - protect routes
 * 
 * This middleware checks if a user is authenticated by verifying their JWT token.
 * 
 * How it works:
 * 1. Gets token from Authorization header
 * 2. Verifies token is valid using JWT_SECRET
 * 3. Finds user in database
 * 4. Attaches user to request object
 * 5. Calls next() to continue to the route handler
 */
const protect = async (req, res, next) => {
  try {
    // Step 1: Get token from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;
    
    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Not authorized - No token provided' 
      });
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1]; // Gets the token part after "Bearer "

    // Step 2: Verify token
    // jwt.verify() checks:
    // - Token is valid (not tampered with)
    // - Token hasn't expired
    // - Token was signed with our JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 3: Find user in database
    // decoded.userId comes from when we created the token (in auth routes)
    // We exclude password field for security
    const user = await User.findById(decoded.userId).select('-password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({ 
        message: 'Not authorized - User not found' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Not authorized - User account is inactive' 
      });
    }

    // Step 4: Attach user to request object
    // Now the route handler can access req.user
    req.user = user;
    req.userId = user._id; // Also add userId for convenience

    // Step 5: Continue to the next middleware/route handler
    next();

  } catch (error) {
    // Handle different JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Not authorized - Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Not authorized - Token expired' 
      });
    }

    // Any other error
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Server error during authentication' 
    });
  }
};

/**
 * Admin Authorization Middleware
 * 
 * This checks if the authenticated user has admin role.
 * Must be used AFTER protect middleware.
 */
const admin = (req, res, next) => {
  // Check if user is authenticated (protect middleware should have run first)
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Not authorized - Please authenticate first' 
    });
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Forbidden - Admin access required' 
    });
  }

  // User is admin, continue
  next();
};

module.exports = { protect, admin };
