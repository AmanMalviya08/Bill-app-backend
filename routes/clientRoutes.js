const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createClient,
  getClients,
  getClient,
  updateClient,
  markClientAsRegular,
  deleteClient,
  getClientWithPrices,
  getClientInvoices  // Add this new import
} = require('../controllers/clientController');

// Company-specific client routes
router.post('/', createClient);                        // POST /api/companies/:companyId/clients
router.get('/', getClients);                           // GET  /api/companies/:companyId/clients

// Specific client actions
router.get('/:clientId', getClient);                   // GET  /api/companies/:companyId/clients/:clientId
router.put('/:clientId', updateClient);                // PUT  /api/companies/:companyId/clients/:clientId
router.patch('/:clientId/regular', markClientAsRegular); // PATCH /api/companies/:companyId/clients/:clientId/regular
router.delete('/:clientId', deleteClient);             // DELETE /api/companies/:companyId/clients/:clientId

// Get client + prices
router.get('/:clientId/prices', getClientWithPrices);  // GET /api/companies/:companyId/clients/:clientId/prices

// Client invoices
router.get('/:clientId/invoices', getClientInvoices);  // GET /api/companies/:companyId/clients/:clientId/invoices

module.exports = router;