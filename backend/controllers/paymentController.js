const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createAndPayAutoOrder } = require('../services/paymentService');

exports.createPaymentIntent = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this order' });
    }
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Amount in cents
      currency: 'eur',
      metadata: { orderId: order._id.toString() },
    });

    // Send publishable key and client secret to client
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY 
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).send('Server error');
  }
};

exports.updateOrderAfterPayment = async (req, res) => {
    const { orderId } = req.params;
    const { paymentIntentId } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.client.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            order.paymentStatus = 'Paid';
            order.status = 'confirmed';
            order.paymentDetails = {
                method: 'stripe',
                transactionId: paymentIntent.id,
            };
            await order.save();
            res.json({ message: 'Payment successful and order updated', order });
        } else {
            order.paymentStatus = 'Failed';
            await order.save();
            res.status(400).json({ message: 'Payment not successful' });
        }
    } catch (error) {
        console.error('Error updating order after payment:', error);
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
