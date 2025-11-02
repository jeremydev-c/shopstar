const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: false // Will be auto-generated in pre-save hook
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true // Snapshot of product name at time of order
    },
    price: {
      type: Number,
      required: true // Snapshot of price at time of order
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    variant: {
      type: Object // e.g., { size: "Large", color: "Blue" }
    },
    image: String // Snapshot of product image
  }],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  shipping: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Shipping cannot be negative']
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String, // Stripe Payment Intent ID (client_secret)
    required: false // Will be set after Stripe payment intent is created
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'USA' }
  },
  trackingNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  // Order timeline
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 }); // Recent orders first

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    // Format: ORD-YYYY-MMDD-HHMMSS-XXXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    this.orderNumber = `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  }
  next();
});

// Method to calculate totals
orderSchema.methods.calculateTotals = function(taxRate = 0.08, shippingCost = 0) {
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  this.tax = Math.round(this.subtotal * taxRate * 100) / 100;
  this.shipping = shippingCost;
  this.total = Math.round((this.subtotal + this.tax + this.shipping) * 100) / 100;
  
  return this;
};

module.exports = mongoose.model('Order', orderSchema);

