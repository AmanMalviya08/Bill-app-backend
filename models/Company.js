    const mongoose = require('mongoose');

    const companySchema = new mongoose.Schema({
      name: {
        type: String,
        required: true
      },
      gstNumber: {
        type: String,
        required: true,
        unique: true
      },
      address: {
        type: String,
        required: true
      },
      ownerName: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        default: ''
      },
      email: {
        type: String,
        default: ''
      },
      backgroundPhoto: {
        type: String, // Store file path
        default: ''
      },
      deletedAt: {
        type: Date,
        default: null
      }
    }, { timestamps: true });

    module.exports = mongoose.model('Company', companySchema);
// This schema defines a Company model with fields for name, GST number, address, owner name, phone, email, and background photo.