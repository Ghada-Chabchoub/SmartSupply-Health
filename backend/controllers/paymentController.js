const Order = require('../models/Order');
const { createAndPayAutoOrder, simulatePaymentGateway } = require('../services/paymentService');

exports.processPayment = async (req, res) => {
  const { orderId } = req.params;
  const { paymentDetails } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    const paymentResult = await simulatePaymentGateway(order.totalAmount, paymentDetails);

    if (paymentResult.success) {
      order.paymentStatus = 'Paid';
      order.status = 'confirmed'; // Move order to next stage
      order.paymentDetails = {
        method: paymentDetails.method,
        transactionId: paymentResult.transactionId,
      };
      await order.save();
      res.json({ message: 'Payment successful', order });
    } else {
      order.paymentStatus = 'Failed';
      await order.save();
      res.status(400).json({ message: 'Payment failed' });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).send('Server error');
  }
};

exports.createAutomaticOrderAndPay = async (req, res) => {
  try {
    const result = await createAndPayAutoOrder(req.user.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Automatic order creation error:', error);
    res.status(500).send('Server error');
  }
};