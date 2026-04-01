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

// ==============================
// PLACE ORDER
// ==============================
router.post('/', optionalAuth, async (req, res) => {
  try {
    const orders = await readData('orders.json');
    const {
      items,
      total,
      paymentMethod = 'cod',
      shippingAddress = null
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    const cleanedItems = items
      .map((item) => ({
        productId: Number(item.productId),
        productName: String(item.productName || '').trim(),
        quantity: Math.max(1, Number(item.quantity || 1))
      }))
      .filter(
        (item) =>
          !Number.isNaN(item.productId) &&
          item.productId > 0 &&
          !Number.isNaN(item.quantity) &&
          item.quantity > 0
      );

    if (cleanedItems.length === 0) {
      return res.status(400).json({ message: 'Valid order items are required' });
    }

    const numericTotal = Number(total);
    if (Number.isNaN(numericTotal) || numericTotal <= 0) {
      return res.status(400).json({ message: 'A valid total amount is required' });
    }

    const allowedPaymentMethods = ['cod', 'upi', 'razorpay'];
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    let cleanedShippingAddress = null;

    if (paymentMethod === 'cod') {
      const requiredAddressFields = ['flat', 'building', 'area', 'city', 'pin', 'state'];

      const missingAddressField = requiredAddressFields.find(
        (field) => !shippingAddress || !String(shippingAddress[field] || '').trim()
      );

      if (missingAddressField) {
        return res
          .status(400)
          .json({ message: 'Complete delivery address is required for COD' });
      }

      cleanedShippingAddress = {
        flat: String(shippingAddress.flat || '').trim(),
        building: String(shippingAddress.building || '').trim(),
        area: String(shippingAddress.area || '').trim(),
        city: String(shippingAddress.city || '').trim(),
        pin: String(shippingAddress.pin || '').trim(),
        state: String(shippingAddress.state || '').trim()
      };
    }

    const now = Date.now();

    const newOrder = {
      id: String(now),
      userId: req.user?.id ? String(req.user.id) : `guest-${now}`,
      email: req.user?.email || 'guest@example.com',
      items: cleanedItems,
      total: numericTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'PENDING' : 'PAID',
      shippingAddress: cleanedShippingAddress,
      status: 'Placed',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    await writeData('orders.json', orders);

    return res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (err) {
    console.error('Place order error:', err);
    return res.status(500).json({ message: 'Unable to place order' });
  }
});

// ==============================
// GET MY ORDERS
// ==============================
router.get('/my', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json([]);
    }

    const orders = await readData('orders.json');

    const userOrders = orders
      .filter(
        (order) =>
          String(order.userId) === String(req.user.id) ||
          String(order.email).toLowerCase() === String(req.user.email).toLowerCase()
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json(userOrders);
  } catch (err) {
    console.error('My orders error:', err);
    return res.status(500).json({ message: 'Unable to fetch orders' });
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }

    const orders = await readData('orders.json');
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json(sortedOrders);
  } catch (err) {
    console.error('All orders error:', err);
    return res.status(500).json({ message: 'Unable to fetch all orders' });
  }
});

// ==============================
// UPDATE ORDER STATUS
// ==============================
// Useful for admin/demo tracking updates
router.patch('/:id/status', optionalAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      'Placed',
      'Confirmed',
      'Shipped',
      'Delivered',
      'Cancelled'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const orders = await readData('orders.json');
    const orderIndex = orders.findIndex(
      (order) => String(order.id) === String(id)
    );

    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }

    orders[orderIndex].status = status;

    if (status === 'Delivered') {
      orders[orderIndex].paymentStatus =
        orders[orderIndex].paymentMethod === 'cod' ? 'COMPLETED' : 'PAID';
    }

    if (status === 'Cancelled') {
      orders[orderIndex].paymentStatus = 'CANCELLED';
    }

    orders[orderIndex].updatedAt = new Date().toISOString();

    await writeData('orders.json', orders);

    return res.json({
      message: 'Order status updated successfully',
      order: orders[orderIndex]
    });
  } catch (err) {
    console.error('Update order status error:', err);
    return res.status(500).json({ message: 'Unable to update order status' });
  }
});

module.exports = router;