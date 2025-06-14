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


  // ========================
  // 📊 Branch Performance Report - UPDATED VERSION
  // ========================
 
  // exports.generateBranchPerformanceReport = async (req, res) => {
  //   try {
  //     const { companyId, branchId } = req.params;
  //     const { clientType = 'all'} = req.query;
      
  //     // 1. Get basic branch details
  //     const branch = await Branch.findOne({
  //       _id: branchId,
  //       company: companyId,
  //       deletedAt: null
  //     })
  //     .populate('company', 'name gstNumber')
  //     .lean();

  //     if (!branch) {
  //       return res.status(404).json({ message: 'Branch not found' });
  //     }

  //     // 2. Get invoices for the last 30 days
  //     const thirtyDaysAgo = new Date();
  //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  //     const invoices = await Invoice.find({
  //       branch: branchId,
  //       date: { $gte: thirtyDaysAgo },
  //       deletedAt: null
  //     })
  //     .populate('client', 'name isRegular') // Populate client data
  //     .lean();

  //     // 3. Calculate date ranges for reporting periods
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);
      
  //     const yesterday = new Date(today);
  //     yesterday.setDate(yesterday.getDate() - 1);
      
  //     const thisWeekStart = new Date(today);
  //     thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());
      
  //     const lastWeekStart = new Date(thisWeekStart);
  //     lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      
  //     const lastWeekEnd = new Date(thisWeekStart);
  //     lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      
  //     const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  //     const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  //     const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  //     // Helper function to filter and sum invoices by date range
  //     const getRevenueForPeriod = (startDate, endDate = new Date()) => {
  //       const filtered = invoices.filter(inv => {
  //         const invDate = new Date(inv.date);
  //         return invDate >= startDate && invDate <= endDate;
  //       });
        
  //       const revenue = filtered.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  //       const count = filtered.length;
  //       const avg = count > 0 ? revenue / count : 0;
        
  //       return { revenue, count, avg };
  //     };

  //     // Revenue summary data
  //     const revenueSummary = [
  //       {
  //         period: 'Today',
  //         ...getRevenueForPeriod(today),
  //         isCurrent: true
  //       },
  //       {
  //         period: 'Yesterday',
  //         ...getRevenueForPeriod(yesterday, yesterday),
  //         isCurrent: false
  //       },
  //       {
  //         period: 'This Week',
  //         ...getRevenueForPeriod(thisWeekStart),
  //         isCurrent: true
  //       },
  //       {
  //         period: 'Last Week',
  //         ...getRevenueForPeriod(lastWeekStart, lastWeekEnd),
  //         isCurrent: false
  //       },
  //       {
  //         period: 'This Month',
  //         ...getRevenueForPeriod(thisMonthStart),
  //         isCurrent: true
  //       },
  //       {
  //         period: 'Last Month',
  //         ...getRevenueForPeriod(lastMonthStart, lastMonthEnd),
  //         isCurrent: false
  //       }
  //     ];

  //     // 4. Initialize category performance data
  //     const categoryPerformance = [];
  //     const categoryMap = {};
      
  //     // Initialize category data from branch categories
  //     if (branch.categories && branch.categories.length > 0) {
  //       branch.categories.forEach(cat => {
  //         if (!cat.deletedAt) {
  //           const categoryData = {
  //             id: cat._id,
  //             name: cat.name,
  //             dailyRevenue: 0,
  //             weeklyRevenue: 0,
  //             monthlyRevenue: 0,
  //             subcategories: {},
  //             topSubcategory: { name: '', revenue: 0 }
  //           };
  //           categoryPerformance.push(categoryData);
  //           categoryMap[cat._id] = categoryData;
            
  //           // Initialize subcategory data if exists
  //           if (cat.subcategories && cat.subcategories.length > 0) {
  //             cat.subcategories.forEach(sub => {
  //               if (!sub.deletedAt) {
  //                 categoryData.subcategories[sub._id] = {
  //                   name: sub.name,
  //                   revenue: 0
  //                 };
  //               }
  //             });
  //           }
  //         }
  //       });
  //     }

  //     // Process invoices to calculate category revenues
  //     invoices.forEach(inv => {
  //       const invDate = new Date(inv.date);
  //       const isToday = invDate >= today;
  //       const isThisWeek = invDate >= thisWeekStart;
  //       const isThisMonth = invDate >= thisMonthStart;
        
  //       if (inv.items && inv.items.length > 0) {
  //         inv.items.forEach(item => {
  //           if (item.categoryId && categoryMap[item.categoryId]) {
  //             const category = categoryMap[item.categoryId];
  //             const amount = item.finalAmount || (item.price * item.quantity) || 0;
              
  //             if (isToday) category.dailyRevenue += amount;
  //             if (isThisWeek) category.weeklyRevenue += amount;
  //             if (isThisMonth) category.monthlyRevenue += amount;
              
  //             // Track subcategory revenue if exists
  //             if (item.subcategoryId && category.subcategories[item.subcategoryId]) {
  //               const subcategory = category.subcategories[item.subcategoryId];
  //               subcategory.revenue += amount;
                
  //               // Update top subcategory
  //               if (subcategory.revenue > category.topSubcategory.revenue) {
  //                 category.topSubcategory = {
  //                   name: subcategory.name,
  //                   revenue: subcategory.revenue
  //                 };
  //               }
  //             }
  //           }
  //         });
  //       }
  //     });

  //     // 5. Top subcategories (this month)
  //     const allSubcategories = [];
  //     categoryPerformance.forEach(cat => {
  //       if (cat.subcategories) {
  //         Object.values(cat.subcategories).forEach(sub => {
  //           if (sub.revenue > 0) {
  //             allSubcategories.push({
  //               name: sub.name,
  //               category: cat.name,
  //               revenue: sub.revenue,
  //               salesCount: 0, // You'd need to track this separately
  //               avgPrice: 0    // You'd need to track this separately
  //             });
  //           }
  //         });
  //       }
  //     });

  //     // Sort and get top 10 subcategories
  //     const topSubcategories = allSubcategories
  //       .sort((a, b) => b.revenue - a.revenue)
  //       .slice(0, 10)
  //       .map((sub, index) => ({
  //         ...sub,
  //         rank: index + 1
  //       }));

  //     // 6. Client insights
  //     const clientIds = [...new Set(invoices.map(inv => inv.client?._id).filter(id => id))];
  //     const clients = await Client.find({ 
  //       _id: { $in: clientIds },
  //       deletedAt: null 
  //     }).lean();

  //     const regularClients = clients.filter(c => c.isRegular).length;
  //     const totalClients = clients.length;
  //     const regularClientsRevenue = invoices
  //       .filter(inv => inv.client && clients.find(c => c._id.equals(inv.client._id) && c.isRegular))
  //       .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      
  //     const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  //     const regularClientsRevenuePercentage = totalRevenue > 0 
  //       ? Math.round((regularClientsRevenue / totalRevenue) * 100) 
  //       : 0;

  //     // Find new clients this month (first purchase in this month)
  //     const newClientsThisMonth = 0; // You'd need to track client first purchase dates

  //     // 7. Top clients by spending
  //     const clientSpending = {};
  //     invoices.forEach(inv => {
  //       if (inv.client) {
  //         const clientId = inv.client._id;
  //         if (!clientSpending[clientId]) {
  //           clientSpending[clientId] = {
  //             totalSpent: 0,
  //             purchaseCount: 0
  //           };
  //         }
  //         clientSpending[clientId].totalSpent += inv.grandTotal || 0;
  //         clientSpending[clientId].purchaseCount += 1;
  //       }
  //     });

  //     const topClients = Object.entries(clientSpending)
  //       .map(([clientId, data]) => {
  //         const client = clients.find(c => c._id.equals(clientId));
  //         return {
  //           name: client?.name || 'Unknown Client',
  //           type: client?.isRegular ? 'Regular' : 'Non-regular',
  //           totalSpent: data.totalSpent,
  //           purchaseCount: data.purchaseCount,
  //           avgPurchase: data.purchaseCount > 0 
  //             ? data.totalSpent / data.purchaseCount 
  //             : 0
  //         };
  //       })
  //       .sort((a, b) => b.totalSpent - a.totalSpent)
  //       .slice(0, 5);

  //     // 8. Generate recommendations
  //     const recommendations = [];
      
  //     // Example recommendations based on data
  //     if (regularClientsRevenuePercentage < 30) {
  //       recommendations.push("Increase focus on regular clients - they currently generate only " + 
  //         regularClientsRevenuePercentage + "% of revenue");
  //     }
      
  //     if (topSubcategories.length > 0) {
  //       recommendations.push(`Promote your top subcategory "${topSubcategories[0].name}" more aggressively`);
  //     }

  //     if (categoryPerformance.some(cat => cat.monthlyRevenue === 0)) {
  //       const underperforming = categoryPerformance.filter(cat => cat.monthlyRevenue === 0);
  //       recommendations.push(`Review underperforming categories: ${
  //         underperforming.map(c => c.name).join(', ')
  //       }`);
  //     }

        

  //     // Construct the final report
  //     const report = {
  //       branch: {
  //         name: branch.name,
  //         managerName: branch.managerName || 'Not specified',
  //         location: branch.location || 'Not specified',
  //         isDefault: branch.isDefault || false
  //       },
  //       revenueSummary,
  //       categoryPerformance,
  //       topSubcategories,
  //       clientInsights: {
  //         regularClients,
  //         totalClients, // Add this line
  //         regularClientsRevenuePercentage,
  //         newClientsThisMonth
  //       },
  //       topClients,
  //       recommendations
  //     };

  //     res.status(200).json(report);

  //   } catch (err) {
  //     console.error('Error generating branch performance report:', err);
  //     res.status(500).json({ 
  //       message: 'Failed to generate report',
  //       error: process.env.NODE_ENV === 'development' ? err.message : undefined
  //     });
  //   }
  // };



  exports.generateBranchPerformanceReport = async (req, res) => {
    try {
      const { companyId, branchId } = req.params;
      const { clientType = 'all' } = req.query;

    console.log(`Generating report for branch ${branchId}, clientType: ${clientType}`);
      
      
      // 1. Get basic branch details
      const branch = await Branch.findOne({
        _id: branchId,
        company: companyId,
        deletedAt: null
      })
      .populate('company', 'name gstNumber')
      .lean();

      if (!branch) {
        return res.status(404).json({ message: 'Branch not found' });
      }

      // 2. Get invoices for the last 30 days with client filtering
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // First get relevant clients based on clientType
      let clientFilter = { company: companyId, deletedAt: null };
      if (clientType === 'regular') {
        clientFilter.isRegular = true;
      } else if (clientType === 'non-regular') {
        clientFilter.isRegular = false;
      }

      const clients = await Client.find(clientFilter).lean();
      const clientIds = clients.map(c => c._id);

      // Then get invoices for these clients
      const invoices = await Invoice.find({
        branch: branchId,
        client: clientType !== 'all' ? { $in: clientIds } : { $exists: true },
        date: { $gte: thirtyDaysAgo },
        deletedAt: null
      })
      .populate('client', 'name isRegular')
      .lean();

      // 3. Calculate date ranges for reporting periods
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());
      
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      // Helper function to filter and sum invoices by date range
      // const getRevenueForPeriod = (startDate, endDate = new Date()) => {
      //   const filtered = invoices.filter(inv => {
      //     const invDate = new Date(inv.date);
      //     return invDate >= startDate && invDate <= endDate;
      //   });
        
      //   const revenue = filtered.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      //   const count = filtered.length;
      //   const avg = count > 0 ? revenue / count : 0;
        
      //   return { revenue, count, avg };
      // };














    // Fixed date calculation logic
const getRevenueForPeriod = (startDate, endDate = new Date()) => {
  // Ensure end date includes the full day
  const endDateWithTime = new Date(endDate);
  endDateWithTime.setHours(23, 59, 59, 999);
  
  // Ensure start date starts from beginning of day
  const startDateWithTime = new Date(startDate);
  startDateWithTime.setHours(0, 0, 0, 0);
  
  console.log(`Filtering invoices between ${startDateWithTime} and ${endDateWithTime}`);
  
  const filtered = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    const isInRange = invDate >= startDateWithTime && invDate <= endDateWithTime;
    
    if (isInRange) {
      console.log(`Invoice ${inv._id} on ${invDate} is in range`);
    }
    
    return isInRange;
  });
  
  console.log(`Found ${filtered.length} invoices in period`);
  
  const revenue = filtered.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const count = filtered.length;
  const avg = count > 0 ? revenue / count : 0;
  
  return { revenue, count, avg };
};






      // Revenue summary data
      const revenueSummary = [
        {
          period: 'Today',
          ...getRevenueForPeriod(today),
          isCurrent: true
        },
        {
          period: 'Yesterday',
          ...getRevenueForPeriod(yesterday, yesterday),
          isCurrent: false
        },
        {
          period: 'This Week',
          ...getRevenueForPeriod(thisWeekStart),
          isCurrent: true
        },
        {
          period: 'Last Week',
          ...getRevenueForPeriod(lastWeekStart, lastWeekEnd),
          isCurrent: false
        },
        {
          period: 'This Month',
          ...getRevenueForPeriod(thisMonthStart),
          isCurrent: true
        },
        {
          period: 'Last Month',
          ...getRevenueForPeriod(lastMonthStart, lastMonthEnd),
          isCurrent: false
        }
      ];

      // 4. Initialize category performance data
      const categoryPerformance = [];
      const categoryMap = {};
      
      // Initialize category data from branch categories
      if (branch.categories && branch.categories.length > 0) {
        branch.categories.forEach(cat => {
          if (!cat.deletedAt) {
            const categoryData = {
              id: cat._id,
              name: cat.name,
              dailyRevenue: 0,
              weeklyRevenue: 0,
              monthlyRevenue: 0,
              subcategories: {},
              topSubcategory: { name: '', revenue: 0 }
            };
            categoryPerformance.push(categoryData);
            categoryMap[cat._id] = categoryData;
            
            // Initialize subcategory data if exists
            if (cat.subcategories && cat.subcategories.length > 0) {
              cat.subcategories.forEach(sub => {
                if (!sub.deletedAt) {
                  categoryData.subcategories[sub._id] = {
                    name: sub.name,
                    revenue: 0
                  };
                }
              });
            }
          }
        });
      }

      // Process invoices to calculate category revenues
      invoices.forEach(inv => {
        const invDate = new Date(inv.date);
        const isToday = invDate >= today;
        const isThisWeek = invDate >= thisWeekStart;
        const isThisMonth = invDate >= thisMonthStart;
        
        if (inv.items && inv.items.length > 0) {
          inv.items.forEach(item => {
            if (item.categoryId && categoryMap[item.categoryId]) {
              const category = categoryMap[item.categoryId];
              const amount = item.finalAmount || (item.price * item.quantity) || 0;
              
              if (isToday) category.dailyRevenue += amount;
              if (isThisWeek) category.weeklyRevenue += amount;
              if (isThisMonth) category.monthlyRevenue += amount;
              
              // Track subcategory revenue if exists
              if (item.subcategoryId && category.subcategories[item.subcategoryId]) {
                const subcategory = category.subcategories[item.subcategoryId];
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
        }
      });

      // 5. Top subcategories (this month)
      const allSubcategories = [];
      categoryPerformance.forEach(cat => {
        if (cat.subcategories) {
          Object.values(cat.subcategories).forEach(sub => {
            if (sub.revenue > 0) {
              allSubcategories.push({
                name: sub.name,
                category: cat.name,
                revenue: sub.revenue,
                salesCount: 0, // You'd need to track this separately
                avgPrice: 0    // You'd need to track this separately
              });
            }
          });
        }
      });

      // Sort and get top 10 subcategories
      const topSubcategories = allSubcategories
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map((sub, index) => ({
          ...sub,
          rank: index + 1
        }));

      // 6. Client insights - already filtered by clientType
      const regularClients = clientType === 'all' 
        ? clients.filter(c => c.isRegular).length 
        : clientType === 'regular' ? clients.length : 0;
      
      const totalClients = clientType === 'all' 
        ? clients.length 
        : clients.filter(c => clientType === 'regular' ? c.isRegular : !c.isRegular).length;
      
      const regularClientsRevenue = invoices
        .filter(inv => inv.client && inv.client.isRegular)
        .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      const regularClientsRevenuePercentage = totalRevenue > 0 
        ? Math.round((regularClientsRevenue / totalRevenue) * 100) 
        : 0;

      // 7. Top clients by spending (already filtered by clientType)
      const clientSpending = {};
      invoices.forEach(inv => {
        if (inv.client) {
          const clientId = inv.client._id;
          if (!clientSpending[clientId]) {
            clientSpending[clientId] = {
              totalSpent: 0,
              purchaseCount: 0
            };
          }
          clientSpending[clientId].totalSpent += inv.grandTotal || 0;
          clientSpending[clientId].purchaseCount += 1;
        }
      });

      const topClients = Object.entries(clientSpending)
        .map(([clientId, data]) => {
          const client = clients.find(c => c._id.equals(clientId));
          return {
            name: client?.name || 'Unknown Client',
            type: client?.isRegular ? 'Regular' : 'Non-regular',
            totalSpent: data.totalSpent,
            purchaseCount: data.purchaseCount,
            avgPurchase: data.purchaseCount > 0 
              ? data.totalSpent / data.purchaseCount 
              : 0
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      // 8. Generate recommendations
      const recommendations = [];
      
      // Example recommendations based on data
      if (regularClientsRevenuePercentage < 30 && clientType !== 'non-regular') {
        recommendations.push("Increase focus on regular clients - they currently generate only " + 
          regularClientsRevenuePercentage + "% of revenue");
      }
      
      if (topSubcategories.length > 0) {
        recommendations.push(`Promote your top subcategory "${topSubcategories[0].name}" more aggressively`);
      }

      if (categoryPerformance.some(cat => cat.monthlyRevenue === 0)) {
        const underperforming = categoryPerformance.filter(cat => cat.monthlyRevenue === 0);
        recommendations.push(`Review underperforming categories: ${
          underperforming.map(c => c.name).join(', ')
        }`);
      }

      // Construct the final report
      const report = {
        branch: {
          name: branch.name,
          managerName: branch.managerName || 'Not specified',
          location: branch.location || 'Not specified',
          isDefault: branch.isDefault || false
        },
        revenueSummary,
        categoryPerformance,
        topSubcategories,
        clientInsights: {
          regularClients,
          totalClients,
          regularClientsRevenuePercentage,
          newClientsThisMonth: 0 // You'd need to track this
        },
        topClients,
        recommendations,
        filters: {
          clientType,
          dateRange: '30d'
        }
      };

      res.status(200).json(report);

    } catch (err) {
      console.error('Error generating branch performance report:', err);
      res.status(500).json({ 
        message: 'Failed to generate report',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  };
  
// ========================
// 📊 Client Portfolio Overview
// ========================
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

    const { clientType = 'all', dateRange = '30d' } = req.query;

    console.log(`Generating report for branch ${branchId}, clientType: ${clientType}, dateRange: ${dateRange}`);
    
    // 1. Validate input parameters
    if (!companyId || !branchId) {
      return res.status(400).json({ 
        message: 'Company ID and Branch ID are required' 
      });
    }

    // 2. Get basic branch details with proper population and error handling
    const branch = await Branch.findOne({
      _id: branchId,
      company: companyId,
      deletedAt: null
    })
    .populate('company', 'name gstNumber')
    .lean();

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // 3. Define date ranges with proper error handling
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let daysBack = 30; // default
    switch(dateRange) {
      case '7d': daysBack = 7; break;
      case '30d': daysBack = 30; break;
      case '90d': daysBack = 90; break;
      default: daysBack = 30;
    }
    
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysBack);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // 4. Get all invoices in date range - with error handling
    let allInvoices = [];
    try {
      allInvoices = await Invoice.find({
        branch: branchId,
        date: { $gte: startDate },
        deletedAt: null
      })
      .populate('client', 'name isRegular')
      .lean();
    } catch (invoiceError) {
      console.error('Error fetching invoices:', invoiceError);
      // Continue with empty array instead of failing
      allInvoices = [];
    }

    console.log(`Found ${allInvoices.length} total invoices in last ${daysBack} days`);

    // 5. Filter invoices by client type with null checks
    let filteredInvoices = allInvoices;
    
    if (clientType === 'regular') {
      filteredInvoices = allInvoices.filter(inv => 
        inv.client && inv.client.isRegular === true
      );
    } else if (clientType === 'non-regular') {
      filteredInvoices = allInvoices.filter(inv => 
        inv.client && inv.client.isRegular === false
      );
    }
    // For 'all', keep all invoices including those without clients
    
    console.log(`After client type filtering: ${filteredInvoices.length} invoices`);

    // 6. Safe revenue calculation function
    const getRevenueForPeriod = (periodStart, periodEnd = new Date()) => {
      try {
        // Ensure end date includes the full day
        const endDateWithTime = new Date(periodEnd);
        endDateWithTime.setHours(23, 59, 59, 999);
        
        // Ensure start date starts from beginning of day
        const startDateWithTime = new Date(periodStart);
        startDateWithTime.setHours(0, 0, 0, 0);
        
        const filtered = filteredInvoices.filter(inv => {
          if (!inv.date) return false;
          const invDate = new Date(inv.date);
          return invDate >= startDateWithTime && invDate <= endDateWithTime;
        });
        
        const revenue = filtered.reduce((sum, inv) => {
          const amount = parseFloat(inv.grandTotal) || 0;
          return sum + amount;
        }, 0);
        
        const count = filtered.length;
        const avg = count > 0 ? revenue / count : 0;
        
        return { 
          revenue: Math.round(revenue * 100) / 100,
          count, 
          avg: Math.round(avg * 100) / 100 
        };
      } catch (error) {
        console.error('Error in getRevenueForPeriod:', error);
        return { revenue: 0, count: 0, avg: 0 };
      }
    };

    // 7. Generate revenue summary data with error handling
    const revenueSummary = [
      {
        period: 'Today',
        ...getRevenueForPeriod(today),
        isCurrent: true
      },
      {
        period: 'Yesterday',
        ...getRevenueForPeriod(yesterday, yesterday),
        isCurrent: false
      },
      {
        period: 'This Week',
        ...getRevenueForPeriod(thisWeekStart),
        isCurrent: true
      },
      {
        period: 'Last Week',
        ...getRevenueForPeriod(lastWeekStart, lastWeekEnd),
        isCurrent: false
      },
      {
        period: 'This Month',
        ...getRevenueForPeriod(thisMonthStart),
        isCurrent: true
      },
      {
        period: 'Last Month',
        ...getRevenueForPeriod(lastMonthStart, lastMonthEnd),
        isCurrent: false
      }
    ];

    // 8. Initialize category performance data with null checks
    const categoryPerformance = [];
    const categoryMap = {};
    
    // Initialize category data from branch categories
    if (branch.categories && Array.isArray(branch.categories) && branch.categories.length > 0) {
      branch.categories.forEach(cat => {
        if (cat && !cat.deletedAt) {
          const categoryData = {
            id: cat._id,
            name: cat.name || 'Unnamed Category',
            dailyRevenue: 0,
            weeklyRevenue: 0,
            monthlyRevenue: 0,
            totalRevenue: 0,
            subcategories: {},
            topSubcategory: { name: '', revenue: 0 }
          };
          categoryPerformance.push(categoryData);
          categoryMap[cat._id.toString()] = categoryData;
          
          // Initialize subcategory data if exists
          if (cat.subcategories && Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
            cat.subcategories.forEach(sub => {
              if (sub && !sub.deletedAt) {
                categoryData.subcategories[sub._id.toString()] = {
                  name: sub.name || 'Unnamed Subcategory',
                  revenue: 0
                };
              }
            });
          }
        }
      });
    }

    // 9. Process filtered invoices to calculate category revenues with error handling
    filteredInvoices.forEach(inv => {
      try {
        if (!inv.date) return;
        
        const invDate = new Date(inv.date);
        const isToday = invDate >= today;
        const isThisWeek = invDate >= thisWeekStart;
        const isThisMonth = invDate >= thisMonthStart;
        
        if (inv.items && Array.isArray(inv.items) && inv.items.length > 0) {
          inv.items.forEach(item => {
            try {
              const categoryId = item.categoryId ? item.categoryId.toString() : null;
              
              if (categoryId && categoryMap[categoryId]) {
                const category = categoryMap[categoryId];
                const amount = parseFloat(item.finalAmount) || 
                              (parseFloat(item.price) * parseFloat(item.quantity)) || 0;
                
                if (isToday) category.dailyRevenue += amount;
                if (isThisWeek) category.weeklyRevenue += amount;
                if (isThisMonth) category.monthlyRevenue += amount;
                
                // Track subcategory revenue if exists
                const subcategoryId = item.subcategoryId ? item.subcategoryId.toString() : null;
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
            } catch (itemError) {
              console.error('Error processing item:', itemError);
            }
          });
        }
      } catch (invoiceError) {
        console.error('Error processing invoice:', invoiceError);
      }
    });

    // Calculate total revenue for each category
    categoryPerformance.forEach(cat => {
      cat.totalRevenue = cat.monthlyRevenue;
      // Round all revenue values
      cat.dailyRevenue = Math.round(cat.dailyRevenue * 100) / 100;
      cat.weeklyRevenue = Math.round(cat.weeklyRevenue * 100) / 100;
      cat.monthlyRevenue = Math.round(cat.monthlyRevenue * 100) / 100;
      cat.totalRevenue = Math.round(cat.totalRevenue * 100) / 100;
    });

    // 10. Top subcategories (this month) with error handling
    const allSubcategories = [];
    categoryPerformance.forEach(cat => {
      if (cat.subcategories) {
        Object.values(cat.subcategories).forEach(sub => {
          if (sub.revenue > 0) {
            allSubcategories.push({
              name: sub.name,
              category: cat.name,
              revenue: Math.round(sub.revenue * 100) / 100,
              salesCount: 0, // Would need to track this separately
              avgPrice: 0    // Would need to track this separately
            });
          }
        });
      }
    });

    // Sort and get top 10 subcategories
    const topSubcategories = allSubcategories
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((sub, index) => ({
        ...sub,
        rank: index + 1
      }));

    // 11. Get all clients for calculations with error handling
    let allClients = [];
    try {
      allClients = await Client.find({
        company: companyId,
        deletedAt: null
      }).lean();
    } catch (clientError) {
      console.error('Error fetching clients:', clientError);
      allClients = [];
    }

    // Filter clients based on clientType
    let relevantClients = allClients;
    if (clientType === 'regular') {
      relevantClients = allClients.filter(c => c.isRegular);
    } else if (clientType === 'non-regular') {
      relevantClients = allClients.filter(c => !c.isRegular);
    }

    // 12. Client insights calculations with null checks
    const regularClients = allClients.filter(c => c.isRegular).length;
    const totalClients = allClients.length;
    
    const regularClientsRevenue = filteredInvoices
      .filter(inv => inv.client && inv.client.isRegular)
      .reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0);
    
    const totalRevenue = filteredInvoices.reduce((sum, inv) => 
      sum + (parseFloat(inv.grandTotal) || 0), 0);
    const regularClientsRevenuePercentage = totalRevenue > 0 
      ? Math.round((regularClientsRevenue / totalRevenue) * 100) 
      : 0;

    // 13. Top clients by spending (filtered by clientType)
    const clientSpending = {};
    filteredInvoices.forEach(inv => {
      if (inv.client && inv.client._id) {
        const clientId = inv.client._id.toString();
        if (!clientSpending[clientId]) {
          clientSpending[clientId] = {
            name: inv.client.name || 'Unknown Client',
            isRegular: inv.client.isRegular || false,
            totalSpent: 0,
            purchaseCount: 0
          };
        }
        clientSpending[clientId].totalSpent += parseFloat(inv.grandTotal) || 0;
        clientSpending[clientId].purchaseCount += 1;
      }
    });

    const topClients = Object.values(clientSpending)
      .map(client => ({
        ...client,
        totalSpent: Math.round(client.totalSpent * 100) / 100,
        type: client.isRegular ? 'Regular' : 'Non-regular',
        avgPurchase: client.purchaseCount > 0 
          ? Math.round((client.totalSpent / client.purchaseCount) * 100) / 100
          : 0
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // 14. Generate recommendations
    const recommendations = [];
    
    if (regularClientsRevenuePercentage < 30 && clientType !== 'non-regular') {
      recommendations.push(`Increase focus on regular clients - they currently generate only ${regularClientsRevenuePercentage}% of revenue`);
    }
    
    if (topSubcategories.length > 0) {
      recommendations.push(`Promote your top subcategory "${topSubcategories[0].name}" more aggressively`);
    }

    const underperformingCategories = categoryPerformance.filter(cat => cat.monthlyRevenue === 0);
    if (underperformingCategories.length > 0) {
      recommendations.push(`Review underperforming categories: ${underperformingCategories.map(c => c.name).join(', ')}`);
    }

    if (totalRevenue === 0) {
      recommendations.push('No revenue data found for the selected period and client type. Consider expanding your date range or client filter.');
    }

    // 15. Construct the final report
    const report = {
      branch: {
        name: branch.name || 'Unknown Branch',
        managerName: branch.managerName || 'Not specified',
        location: branch.location || 'Not specified',
        isDefault: branch.isDefault || false
      },
      revenueSummary,
      categoryPerformance: categoryPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue),
      topSubcategories,
      clientInsights: {
        regularClients,
        totalClients,
        regularClientsRevenuePercentage,
        filteredClients: relevantClients.length,
        newClientsThisMonth: 0 // Would need to track creation dates
      },
      topClients,
      recommendations,
      filters: {
        clientType,
        dateRange
      },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalInvoices: filteredInvoices.length,
        avgInvoiceValue: filteredInvoices.length > 0 
          ? Math.round((totalRevenue / filteredInvoices.length) * 100) / 100 
          : 0
      }
    };

    console.log('Report generated successfully:', {
      totalRevenue: report.summary.totalRevenue,
      totalInvoices: report.summary.totalInvoices,
      categoriesWithRevenue: categoryPerformance.filter(c => c.totalRevenue > 0).length
    });

    res.status(200).json(report);

  } catch (err) {
    console.error('Error generating branch performance report:', err);
    res.status(500).json({ 
      message: 'Failed to generate report',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};








