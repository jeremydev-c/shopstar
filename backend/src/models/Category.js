const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String, // Cloudinary URL
    default: ''
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null // null = top-level category
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1 });

// Virtual to get all subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

module.exports = mongoose.model('Category', categorySchema);

