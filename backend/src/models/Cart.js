const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true // One cart per user
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    variant: {
      type: Object // e.g., { size: "Large", color: "Blue" }
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Note: user index is automatically created by unique: true above

// Method to calculate cart total
cartSchema.methods.calculateTotal = async function() {
  await this.populate('items.product');
  
  let total = 0;
  this.items.forEach(item => {
    if (item.product && item.product.price) {
      total += item.product.price * item.quantity;
    }
  });
  
  return Math.round(total * 100) / 100;
};

// Method to get cart item count
cartSchema.methods.getItemCount = function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
};

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity = 1, variant = null) {
  // Check if item already exists
  const existingItem = this.items.find(item => 
    item.product.toString() === productId.toString() &&
    JSON.stringify(item.variant) === JSON.stringify(variant)
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.addedAt = new Date();
  } else {
    this.items.push({
      product: productId,
      quantity,
      variant,
      addedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId.toString());
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.find(item => item._id.toString() === itemId.toString());
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }
    item.quantity = quantity;
    return this.save();
  }
  throw new Error('Item not found in cart');
};

// Method to clear cart
cartSchema.methods.clear = function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);

