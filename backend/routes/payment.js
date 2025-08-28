const express = require('express');
const router = express.Router();

// ⬇️ Corriger l'import: on destructure pour récupérer la fonction middleware
const { auth, authorize } = require('../middleware/auth');

const Order = require('../models/Order');
const { createAndPayAutoOrder, simulatePaymentGateway } = require('../services/paymentService');

// ----- Controllers -----

const processPayment = async (req, res) => {
  const { orderId } = req.params;
  const { paymentDetails } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // req.user et req.role sont ajoutés par le middleware auth()
    if (order.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    const paymentResult = await simulatePaymentGateway(order.totalAmount, paymentDetails);

    if (paymentResult.success) {
      order.paymentStatus = 'Paid';
      order.status = 'confirmed';
      order.paymentDetails = {
        method: paymentDetails?.method,
        transactionId: paymentResult.transactionId,
      };
      await order.save();
      return res.json({ message: 'Payment successful', order });
    } else {
      order.paymentStatus = 'Failed';
      await order.save();
      return res.status(400).json({ message: 'Payment failed' });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return res.status(500).send('Server error');
  }
};

const createAutomaticOrderAndPayHandler = async (req, res) => {
  try {
    const result = await createAndPayAutoOrder(req.user.id);
    if (result.success) return res.json(result);
    return res.status(400).json(result);
  } catch (error) {
    console.error('Automatic order creation error:', error);
    return res.status(500).send('Server error');
  }
};

// ----- Routes -----
// (Tu peux aussi restreindre au rôle "client" si tu veux)
router.post('/pay/:orderId', auth, authorize('client'), processPayment);
router.post('/automatic-order', auth, authorize('client'), createAutomaticOrderAndPayHandler);

module.exports = router;
