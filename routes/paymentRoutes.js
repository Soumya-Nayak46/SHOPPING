const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const router = express.Router();

const hasRealKeys = () => {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes('YOUR_REAL') &&
    !process.env.RAZORPAY_KEY_SECRET.includes('YOUR_REAL')
  );
};

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.get('/health', (_req, res) => {
  res.json({
    status: 'Payment service is running',
    configured: hasRealKeys()
  });
});

router.post('/create-order', async (req, res) => {
  try {
    if (!hasRealKeys()) {
      return res.status(400).json({ message: 'Razorpay keys are not configured. Use COD or add real test keys.' });
    }

    const amount = Number(req.body.amount);
    const orderId = String(req.body.orderId || '').trim();

    if (Number.isNaN(amount) || amount <= 0 || !orderId) {
      return res.status(400).json({ message: 'Valid amount and orderId are required' });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: orderId,
      payment_capture: 1
    });

    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    return res.status(500).json({ message: 'Failed to create payment order' });
  }
});

router.post('/verify-payment', async (req, res) => {
  try {
    if (!hasRealKeys()) {
      return res.status(400).json({ message: 'Razorpay keys are not configured.' });
    }

    const {
      razorpayPaymentId = '',
      razorpayOrderId = '',
      razorpaySignature = ''
    } = req.body;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification details are missing' });
    }

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed - invalid signature' });
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId
    });
  } catch (err) {
    console.error('Razorpay verify-payment error:', err);
    return res.status(500).json({ message: 'Payment verification failed' });
  }
});

module.exports = router;
