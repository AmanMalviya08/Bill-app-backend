const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
} = require('../controllers/companyController');

const branchRoutes = require('./branchRoutes');
const clientRoutes = require('./clientRoutes'); // ✅ Import client routes

// 🖼️ Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// =============================
// 🏢 Company CRUD routes
// =============================
router.post('/', upload.single('backgroundPhoto'), createCompany);
router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.put('/:id', upload.single('backgroundPhoto'), updateCompany);
router.delete('/:id', deleteCompany);

// =============================
// 🔗 Nested routes
// =============================

// ✅ Mount client routes: /api/companies/:companyId/clients
router.use('/:companyId/clients', clientRoutes);

// ✅ Mount branch routes: /api/companies/:companyId/branches
// (This will also handle all invoice routes nested under branches)
router.use('/:companyId/branches', branchRoutes);

module.exports = router;