const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS middleware - Allow all origins in development
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || 'http://localhost:3000')
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Import webhook routes FIRST (before express.json())
// Stripe webhooks need raw body for signature verification
const webhookRoutes = require('./src/routes/webhooks');
app.use('/api/webhooks', webhookRoutes);

// Now add JSON middleware for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware - Shows all requests in terminal
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log('\n📥 ==========================================');
  console.log(`📥 ${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`);
  
  // Log query params if any
  if (Object.keys(req.query).length > 0) {
    console.log(`📥 Query:`, req.query);
  }
  
  // Log body if any (except for passwords)
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyToLog = { ...req.body };
    // Don't log passwords
    if (bodyToLog.password) bodyToLog.password = '***HIDDEN***';
    console.log(`📥 Body:`, JSON.stringify(bodyToLog, null, 2));
  }
  
  // Log response when it finishes
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    console.log(`📤 Status: ${res.statusCode}`);
    console.log(`📤 Response Time: ${duration}ms`);
    
    // Try to log response (but limit size)
    try {
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      // Only show first 200 chars of response
      const responseStr = JSON.stringify(responseData).substring(0, 200);
      if (responseStr.length >= 200) {
        console.log(`📤 Response: ${responseStr}...`);
      } else {
        console.log(`📤 Response:`, responseData);
      }
    } catch (e) {
      // If response isn't JSON, just show it's there
      console.log(`📤 Response: [Non-JSON response]`);
    }
    
    console.log(`📤 ==========================================\n`);
    
    originalSend.call(this, data);
  };
  
  next();
});

// Health check - Like checking if server is alive
app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        message: 'ShopStar API is running!',
        timestamp: new Date().toISOString()
      });
});

// Database connection - Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoURI);
    console.log(`💾 MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    // In test mode, don't exit - tests will handle their own connections
    if (process.env.NODE_ENV === 'test') {
      // Tests handle their own database connections, so we can ignore this
      return;
    }
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Import routes - These are like doors to different features
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const cartRoutes = require('./src/routes/cart');
const orderRoutes = require('./src/routes/orders');
const categoryRoutes = require('./src/routes/categories');
const userRoutes = require('./src/routes/users');

// Connect routes - Map URLs to route files
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

// Error handling - Catches any errors that slip through
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server - Boot everything up!
const startServer = async () => {
  try {
    await connectDB(); // Connect to database first
    app.listen(PORT, () => {
      console.log(`🚀 ShopStar API running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Only start server if not in test mode and not already running
// Tests will handle their own database connections
if (process.env.NODE_ENV !== 'test' && !module.parent) {
  startServer();
}

module.exports = app;

