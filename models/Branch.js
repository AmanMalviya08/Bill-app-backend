// models/Branch.js
const mongoose = require('mongoose');

// Reuse subcategory schema for embedding
const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  gst: {
    type: Number,
    default: 0
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Embedded category schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  subcategories: [subcategorySchema],
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: String,
  managerName: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  categories: [categorySchema], // 🔥 Embedded categories here
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });


// models/Branch.js

// ... (existing code remains the same)

branchSchema.methods.importSubcategories = async function(categoryId, subcategoriesData) {
  const category = this.categories.id(categoryId);
  if (!category || category.deletedAt) {
    throw new Error('Category not found or deleted');
  }

  // Validate and format subcategories data
  const validatedSubcategories = subcategoriesData.map(subcat => ({
    name: subcat.name || `Product-${Math.random().toString(36).substr(2, 5)}`,
    description: subcat.description || '',
    price: Number(subcat.price) || 0,
    discount: Number(subcat.discount) || 0,
    gst: Number(subcat.gst) || 0
  }));

  // Add new subcategories
  category.subcategories.push(...validatedSubcategories);
  await this.save();
  return this;
};

module.exports = mongoose.model('Branch', branchSchema);
