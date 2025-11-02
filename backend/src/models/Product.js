const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative']
  },
  sku: {
    type: String,
    unique: true,
    required: [true, 'SKU is required'],
    uppercase: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  images: [{
    type: String, // Cloudinary URLs
    required: true
  }],
  variants: [{
    name: { type: String, required: true }, // e.g., "Size", "Color"
    options: [{ type: String, required: true }] // e.g., ["Small", "Medium", "Large"]
  }],
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Threshold cannot be negative']
    },
    trackQuantity: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  seo: {
    title: String,
    description: String
  },
  // Sales tracking
  salesCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }, // Include virtuals in JSON output
  toObject: { virtuals: true } // Include virtuals in object output
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // Text search
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ sku: 1 }, { unique: true });

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function() {
  if (!this.inventory.trackQuantity) return true;
  return this.inventory.quantity > 0;
});

// Virtual for checking if product is low stock
productSchema.virtual('isLowStock').get(function() {
  if (!this.inventory.trackQuantity) return false;
  return this.inventory.quantity <= this.inventory.lowStockThreshold;
});

// Method to reduce inventory
productSchema.methods.reduceInventory = function(quantity) {
  if (this.inventory.trackQuantity) {
    if (this.inventory.quantity < quantity) {
      throw new Error('Insufficient inventory');
    }
    this.inventory.quantity -= quantity;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to increase inventory
productSchema.methods.increaseInventory = function(quantity) {
  if (this.inventory.trackQuantity) {
    this.inventory.quantity += quantity;
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Product', productSchema);

