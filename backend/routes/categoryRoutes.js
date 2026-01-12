const router = require('express').Router();
const Category = require('../models/Category');
const verify = require('./verifyToken');

// GET ALL CATEGORIES (User's custom ones)
router.get('/', verify, async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user._id });
    res.json(categories);
  } catch (err) {
    res.json({ message: err });
  }
});

// ADD NEW CATEGORY
router.post('/add', verify, async (req, res) => {
  const category = new Category({
    userId: req.user._id,
    name: req.body.name
  });

  try {
    const savedCategory = await category.save();
    res.json(savedCategory);
  } catch (err) {
    res.json({ message: err });
  }
});


// UPDATE CATEGORY BUDGET
router.put('/:id', verify, async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: { budget: req.body.budget } },
      { new: true }
    );
    res.json(updatedCategory);
  } catch (err) {
    res.json({ message: err });
  }
});


module.exports = router;