const express = require('express');
const branchController = require('../controllers/branchController');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router({ mergeParams: true });

// Import sub-routers
const invoiceRoutes = require('./invoiceRoutes');
const categoryRoutes = require('./categoryRoutes'); // Consider separating category routes

const {
  createBranch,
  getBranches,
  getBranchDetails, // Added this controller
  updateBranch,
  deleteBranch
} = branchController;

// =============================
// 📦 Branch Routes
// =============================

// Create and get all branches for a company
router.route('/')
  .post(createBranch)        // POST /api/companies/:companyId/branches
  .get(getBranches);         // GET /api/companies/:companyId/branches

// Branch-specific operations
router.route('/:branchId')
  .get(getBranchDetails)     // GET /api/companies/:companyId/branches/:branchId
  .put(updateBranch)         // PUT /api/companies/:companyId/branches/:branchId
  .delete(deleteBranch);     // DELETE /api/companies/:companyId/branches/:branchId

// =============================
// 🗂️ Category Routes (nested)
// =============================
// Consider moving these to a separate categoryRoutes file
router.use('/:branchId/categories', categoryRoutes);

// In your branchRoutes.js file, replace the category section with:

// =============================
// 🗂️ Category Routes (nested)
// =============================
router.route('/:branchId/categories')
  .post(branchController.addCategory);  // POST /api/companies/:companyId/branches/:branchId/categories

router.route('/:branchId/categories/:categoryId')
  .put(branchController.updateCategory)   // PUT /api/companies/:companyId/branches/:branchId/categories/:categoryId
  .delete(branchController.deleteCategory); // DELETE /api/companies/:companyId/branches/:branchId/categories/:categoryId



  // =============================
// 🏷️ Subcategory Routes (nested)
// =============================
router.route('/:branchId/categories/:categoryId/subcategories')
  .post(branchController.addSubcategory);  // POST /api/companies/:companyId/branches/:branchId/categories/:categoryId/subcategories

router.route('/:branchId/categories/:categoryId/subcategories/:subcategoryId')
  .put(branchController.updateSubcategory)   // PUT /api/companies/:companyId/branches/:branchId/categories/:categoryId/subcategories/:subcategoryId
  .delete(branchController.deleteSubcategory); // DELETE /api/companies/:companyId/branches/:branchId/categories/:categoryId/subcategories/:subcategoryId
// =============================
// 🧾 Invoice Routes (nested)
// =============================
router.use('/:branchId/invoices', invoiceRoutes);



// =============================
// 📊 Branch Performance Report
// =============================
router.get('/:branchId/report', branchController.generateBranchPerformanceReport);


// Middleware to validate clientType
const validateClientType = (req, res, next) => {
  const validTypes = ['all', 'regular', 'non-regular'];
  if (req.query.clientType && !validTypes.includes(req.query.clientType)) {
    return res.status(400).json({ 
      message: 'Invalid clientType',
      validTypes
    });
  }
  next();
};

// Then use it in your route:

router.get('/:branchId/report', 
  validateClientType,
  branchController.generateBranchPerformanceReport
);

// =============================
// 📊 Import/Export Routes
// =============================
router.post(
  '/:branchId/categories/:categoryId/import',
  upload.single('file'),
  branchController.importSubcategories
);

module.exports = router;