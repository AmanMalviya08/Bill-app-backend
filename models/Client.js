/** @format */
const mongoose = require("mongoose");
const Branch = require("./Branch");
const Company = require("./Company"); // assuming this exists
// No need to import Subcategory directly because it's embedded inside Branch > Category > Subcategory

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    address: String,
    isRegular: { type: Boolean, default: false },
    discountPercentage: { type: Number, default: 0 },
    gstFromSubcategory: { type: Number, default: 0 }, // GST fetched from subcategory
    companyGSTNumber: { type: String }, // auto-filled from company
    deletedAt: { type: Date, default: null },

    // 🔗 References
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    categoryId: { type: mongoose.Schema.Types.ObjectId }, // to locate category inside branch
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, required: true }, // to locate subcategory inside category
  },
  { timestamps: true }
);

// 🧠 Pre-save hook to auto-fetch GST and GST number
clientSchema.pre("save", async function (next) {
  try {
    // Fetch company GST number
    const company = await mongoose.model("Company").findById(this.company);
    if (!company) {
      throw new Error("Company not found");
    }
    this.companyGSTNumber = company.gstNumber || "";

    // Fetch subcategory GST from branch
    const branch = await mongoose.model("Branch").findById(this.branch);
    if (!branch) {
      throw new Error("Branch not found");
    }

    const category = branch.categories.id(this.categoryId);
    if (!category || category.deletedAt) {
      throw new Error("Category not found or deleted");
    }

    const subcategory = category.subcategories.id(this.subcategoryId);
    if (!subcategory || subcategory.deletedAt) {
      throw new Error("Subcategory not found or deleted");
    }

    this.gstFromSubcategory = subcategory.gst || 0;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Client", clientSchema);
