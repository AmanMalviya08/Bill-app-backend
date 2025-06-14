const Company = require('../models/Company');
const Client = require('../models/Client');
const Branch = require('../models/Branch');

// ✅ Create a new client with automatic GST logic
exports.createClient = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const {
      name,
      email,
      phone,
      address,
      branch, // branchId
      categoryId,
      subcategoryId,
      isRegular = false,
      discountPercentage = 0
    } = req.body;

    // 1. Fetch Company for GST
    const company = await Company.findById(companyId);
    if (!company || company.deletedAt) {
      return res.status(404).json({ message: 'Company not found or has been deleted' });
    }

    // 2. Fetch Branch and validate category/subcategory
    const branchDoc = await Branch.findById(branch);
    if (!branchDoc || branchDoc.deletedAt) {
      return res.status(404).json({ message: 'Branch not found or has been deleted' });
    }

    const category = branchDoc.categories.id(categoryId);
    if (!category || category.deletedAt) {
      return res.status(404).json({ message: 'Category not found or deleted' });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory || subcategory.deletedAt) {
      return res.status(404).json({ message: 'Subcategory not found or deleted' });
    }

    // 3. Create Client
    const client = await Client.create({
      name,
      email,
      phone,
      address,
      branch,
      company: companyId,
      categoryId,
      subcategoryId,
      gstFromSubcategory: subcategory.gst || 0,
      companyGSTNumber: company.gstNumber || '',
      isRegular,
      discountPercentage
    });

    res.status(201).json(client);
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all non-deleted clients for a company
exports.getClients = async (req, res) => {
  try {
    const { companyId } = req.params;
    const clients = await Client.find({
      company: companyId,
      deletedAt: null,
    });
    res.status(200).json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get single client - UPDATED to use clientId parameter
exports.getClient = async (req, res) => {
  try {
    const { companyId, clientId } = req.params;
    
    const client = await Client.findOne({
      _id: clientId,
      company: companyId,
      deletedAt: null
    }).lean();

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json(client);
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update client info - UPDATED to use clientId parameter
exports.updateClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const updated = await Client.findByIdAndUpdate(clientId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Client not found' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Mark client as regular and set discount - UPDATED to use clientId parameter
exports.markClientAsRegular = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { discountPercentage = 0 } = req.body;

    const updated = await Client.findByIdAndUpdate(
      clientId,
      { isRegular: true, discountPercentage },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Client not found' });

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Soft delete client - UPDATED to use clientId parameter
exports.deleteClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const deleted = await Client.findByIdAndUpdate(
      clientId,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!deleted) return res.status(404).json({ message: 'Client not found' });
    res.status(200).json({ message: 'Client soft deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Fetch client with price breakdown - UPDATED to use clientId parameter
exports.getClientWithPrices = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findOne({ _id: clientId, deletedAt: null }).lean();
    if (!client) return res.status(404).json({ message: 'Client not found or deleted' });

    const branches = await Branch.find({
      company: client.company,
      deletedAt: null
    }).select('name location categories').lean();

    const processedBranches = branches.map(branch => {
      const categories = (branch.categories || [])
        .filter(cat => !cat.deletedAt)
        .map(cat => {
          const subcategories = (cat.subcategories || [])
            .filter(sub => !sub.deletedAt)
            .map(sub => {
              const discountedPrice = client.isRegular
                ? +(sub.price * (1 - (client.discountPercentage || 0) / 100)).toFixed(2)
                : sub.price;
              return {
                ...sub,
                discountedPrice
              };
            });
          return {
            ...cat,
            subcategories
          };
        });

      return {
        ...branch,
        categories
      };
    });

    res.status(200).json({ client, branches: processedBranches });
  } catch (err) {
    console.error('Error fetching client prices:', err);
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get all invoices for a client
exports.getClientInvoices = async (req, res) => {
  try {
    const { companyId, clientId } = req.params;
    
    // First verify the client exists and belongs to the company
    const client = await Client.findOne({
      _id: clientId,
      company: companyId,
      deletedAt: null
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // In a real application, you would fetch invoices from your database
    // For now, we'll return an empty array as a placeholder
    const invoices = []; // Replace with actual database query
    
    res.status(200).json(invoices);
  } catch (err) {
    console.error('Error fetching client invoices:', err);
    res.status(500).json({ message: err.message });
  }
};