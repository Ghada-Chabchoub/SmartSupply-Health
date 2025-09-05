const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
    createPaymentIntent,
    updateOrderAfterPayment,
    createAutomaticOrderAndPay,
} = require('../controllers/paymentController');

// Create a payment intent for an order
router.post('/create-payment-intent/:orderId', auth, authorize('client'), createPaymentIntent);

// Update order status after a successful payment
router.post('/update-order-payment-status/:orderId', auth, authorize('client'), updateOrderAfterPayment);

// Trigger automatic order creation and payment
router.post('/automatic-order', auth, authorize('client'), createAutomaticOrderAndPay);

module.exports = router;
