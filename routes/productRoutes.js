const express = require('express');
const jwt = require('jsonwebtoken');
const { readData, writeData } = require('../utils/db');

const router = express.Router();

const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'shoppingweb_secret_key'
      );
      req.user = decoded;
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }

  next();
};

router.get('/', async (_req, res) => {
  try {
    const products = await readData('products.json');
    return res.json(products);
  } catch (err) {
    console.error('Fetch products error:', err);
    return res.status(500).json({ message: 'Unable to fetch products' });
  }
});

router.post('/', optionalAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }

    const products = await readData('products.json');
    const { name, price, category, color, season, image, description } = req.body;

    if (!name || !price || !category || !color || !season || !image || !description) {
      return res.status(400).json({ message: 'All product fields are required' });
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: 'Valid product price is required' });
    }

    const newProduct = {
      id: Date.now(),
      name: String(name).trim(),
      price: numericPrice,
      category: String(category).trim(),
      color: String(color).trim().toLowerCase(),
      season: String(season).trim().toLowerCase(),
      image: String(image).trim(),
      description: String(description).trim(),
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    await writeData('products.json', products);

    return res.status(201).json({
      message: 'Product added successfully',
      product: newProduct
    });
  } catch (err) {
    console.error('Add product error:', err);
    return res.status(500).json({ message: 'Unable to add product' });
  }
});

router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }

    const products = await readData('products.json');
    const filteredProducts = products.filter(
      (product) => String(product.id) !== String(req.params.id)
    );

    if (filteredProducts.length === products.length) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await writeData('products.json', filteredProducts);

    return res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ message: 'Unable to delete product' });
  }
});

module.exports = router;