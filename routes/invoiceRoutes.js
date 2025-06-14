const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  getDetailedInvoiceReport,
  createInvoice,
  getBranchInvoices,
  getInvoiceDetails,
  getClientInvoices,
  getReports,
  printInvoice,
  updateInvoice,
  deleteInvoice
} = require('../controllers/invoiceController');

// Create invoice under company & branch
router.post('/', createInvoice);

// Get all invoices for a branch
router.get('/', getBranchInvoices);

// Get invoice details
router.get('/:invoiceId', (req, res, next) => {
  console.log('Invoice route hit:', req.originalUrl);
  next();
}, getInvoiceDetails);

// Update invoice
router.put('/:invoiceId', updateInvoice);

// Soft delete invoice
router.delete('/:invoiceId', deleteInvoice);

// Print invoice (print-friendly)
router.get('/:invoiceId/print', printInvoice);

// Get all invoices for a client (by client id query param)
router.get('/client/all', getClientInvoices);



// Get sales and product reports (date range via query params)
router.get('/reports', getReports);

// Add this to your existing invoiceRoutes.js
router.get('/report', getDetailedInvoiceReport);


// ... other imports ...

// Add this route for branch performance report
// router.get('/branches/:branchId/report', getDetailedInvoiceReport);


module.exports = router;