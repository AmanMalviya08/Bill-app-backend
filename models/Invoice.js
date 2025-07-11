const mongoose = require('mongoose');

// Subdocument schema for invoice items
const invoiceItemSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true } // ((price * quantity) - discount) + gst
});

// Main Invoice schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    // unique: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  // Linked references
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  client: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Client'
    },
    name: String,
    email: String
    // Optional: phone, address if needed
  },

  // Embedded invoice items
  items: [invoiceItemSchema],

  // Summary
  subtotal: { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  totalGst: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },

  // Payment info
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'credit'],
    default: 'cash'
  },

  // Client info
  clientType: {
    type: String,
    enum: ['regular', 'non-regular'],
    default: 'non-regular'
  },

  companyGST: {
    type: String // Auto-filled from Company
  },

  notes: String,

  dueDate: {
    type: Date
  },

  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // createdAt and updatedAt
});

module.exports = mongoose.model('Invoice', invoiceSchema);
