const xlsx = require('xlsx');
const Branch = require('../models/Branch');
const Invoice = require('../models/Invoice'); // Add this import
const Client = require('../models/Client'); // Add this import

// ========================
// 🟢 Create Branch
// ========================
exports.createBranch = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!req.body) {
      return res.status(400).json({ message: 'Branch data is required' });
    }

    const branch = await Branch.create({
      ...req.body,
      company: companyId
    });

    res.status(201).json(branch);
  } catch (err) {
    console.error('Error creating branch:', err);
    res.status(500).json({ message: err.message });
  }
};

// ========================
// 🔵 Get Branches
// ========================
exports.getBranches = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Only get branches that are NOT soft deleted
    const branches = await Branch.find({ company: companyId, deletedAt: null }).lean();

    res.status(200).json(branches);
  } catch (err) {
    console.error('Error fetching branches:', err);
    res.status(500).json({ message: err.message });
  }
};

// ========================
// 🟡 Update Branch
// ========================
exports.updateBranch = async (req, res) => {
  try {
    const { companyId, branchId } = req.params;

    if (!req.body) {
      return res.status(400).json({ message: 'Update data is required' });
    }

    const updatedBranch = await Branch.findOneAndUpdate(
      { _id: branchId, company: companyId, deletedAt: null },
      { ...req.body, company: companyId },
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return res.status(404).json({ message: 'Branch not found or has been deleted' });
    }

    res.status(200).json(updatedBranch);
  } catch (err) {
    console.error('Error updating branch:', err);
    res.status(500).json({ message: err.message });
  }
};

// ========================
// 🔴 Delete Branch (soft delete)
// ========================
exports.deleteBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    const deletedBranch = await Branch.findOneAndUpdate(
      { _id: branchId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!deletedBranch) {
      return res.status(404).json({ message: 'Branch not found or already deleted' });
    }

    res.status(200).json({ message: 'Branch soft-deleted successfully' });
  } catch (err) {
    console.error('Error deleting branch:', err);
    res.status(500).json({ message: err.message });
  }
};

// ========================
// 🔧 Add Category to Branch
// ========================
exports.addCategory = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!req.body) {
      return res.status(400).json({ message: 'Category data is required' });
    }

    const branch = await Branch.findOne({ _id: branchId, deletedAt: null });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found or deleted' });
    }

    branch.categories.push(req.body);
    await branch.save();

    res.status(201).json(branch);
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ message: err.message });
  }
};

// ========================
// 📝 Update Category in Branch
// ========================
exports.updateCategory = async (req, res) => {
  try {
    const { branchId, categoryId } = req.params;

    if (!req.body) {
      return res.status(400).json({ message: 'Category update data is required' });
    }

    const branch = await Branch.findOne({ _id: branchId, deletedAt: null });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found or deleted' });
    }

    const category = branch.categories.id(categoryId);
    if (!category || category.deletedAt) {
      return res.status(404).json({ message: 'Category not found or deleted' });
    }

    Object.assign(category, req.body);
    await branch.save();

    res.status(200).json(branch);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ message: err.message });
  }
};

// ========================
// ❌ Soft Delete Category
// ========================
exports.deleteCategory = async (req, res) => {
  try {
    const { branchId, categoryId } = req.params;

    const branch = await Branch.findOne({ _id: branchId, deletedAt: null });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found or deleted' });
    }

    const category = branch.categories.id(categoryId);
    if (!category || category.deletedAt) {
      return res.status(404).json({ message: 'Category not found or already deleted' });
    }

    category.deletedAt = new Date();
    await branch.save();

    res.status(200).json({ message: 'Category soft-deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: err.message });
  }
};

// ========================
// ➕ Add Subcategory to Category
// ========================
exports.addSubcategory = async (req, res) => {
  try {
    const { branchId, categoryId } = req.params;

    if (!req.body) {
      return res.status(400).json({ message: 'Subcategory data is required' });
    }

    const branch = await Branch.findOne({ _id: branchId, deletedAt: null });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found or deleted' });
    }

    const category = branch.categories.id(categoryId);
    if (!category || category.deletedAt) {
      return res.status(404).json({ message: 'Category not found or deleted' });
    }

    category.subcategories.push(req.body);
    await branch.save();

    res.status(201).json(branch);
  } catch (err) {
    console.error('Error adding subcategory:', err);
    res.status(500).json({ message: err.message });
  }
};

// ========================
// ✏️ Update Subcategory
// ========================
exports.updateSubcategory = async (req, res) => {
  try {
    const { branchId, categoryId, subcategoryId } = req.params;

    if (!req.body) {
      return res.status(400).json({ message: 'Subcategory update data is required' });
    }

    const branch = await Branch.findOne({ _id: branchId, deletedAt: null });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found or deleted' });
    }

    const category = branch.categories.id(categoryId);
    if (!category || category.deletedAt) {
      return res.status(404).json({ message: 'Category not found or deleted' });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory || subcategory.deletedAt) {
      return res.status(404).json({ message: 'Subcategory not found or deleted' });
    }

    Object.assign(subcategory, req.body);
    await branch.save();

    res.status(200).json(branch);
  } catch (err) {
    console.error('Error updating subcategory:', err);
    res.status(500).json({ message: err.message });
  }
};

// ========================
// 🗑️ Soft Delete Subcategory
// ========================
exports.deleteSubcategory = async (req, res) => {
  try {
    const { branchId, categoryId, subcategoryId } = req.params;

    const branch = await Branch.findOne({ _id: branchId, deletedAt: null });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found or deleted' });
    }

    const category = branch.categories.id(categoryId);
    if (!category || category.deletedAt) {
      return res.status(404).json({ message: 'Category not found or deleted' });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory || subcategory.deletedAt) {
      return res.status(404).json({ message: 'Subcategory not found or already deleted' });
    }

    subcategory.deletedAt = new Date();
    await branch.save();

    res.status(200).json({ message: 'Subcategory soft-deleted successfully' });
  } catch (err) {
    console.error('Error deleting subcategory:', err);
    res.status(500).json({ message: err.message });
  }
};

// 📤 Import Subcategories from Excel
// ========================
exports.importSubcategories = async (req, res) => {
  try {
    const { branchId, categoryId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Excel file is required' });
    }

    const branch = await Branch.findOne({ _id: branchId, deletedAt: null });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found or deleted' });
    }

    // Read Excel file
    const workbook = xlsx.read(req.file.buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    // Validate required fields
    const requiredFields = ['name', 'price'];
    const missingFields = [];
    
    jsonData.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field]) {
          missingFields.push(`Row ${index + 2}: Missing ${field}`);
        }
      });
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields in Excel file',
        details: missingFields
      });
    }

    // Import subcategories
    await branch.importSubcategories(categoryId, jsonData);

    res.status(200).json({
      message: 'Subcategories imported successfully',
      importedCount: jsonData.length,
      branch: branch
    });
  } catch (err) {
    console.error('Error importing subcategories:', err);
    res.status(500).json({ message: err.message });
  }
};


// controllers/branchController.js
exports.getBranchDetails = async (req, res) => {
  try {
    const { companyId, branchId } = req.params;
    
    const branch = await Branch.findOne({
      _id: branchId,
      company: companyId,
      deletedAt: null
    })
    .populate('company', 'name gstNumber address phone email')
    .populate('categories')
    .lean();

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.status(200).json(branch);
  } catch (err) {
    console.error('Error fetching branch details:', err);
    res.status(500).json({ message: 'Failed to fetch branch details' });
  }
};



exports.getClientPortfolioOverview = async (req, res) => {
  try {
    const { companyId, branchId } = req.params;
    const { clientType = 'all', dateRange = '30d' } = req.query;

    // 1. Get branch details
    const branch = await Branch.findOne({
      _id: branchId,
      company: companyId,
      deletedAt: null
    }).lean();

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // 2. Calculate date range filter
    let dateFilter = {};
    const now = new Date();
    
    if (dateRange === '7d') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter = { $gte: sevenDaysAgo };
    } else if (dateRange === '30d') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { $gte: thirtyDaysAgo };
    } else if (dateRange === '90d') {
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      dateFilter = { $gte: ninetyDaysAgo };
    }
    // else 'all' - no date filter

    // 3. Get clients with filtering
    let clientFilter = { company: companyId, deletedAt: null };
    
    if (clientType === 'regular') {
      clientFilter.isRegular = true;
    } else if (clientType === 'non-regular') {
      clientFilter.isRegular = false;
    }

    const clients = await Client.find(clientFilter).lean();

    // 4. Get invoices with date and client filtering
    const invoices = await Invoice.find({
      branch: branchId,
      client: { $in: clients.map(c => c._id) },
      date: dateRange !== 'all' ? dateFilter : { $exists: true },
      deletedAt: null
    })
    .populate('client', 'name isRegular')
    .populate('items.categoryId', 'name')
    .populate('items.subcategoryId', 'name price')
    .lean();

    // 5. Calculate statistics with enhanced segmentation
    const totalClients = clients.length;
    const regularClients = clients.filter(c => c.isRegular).length;
    const nonRegularClients = totalClients - regularClients;

    // Enhanced client segmentation
    const clientSegments = {
      regular: {
        count: regularClients,
        revenue: 0,
        invoices: 0,
        items: 0
      },
      nonRegular: {
        count: nonRegularClients,
        revenue: 0,
        invoices: 0,
        items: 0
      },
      new: {
        count: 0, // You'd need to track new clients
        revenue: 0,
        invoices: 0,
        items: 0
      }
    };

    // Process invoices
    const clientStats = {};
    let totalRevenue = 0;
    let totalItemsSold = 0;

    invoices.forEach(invoice => {
      const isRegular = invoice.client?.isRegular || false;
      const clientId = invoice.client?._id.toString();
      
      // Segment tracking
      if (isRegular) {
        clientSegments.regular.revenue += invoice.grandTotal || 0;
        clientSegments.regular.invoices += 1;
      } else {
        clientSegments.nonRegular.revenue += invoice.grandTotal || 0;
        clientSegments.nonRegular.invoices += 1;
      }

      // Individual client tracking
      if (clientId) {
        if (!clientStats[clientId]) {
          clientStats[clientId] = {
            name: invoice.client?.name || 'Unknown',
            isRegular,
            totalSpent: 0,
            invoiceCount: 0,
            itemsPurchased: 0,
            firstPurchaseDate: new Date(invoice.date),
            lastPurchaseDate: new Date(invoice.date)
          };
        } else {
          clientStats[clientId].totalSpent += invoice.grandTotal || 0;
          clientStats[clientId].invoiceCount += 1;
          clientStats[clientId].lastPurchaseDate = new Date(
            Math.max(new Date(invoice.date), clientStats[clientId].lastPurchaseDate
          ));
          clientStats[clientId].firstPurchaseDate = new Date(
            Math.min(new Date(invoice.date), clientStats[clientId].firstPurchaseDate
          ));
        }

        // Item tracking
        if (invoice.items?.length > 0) {
          invoice.items.forEach(item => {
            const qty = item.quantity || 1;
            clientStats[clientId].itemsPurchased += qty;
            totalItemsSold += qty;
            
            // Add to segment item count
            if (isRegular) {
              clientSegments.regular.items += qty;
            } else {
              clientSegments.nonRegular.items += qty;
            }
          });
        }
      }
    });

    totalRevenue = clientSegments.regular.revenue + clientSegments.nonRegular.revenue;

    // Calculate averages
    const avgRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;
    const avgRevenuePerRegular = clientSegments.regular.count > 0 
      ? clientSegments.regular.revenue / clientSegments.regular.count : 0;
    const avgRevenuePerNonRegular = clientSegments.nonRegular.count > 0 
      ? clientSegments.nonRegular.revenue / clientSegments.nonRegular.count : 0;

    // 6. Prepare response with enhanced segmentation
    const response = {
      branch: {
        id: branch._id,
        name: branch.name
      },
      filters: {
        clientType,
        dateRange
      },
      summary: {
        totalClients,
        regularClients,
        nonRegularClients,
        regularClientPercentage: totalClients > 0 
          ? Math.round((regularClients / totalClients) * 100) 
          : 0,
        totalRevenue,
        revenueFromRegular: clientSegments.regular.revenue,
        revenueFromNonRegular: clientSegments.nonRegular.revenue,
        avgRevenuePerClient,
        avgRevenuePerRegular,
        avgRevenuePerNonRegular,
        totalInvoices: invoices.length,
        totalItemsSold
      },
      segments: {
        regular: {
          ...clientSegments.regular,
          avgInvoiceValue: clientSegments.regular.invoices > 0 
            ? clientSegments.regular.revenue / clientSegments.regular.invoices 
            : 0,
          percentageOfRevenue: totalRevenue > 0 
            ? Math.round((clientSegments.regular.revenue / totalRevenue) * 100)
            : 0
        },
        nonRegular: {
          ...clientSegments.nonRegular,
          avgInvoiceValue: clientSegments.nonRegular.invoices > 0 
            ? clientSegments.nonRegular.revenue / clientSegments.nonRegular.invoices 
            : 0,
          percentageOfRevenue: totalRevenue > 0 
            ? Math.round((clientSegments.nonRegular.revenue / totalRevenue) * 100)
            : 0
        }
      },
      topClients: Object.values(clientStats)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
        .map(client => ({
          ...client,
          avgSpendPerInvoice: client.invoiceCount > 0 
            ? client.totalSpent / client.invoiceCount 
            : 0,
          daysSinceLastPurchase: Math.floor(
            (new Date() - client.lastPurchaseDate) / (1000 * 60 * 60 * 24)
          )
        }))
    };

    res.status(200).json(response);

  } catch (err) {
    console.error('Error generating client portfolio overview:', err);
    res.status(500).json({ 
      message: 'Failed to generate client portfolio',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
exports.generateBranchPerformanceReport = async (req, res) => {
  try {
    const { companyId, branchId } = req.params;
    const { clientType = 'all', dateRange = '30d', startDate, endDate } = req.query;

    // Validate input parameters
    if (!companyId || !branchId) {
      return res.status(400).json({ 
        message: 'Company ID and Branch ID are required' 
      });
    }

    // 1. Get branch details with categories/subcategories
    const branch = await Branch.findOne({
      _id: branchId,
      company: companyId,
      deletedAt: null
    }).lean();

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // 2. Calculate date ranges
    let reportStartDate, reportEndDate;
    let isCustomRange = false;

    // Handle custom date range
    if (startDate && endDate) {
      try {
        reportStartDate = new Date(startDate);
        reportEndDate = new Date(endDate);
        reportStartDate.setHours(0, 0, 0, 0);
        reportEndDate.setHours(23, 59, 59, 999);
        isCustomRange = true;
      } catch (dateError) {
        return res.status(400).json({ 
          message: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }
    } else {
      // Predefined ranges
      let daysBack = 30; // default
      switch (dateRange) {
        case '7d': daysBack = 7; break;
        case '30d': daysBack = 30; break;
        case '90d': daysBack = 90; break;
        default: daysBack = 30;
      }
      
      reportEndDate = new Date();
      reportEndDate.setHours(23, 59, 59, 999);
      
      reportStartDate = new Date(reportEndDate);
      reportStartDate.setDate(reportStartDate.getDate() - daysBack);
      reportStartDate.setHours(0, 0, 0, 0);
    }

    // 3. Build invoice filter
    const invoiceFilter = {
      branch: branchId,
      date: { 
        $gte: reportStartDate,
        $lte: reportEndDate 
      },
      deletedAt: null
    };

    // Add client type filter
    if (clientType !== 'all') {
      invoiceFilter['clientType'] = clientType === 'regular' ? 'regular' : 'non-regular';
    }

    // 4. Fetch invoices with client info
    const invoices = await Invoice.find(invoiceFilter)
      .populate('client', 'name isRegular')
      .lean();

    // 5. Process category performance
    const categoryMap = {};
    const categoryPerformance = [];

    // Initialize categories from branch
    branch.categories.forEach(cat => {
      if (!cat.deletedAt) {
        const categoryData = {
          id: cat._id.toString(),
          name: cat.name,
          totalRevenue: 0,
          subcategories: {},
          topSubcategory: { name: '', revenue: 0 }
        };
        
        // Initialize subcategories
        cat.subcategories.forEach(sub => {
          if (!sub.deletedAt) {
            categoryData.subcategories[sub._id.toString()] = {
              name: sub.name,
              revenue: 0
            };
          }
        });
        
        categoryPerformance.push(categoryData);
        categoryMap[cat._id.toString()] = categoryData;
      }
    });

    // Process invoice items
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const categoryId = item.categoryId?.toString();
        const subcategoryId = item.subcategoryId?.toString();
        
        if (categoryId && categoryMap[categoryId]) {
          const category = categoryMap[categoryId];
          const amount = item.finalAmount || 0;
          
          // Add to category total
          category.totalRevenue += amount;
          
          // Add to subcategory if exists
          if (subcategoryId && category.subcategories[subcategoryId]) {
            const subcategory = category.subcategories[subcategoryId];
            subcategory.revenue += amount;
            
            // Update top subcategory
            if (subcategory.revenue > category.topSubcategory.revenue) {
              category.topSubcategory = {
                name: subcategory.name,
                revenue: subcategory.revenue
              };
            }
          }
        }
      });
    });

    // 6. Calculate top subcategories
    const allSubcategories = [];
    categoryPerformance.forEach(category => {
      Object.values(category.subcategories).forEach(subcategory => {
        if (subcategory.revenue > 0) {
          allSubcategories.push({
            name: subcategory.name,
            category: category.name,
            revenue: subcategory.revenue,
            categoryId: category.id
          });
        }
      });
    });

    // Sort and get top 10
    const topSubcategories = allSubcategories
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((sub, index) => ({
        ...sub,
        rank: index + 1
      }));

    // 7. Calculate client insights
    const clientIds = [...new Set(invoices.map(inv => inv.client?._id).filter(Boolean))];
    const clients = await Client.find({ _id: { $in: clientIds } }).lean();
    
    const regularClients = clients.filter(c => c.isRegular).length;
    const totalClients = clients.length;
    
    const regularRevenue = invoices
      .filter(inv => inv.client?.isRegular)
      .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    
    const regularRevenuePercentage = totalRevenue > 0 
      ? Math.round((regularRevenue / totalRevenue) * 100)
      : 0;

    // 8. Calculate top clients
    const clientRevenue = {};
    invoices.forEach(inv => {
      if (inv.client) {
        const clientId = inv.client._id.toString();
        if (!clientRevenue[clientId]) {
          clientRevenue[clientId] = {
            name: inv.client.name,
            type: inv.client.isRegular ? 'Regular' : 'Non-regular',
            totalSpent: 0,
            purchaseCount: 0
          };
        }
        clientRevenue[clientId].totalSpent += inv.grandTotal || 0;
        clientRevenue[clientId].purchaseCount += 1;
      }
    });

    const topClients = Object.values(clientRevenue)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(client => ({
        ...client,
        avgPurchase: client.purchaseCount > 0 
          ? client.totalSpent / client.purchaseCount
          : 0
      }));

    // 9. Generate recommendations
    const recommendations = [];
    
    if (regularRevenuePercentage < 30 && clientType !== 'non-regular') {
      recommendations.push(`Focus on regular clients - they generate only ${regularRevenuePercentage}% of revenue`);
    }
    
    if (topSubcategories.length > 0) {
      recommendations.push(`Promote top subcategory: ${topSubcategories[0].name}`);
    }
    
    const zeroRevenueCategories = categoryPerformance.filter(c => c.totalRevenue === 0);
    if (zeroRevenueCategories.length > 0) {
      recommendations.push(`Review categories with no revenue: ${zeroRevenueCategories.map(c => c.name).join(', ')}`);
    }

    // 10. Build final response
    const totalDays = Math.ceil((reportEndDate - reportStartDate) / (1000 * 60 * 60 * 24));
    const totalInvoices = invoices.length;
    const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    res.status(200).json({
      branch: {
        name: branch.name,
        managerName: branch.managerName || 'Not specified',
        location: branch.location || 'Not specified',
        isDefault: branch.isDefault || false
      },
      categoryPerformance,
      topSubcategories,
      clientInsights: {
        regularClients,
        totalClients,
        regularClientsRevenuePercentage: regularRevenuePercentage,
        filteredClients: clientType === 'all' ? totalClients : clientType === 'regular' ? regularClients : totalClients - regularClients
      },
      topClients,
      recommendations,
      filters: {
        clientType,
        dateRange: isCustomRange ? 'custom' : dateRange,
        startDate: isCustomRange ? reportStartDate.toISOString().split('T')[0] : null,
        endDate: isCustomRange ? reportEndDate.toISOString().split('T')[0] : null,
        isCustomRange,
        totalDays
      },
      summary: {
        totalRevenue,
        totalInvoices,
        avgInvoiceValue,
        periodStart: reportStartDate.toISOString().split('T')[0],
        periodEnd: reportEndDate.toISOString().split('T')[0],
        totalDays
      }
    });

  } catch (err) {
    console.error('Branch report error:', err);
    res.status(500).json({ 
      message: 'Failed to generate report',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};