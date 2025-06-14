const Company = require('../models/Company');
const path = require('path');

exports.createCompany = async (req, res) => {
  try {
    const { name, gstNumber, address, ownerName, phone, email } = req.body;
    const backgroundPhoto = req.file ? req.file.path : '';

    const company = await Company.create({
      name,
      gstNumber,
      address,
      ownerName,
      phone,
      email,
      backgroundPhoto
    });
 
    res.status(201).json(company);
  } catch (err) {
    console.error('Error creating company:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ deletedAt: null });
    res.status(200).json(companies);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, deletedAt: null });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.status(200).json(company);
  } catch (err) {
    console.error('Error fetching company by ID:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.backgroundPhoto = req.file.path;
    }

    const updatedCompany = await Company.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ message: 'Company not found or has been deleted' });
    }

    res.status(200).json(updatedCompany);
  } catch (err) {
    console.error('Error updating company:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const deletedCompany = await Company.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!deletedCompany) {
      return res.status(404).json({ message: 'Company not found or already deleted' });
    }

    res.status(200).json({ message: 'Company soft-deleted successfully' });
  } catch (err) {
    console.error('Error deleting company:', err);
    res.status(500).json({ message: err.message });
  }
};
