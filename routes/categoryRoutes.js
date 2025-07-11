const express = require('express');
const router = express.Router({ mergeParams: true });

// Get categories for a branch
router.get('/branches/:branchId/categories', async (req, res) => {
  try {
    const categories = await Category.find({
      branch: req.params.branchId,
      deletedAt: null
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a category under a branch
router.post('/branches/:branchId/categories', async (req, res) => {
  try {
    const category = new Category({
      name: req.body.name,
      branch: req.params.branchId,
      subcategories: req.body.subcategories || []
    });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


module.exports = router;
