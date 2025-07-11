// services/invoiceService.js
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Branch = require('../models/Branch');
const Company = require('../models/Company');

class InvoiceService {
  
  /**
   * Create invoice with multiple products
   * @param {Object} invoiceData - Invoice creation data
   * @param {Array} items - Array of items with subcategory details
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoiceWithMultipleProducts(invoiceData, items) {
    try {
      // Validate required data
      if (!items || items.length === 0) {
        throw new Error('At least one item is required to create an invoice');
      }

      // Fetch client details
      const client = await Client.findById(invoiceData.clientId)
        .populate('company')
        .populate('branch');
      
      if (!client) {
        throw new Error('Client not found');
      }

      // Fetch branch with categories and subcategories
      const branch = await Branch.findById(invoiceData.branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      // Fetch company details
      const company = await Company.findById(invoiceData.companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Process each item and validate subcategories
      const processedItems = await this.processInvoiceItems(items, branch, client);

      // Generate invoice number
      const invoiceNumber = await Invoice.generateInvoiceNumber(
        invoiceData.companyId, 
        invoiceData.branchId
      );

      // Create invoice object
      const invoice = new Invoice({
        invoiceNumber,
        date: invoiceData.date || new Date(),
        company: invoiceData.companyId,
        branch: invoiceData.branchId,
        client: {
          _id: client._id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          isRegular: client.isRegular,
          discountPercentage: client.discountPercentage
        },
        items: processedItems,
        paymentMethod: invoiceData.paymentMethod || 'cash',
        clientType: client.isRegular ? 'regular' : 'non-regular',
        companyGST: company.gstNumber,
        notes: invoiceData.notes || '',
        dueDate: invoiceData.dueDate,
        additionalDiscount: invoiceData.additionalDiscount || 0,
        additionalCharges: invoiceData.additionalCharges || 0,
        createdBy: invoiceData.createdBy
      });

      // Save invoice (pre-save hook will calculate totals)
      await invoice.save();
      
      return invoice;
    } catch (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  }

  /**
   * Process and validate invoice items
   * @param {Array} items - Raw items data
   * @param {Object} branch - Branch document with categories
   * @param {Object} client - Client document
   * @returns {Array} Processed items
   */
  async processInvoiceItems(items, branch, client) {
    const processedItems = [];

    for (const item of items) {
      // Find category and subcategory
      const category = branch.categories.id(item.categoryId);
      if (!category || category.deletedAt) {
        throw new Error(`Category not found: ${item.categoryId}`);
      }

      const subcategory = category.subcategories.id(item.subcategoryId);
      if (!subcategory || subcategory.deletedAt) {
        throw new Error(`Subcategory not found: ${item.subcategoryId}`);
      }

      // Calculate pricing
      const basePrice = subcategory.price;
      const quantity = item.quantity || 1;
      
      // Apply client discount if regular client
      let discountPercentage = item.discountPercentage || 0;
      if (client.isRegular && client.discountPercentage > 0) {
        discountPercentage = Math.max(discountPercentage, client.discountPercentage);
      }

      // Use subcategory GST or item-specific GST
      const gstPercentage = item.gstPercentage || subcategory.gst || 0;

      const processedItem = {
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId,
        name: item.name || subcategory.name,
        description: item.description || subcategory.description,
        basePrice: basePrice,
        quantity: quantity,
        unitPrice: item.unitPrice || basePrice, // Allow custom pricing
        discountPercentage: discountPercentage,
        gstPercentage: gstPercentage,
        // Calculated fields will be set by pre-save hook
      };

      processedItems.push(processedItem);
    }

    return processedItems;
  }

  /**
   * Add item to existing invoice
   * @param {String} invoiceId - Invoice ID
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} Updated invoice
   */
  async addItemToInvoice(invoiceId, itemData) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Fetch branch to validate subcategory
      const branch = await Branch.findById(invoice.branch);
      const client = await Client.findById(invoice.client._id);

      const processedItems = await this.processInvoiceItems([itemData], branch, client);
      
      invoice.addItem(processedItems[0]);
      await invoice.save();
      
      return invoice;
    } catch (error) {
      throw new Error(`Failed to add item to invoice: ${error.message}`);
    }
  }

  /**
   * Update item quantity in invoice
   * @param {String} invoiceId - Invoice ID
   * @param {String} itemId - Item ID
   * @param {Number} newQuantity - New quantity
   * @returns {Promise<Object>} Updated invoice
   */
  async updateItemQuantity(invoiceId, itemId, newQuantity) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      invoice.updateItemQuantity(itemId, newQuantity);
      await invoice.save();
      
      return invoice;
    } catch (error) {
      throw new Error(`Failed to update item quantity: ${error.message}`);
    }
  }

  /**
   * Remove item from invoice
   * @param {String} invoiceId - Invoice ID
   * @param {String} itemId - Item ID
   * @returns {Promise<Object>} Updated invoice
   */
  async removeItemFromInvoice(invoiceId, itemId) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.items.length <= 1) {
        throw new Error('Cannot remove the last item from invoice');
      }

      invoice.removeItem(itemId);
      await invoice.save();
      
      return invoice;
    } catch (error) {
      throw new Error(`Failed to remove item from invoice: ${error.message}`);
    }
  }

  /**
   * Get invoice with populated data
   * @param {String} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice with populated data
   */
  async getInvoiceById(invoiceId) {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('company', 'name gstNumber address')
        .populate('branch', 'name location')
        .populate('client._id', 'name email phone address');
      
      return invoice;
    } catch (error) {
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }
  }

  /**
   * Get invoices by client
   * @param {String} clientId - Client ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of invoices
   */
  async getInvoicesByClient(clientId, options = {}) {
    try {
      const query = { 'client._id': clientId, deletedAt: null };
      
      if (options.paymentStatus) {
        query.paymentStatus = options.paymentStatus;
      }
      
      if (options.dateFrom || options.dateTo) {
        query.date = {};
        if (options.dateFrom) query.date.$gte = new Date(options.dateFrom);
        if (options.dateTo) query.date.$lte = new Date(options.dateTo);
      }

      const invoices = await Invoice.find(query)
        .sort({ date: -1 })
        .limit(options.limit || 50)
        .skip(options.skip || 0);
      
      return invoices;
    } catch (error) {
      throw new Error(`Failed to fetch client invoices: ${error.message}`);
    }
  }

  /**
   * Calculate invoice summary statistics
   * @param {String} companyId - Company ID
   * @param {String} branchId - Branch ID (optional)
   * @param {Object} dateRange - Date range filter
   * @returns {Promise<Object>} Summary statistics
   */
  async getInvoiceSummary(companyId, branchId = null, dateRange = {}) {
    try {
      const matchQuery = { 
        company: companyId, 
        deletedAt: null 
      };
      
      if (branchId) matchQuery.branch = branchId;
      
      if (dateRange.from || dateRange.to) {
        matchQuery.date = {};
        if (dateRange.from) matchQuery.date.$gte = new Date(dateRange.from);
        if (dateRange.to) matchQuery.date.$lte = new Date(dateRange.to);
      }

      const summary = await Invoice.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            totalAmount: { $sum: '$grandTotal' },
            totalPaid: { $sum: '$paidAmount' },
            totalPending: { $sum: '$balanceAmount' },
            avgInvoiceValue: { $avg: '$grandTotal' },
            pendingInvoices: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
            },
            paidInvoices: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
            }
          }
        }
      ]);

      return summary[0] || {
        totalInvoices: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0,
        avgInvoiceValue: 0,
        pendingInvoices: 0,
        paidInvoices: 0
      };
    } catch (error) {
      throw new Error(`Failed to calculate invoice summary: ${error.message}`);
    }
  }
}

module.exports = new InvoiceService();