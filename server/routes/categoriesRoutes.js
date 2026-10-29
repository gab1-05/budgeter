const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Category = require('../models/Category');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const cats = await Category.find({ user: req.userId }).sort({ type: 1, name: 1 });
    res.json(cats);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const cat = await Category.create({ ...req.body, user: req.userId });
    res.status(201).json(cat);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Category already exists' });
    res.status(400).json({ message: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const cat = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );
    if (!cat) return res.status(404).json({ message: 'Not found' });
    res.json(cat);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Category already exists' });
    res.status(400).json({ message: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Category.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;