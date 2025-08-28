const mongoose = require('mongoose');
const Product = require('../models/Product');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, reference, description, price, stock, category } = req.body;
    const images = req.files ? req.files.map(file => '/uploads/' + file.filename) : [];

    const product = new Product({
      supplier: req.user.id,
      name, reference, description, price, stock, category,
      images
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Error in createProduct:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, supplier: req.user.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => '/uploads/' + file.filename);
      product.images = [...product.images, ...newImages];
    }

    const { name, reference, description, price, stock, category } = req.body;
    if (name !== undefined) product.name = name;
    if (reference !== undefined) product.reference = reference;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (category !== undefined) product.category = category;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Error in updateProduct:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete (soft)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, supplier: req.user.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.active = false;
    await product.save();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error in deleteProduct:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get product by id
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    const product = await Product.findOne({ _id: id, supplier: req.user.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error in getProduct:', err);
    res.status(500).json({ message: err.message });
  }
};

// List products with pagination, search, sorting
exports.listProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, q, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = { supplier: req.user._id, active: true };

    if (category) {
      filter.category = category; // Exact match for category
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { reference: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    res.json({
      data: products,
      page: Number(page),
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error in listProducts:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta, set } = req.body;
    const product = await Product.findOne({ _id: id, supplier: req.user.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (typeof set === 'number') product.stock = set;
    else if (typeof delta === 'number') product.stock = Math.max(0, product.stock + delta);

    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Error in updateStock:', err);
    res.status(500).json({ message: err.message });
  }
};

// List products for client
exports.listProductsForClient = async (req, res) => {
  try {
    let { page = 1, limit = 10, q, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const filter = { active: true };

    if (category) {
      filter.category = category;
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { reference: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate('supplier', 'name')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: products,
      page,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error in listProductsForClient:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get unique categories
exports.getCategories = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const categories = await Product.distinct('category', { active: true });
    res.json(categories.filter(category => category));
  } catch (err) {
    console.error('Error in getCategories:', err);
    res.status(500).json({ message: err.message });
  }
};

// Add new category
exports.addCategory = async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) return res.status(400).json({ message: 'Category is required' });

    const existingCategory = await Product.findOne({ category, active: true });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const product = new Product({
      supplier: req.user.id,
      name: `Placeholder for ${category}`,
      reference: `CAT-${category.toUpperCase()}`,
      category,
      price: 0,
      stock: 0,
      active: false
    });
    await product.save();

    res.status(201).json({ message: 'Category added', category });
  } catch (err) {
    console.error('Error in addCategory:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all active products for public view (no auth required)
exports.getPublicProducts = async (req, res) => {
  try {
    const products = await Product.find({ active: true })
      .populate('supplier', 'name')
      .sort({ name: 1 });
    res.json(products);
  } catch (err) {
    console.error('Error in getPublicProducts:', err);
    res.status(500).json({ message: 'Server error while fetching public products' });
  }
};
