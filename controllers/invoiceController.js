const Invoice = require('../models/Invoice');
const Branch = require('../models/Branch');
const Company = require('../models/Company');
const Client = require('../models/Client');
const mongoose = require('mongoose');

// Fetch single invoice details with enriched info
exports.getInvoiceDetails = async (req, res) => {
  try {
    const { companyId, branchId, invoiceId } = req.params;

    // Find invoice with company and branch populated
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      branch: branchId,
      deletedAt: null
    })
      .populate('company', 'name gstNumber address phone email')
      .populate('branch', 'name location phone categories')
      .lean();

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Fetch additional client info from client collection if needed
    let clientDetails = invoice.client;
    if (invoice.client && invoice.client._id) {
      const fullClient = await Client.findById(invoice.client._id).lean();
      if (fullClient) {
        clientDetails = {
          ...invoice.client,
          ...fullClient
        };
      }
    }

    // Map category/subcategory names (reconfirm from branch.categories)
    const enhancedItems = (invoice.items || []).map(item => {
      let categoryName = item.categoryName || 'Unknown';
      let subcategoryName = item.subcategoryName || 'Unknown';

      // Try to get fresh category names from branch data
      const branchCats = invoice.branch?.categories || [];
      for (const cat of branchCats) {
        if (cat._id.toString() === item.categoryId?.toString()) {
          categoryName = cat.name;
          const sub = cat.subcategories?.find(sc => sc._id.toString() === item.subcategoryId?.toString());
          if (sub) subcategoryName = sub.name;
          break;
        }
      }

      return {
        ...item,
        categoryName,
        subcategoryName,
        // Ensure required fields have defaults
        name: item.name || 'Unknown Item',
        description: item.description || '',
        quantity: item.quantity || 0,
        price: item.price || 0,
        discount: item.discount || 0,
        gst: item.gst || 0
      };
    });

    // Ensure all required invoice fields are present
    const responseData = {
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber || 'N/A',
      date: invoice.date || invoice.createdAt,
      dueDate: invoice.dueDate,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      
      // Company details
      company: {
        _id: invoice.company?._id,
        name: invoice.company?.name || 'Company Name',
        gstNumber: invoice.company?.gstNumber || '',
        address: invoice.company?.address || '',
        phone: invoice.company?.phone || '',
        email: invoice.company?.email || ''
      },

      // Branch details
      branch: {
        _id: invoice.branch?._id,
        name: invoice.branch?.name || 'Branch Name',
        location: invoice.branch?.location || '',
        phone: invoice.branch?.phone || ''
      },

      // Client details
      client: {
        _id: clientDetails?._id,
        name: clientDetails?.name || 'Customer Name',
        email: clientDetails?.email || '',
        phone: clientDetails?.phone || '',
        address: clientDetails?.address || '',
        gstNumber: clientDetails?.gstNumber || '',
        isRegular: clientDetails?.isRegular || false,
        discountPercentage: clientDetails?.discountPercentage || 0
      },

      // Items with enhanced data
      items: enhancedItems,

      // Financial totals
      subtotal: invoice.subtotal || 0,
      totalDiscount: invoice.totalDiscount || 0,
      totalGst: invoice.totalGst || 0,
      grandTotal: invoice.grandTotal || 0,

      // Payment info
      paymentStatus: invoice.paymentStatus || 'pending',
      paymentMethod: invoice.paymentMethod || 'cash',
      
      // Additional info
      notes: invoice.notes || '',
      clientType: invoice.clientType || 'non-regular'
    };

    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error in getInvoiceDetails:', err);
    res.status(500).json({ 
      message: 'Failed to fetch invoice details: ' + err.message,
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
};

// Create Invoice with full embedded details from related models

exports.createInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { companyId, branchId } = req.params;
    const data = req.body;

    // Validate branch exists and belongs to company
    const branch = await Branch.findOne({ 
      _id: branchId, 
      company: companyId, 
      deletedAt: null 
    }).session(session).lean();
    
    if (!branch) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Validate company exists
    const company = await Company.findOne({ 
      _id: companyId, 
      deletedAt: null 
    }).session(session).lean();
    
    if (!company) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Company not found' });
    }

    // Validate client exists and belongs to company
    const client = await Client.findOne({ 
      _id: data.client, 
      company: companyId, 
      deletedAt: null 
    }).session(session).lean();
    
    if (!client) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Client not found' });
    }

    // Generate invoice number safely
    const count = await Invoice.countDocuments({ branch: branchId }).session(session);
    const invoiceNumber = `${branch.name.slice(0, 3).toUpperCase()}-${(count + 1).toString().padStart(5, '0')}`;

    // Process items
    const items = (data.items || []).map(item => {
      let categoryName = 'Unknown';
      let subcategoryName = 'Unknown';

      for (const cat of branch.categories || []) {
        if (cat._id.toString() === item.categoryId) {
          categoryName = cat.name;
          const sub = cat.subcategories.find(sc => sc._id.toString() === item.subcategoryId);
          if (sub) subcategoryName = sub.name;
          break;
        }
      }

      const quantity = item.quantity || 0;
      const price = item.price || 0;
      const discount = item.discount || 0;
      const gst = item.gst || 0;
      const finalAmount = (price * quantity - discount) + gst;

      return {
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId,
        name: item.name || 'Unknown Item',
        description: item.description || '',
        quantity,
        price,
        discount,
        gst,
        finalAmount,
        categoryName,
        subcategoryName
      };
    });

     // Calculate totals
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const totalDiscount = items.reduce((sum, i) => sum + (i.discount || 0), 0);
    const totalGst = items.reduce((sum, i) => sum + (i.gst || 0), 0);
    const grandTotal = subtotal - totalDiscount + totalGst;

    const clientData = {
      _id: client._id,
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      gstNumber: client.gstNumber || '',
      isRegular: client.isRegular || false,
      discountPercentage: client.discountPercentage || 0
    };

     const invoice = await Invoice.create([{
      invoiceNumber,
      company: company._id,
      branch: branch._id,
      client: clientData,
      clientType: client.isRegular ? 'regular' : 'non-regular',
      companyGST: company.gstNumber,
      items,
      subtotal,
      totalDiscount,
      totalGst,
      grandTotal,
      paymentStatus: data.paymentStatus || 'pending',
      paymentMethod: data.paymentMethod || 'cash',
      notes: data.notes || '',
      dueDate: data.dueDate || null,
      date: data.date || new Date(),
      createdAt: new Date()
    }], { session });

    await session.commitTransaction();
    res.status(201).json(invoice[0]);

  } catch (err) {
    await session.abortTransaction();
    console.error('createInvoice error:', err);
    res.status(500).json({ 
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  } finally {
    session.endSession();
  }
};

// Fetch invoices by branch with full populated details
exports.getBranchInvoices = async (req, res) => {
  try {
    const { branchId } = req.params;
    const invoices = await Invoice.find({ branch: branchId, deletedAt: null })
      .populate('company', 'name gstNumber')
      .populate('branch', 'name location categories')
      .lean();

    res.status(200).json(invoices);
  } catch (err) {
    console.error('getBranchInvoices error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update invoice (payment status, payment method etc.)
exports.updateInvoice = async (req, res) => {
  try {
    const { companyId, branchId, invoiceId } = req.params;
    const updateData = req.body;

    const invoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, branch: branchId, deletedAt: null },
      updateData,
      { new: true }
    ).lean();

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    res.status(200).json(invoice);
  } catch (err) {
    console.error('updateInvoice error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Soft delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const { companyId, branchId, invoiceId } = req.params;

    const invoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, branch: branchId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    console.error('deleteInvoice error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Print-friendly invoice details - Alternative endpoint if needed
exports.printInvoice = async (req, res) => {
  try {
    const { companyId, branchId, invoiceId } = req.params;
    
    // Use the same logic as getInvoiceDetails for consistency
    return exports.getInvoiceDetails(req, res);
  } catch (err) {
    console.error('Error fetching invoice for print:', err);
    res.status(500).json({ message: 'Failed to fetch invoice: ' + err.message });
  }
};

// Fetch all invoices for a client across branches of the company
exports.getClientInvoices = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { client } = req.query;

    // Find branches for company
    const branches = await Branch.find({ company: companyId }).lean();
    const branchIds = branches.map(b => b._id);

    // Find invoices by client across those branches
    const invoices = await Invoice.find({
      'client._id': client,
      branch: { $in: branchIds },
      deletedAt: null
    }).populate('branch', 'name').lean();

    res.status(200).json(invoices);
  } catch (err) {
    console.error('getClientInvoices error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Sales + Product report for date range
exports.getReports = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;

    const branchIds = await Branch.find({ company: companyId }).distinct('_id');

    const dateFilter = {
      branch: { $in: branchIds },
      deletedAt: null
    };

    if (startDate && endDate) {
      dateFilter.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const salesReport = await Invoice.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: "$grandTotal" },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const productReport = await Invoice.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.subcategoryId",
          productName: { $first: "$items.name" },
          categoryName: { $first: "$items.categoryName" },
          subcategoryName: { $first: "$items.subcategoryName" },
          totalQuantity: { $sum: "$items.quantity" },
          totalAmount: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      }
    ]);

    res.status(200).json({ salesReport, productReport });
  } catch (err) {
    console.error('getReports error:', err);
    res.status(500).json({ message: err.message });
  }
};







// Add this to your existing invoiceController.js

/**
 * Get detailed invoice report data
 * @param {startDate, endDate, branchId, clientId, paymentStatus} via query params
 */



exports.getDetailedInvoiceReport = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { 
      startDate, 
      endDate, 
      branchId, 
      clientId,
      paymentStatus 
    } = req.query;

    // Base filter
    const filter = {
      company: companyId,
      deletedAt: null
    };

    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Optional filters
    if (branchId) filter.branch = branchId;
    if (clientId) filter['client._id'] = clientId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Get invoices with necessary fields
    const invoices = await Invoice.find(filter)
      .populate('branch', 'name')
      .sort({ date: -1 })
      .lean();

    // Transform data for reporting
    const reportData = invoices.map(invoice => {
      const itemSummary = invoice.items.map(item => ({
        name: item.name,
        category: item.categoryName || 'Uncategorized',
        quantity: item.quantity,
        price: item.price,
        amount: item.price * item.quantity,
        discount: item.discount,
        gst: item.gst
      }));

      return {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        branch: invoice.branch?.name || 'Unknown Branch',
        client: invoice.client?.name || 'Unknown Client',
        paymentStatus: invoice.paymentStatus,
        paymentMethod: invoice.paymentMethod,
        subtotal: invoice.subtotal,
        totalDiscount: invoice.totalDiscount,
        totalGst: invoice.totalGst,
        grandTotal: invoice.grandTotal,
        items: itemSummary,
        itemCount: invoice.items.length
      };
    });

    // Calculate summary statistics
    const summary = {
      totalInvoices: reportData.length,
      totalAmount: reportData.reduce((sum, inv) => sum + inv.grandTotal, 0),
      totalItems: reportData.reduce((sum, inv) => sum + inv.itemCount, 0),
      paidInvoices: reportData.filter(inv => inv.paymentStatus === 'paid').length,
      pendingInvoices: reportData.filter(inv => inv.paymentStatus === 'pending').length
    };

    res.status(200).json({
      success: true,
      summary,
      invoices: reportData
    });

  } catch (err) {
    console.error('Error in getDetailedInvoiceReport:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice report',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};





module.exports = exports;