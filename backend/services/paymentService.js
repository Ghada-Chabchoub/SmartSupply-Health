const mongoose = require('mongoose');
const Order = require('../models/Order');
const ClientInventory = require('../models/ClientInventory');
const Product = require('../models/Product');
const Client = require('../models/Client');
const sendEmail = require('../utils/emailService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createAndPayAutoOrder = async (clientId) => {
  // Ensure clientId is a valid ObjectId to prevent errors
  const validClientId = new mongoose.Types.ObjectId(clientId);

  const inventoryItems = await ClientInventory.find({ client: validClientId, 'autoOrder.enabled': true }).populate('product');
  
  const itemsToOrder = inventoryItems.filter(item => item.currentStock <= item.reorderPoint && item.reorderQty > 0);

  if (itemsToOrder.length === 0) {
    return { success: true, message: 'No items to reorder at this time.' };
  }

  const orderProducts = itemsToOrder.map(item => ({
    product: item.product._id,
    quantity: item.reorderQty,
    unitPrice: item.product.price,
    totalPrice: item.product.price * item.reorderQty,
  }));

  const totalAmount = orderProducts.reduce((sum, p) => sum + p.totalPrice, 0);
  
  const deliveryAddress = {
    street: 'Auto-order default street',
    city: 'Default City',
    postalCode: '00000',
    country: 'Default Country',
  };

  const order = new Order({
    orderNumber: 'ORD-' + Date.now(),
    client: validClientId,
    items: orderProducts,
    totalAmount,
    deliveryAddress,
    notes: 'Commande automatique générée par le système.',
    status: 'pending',
    paymentStatus: 'Pending',
  });
  
  await order.save();

  // --- Stripe Payment Logic ---
  try {
    const client = await Client.findById(validClientId);
    if (!client || !client.stripeCustomerId) {
        // This is a critical check for clients created before Stripe integration
        console.warn(`Skipping auto-order for client ${clientId}: Missing Stripe Customer ID.`);
        order.paymentStatus = 'Failed';
        order.notes += ' Automatic payment skipped: Client is not configured for Stripe payments.';
        await order.save();
        return { success: false, message: 'Client not configured for Stripe payments.' };
    }

    // Retrieve the client's saved payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
        customer: client.stripeCustomerId,
        type: 'card',
    });

    if (paymentMethods.data.length === 0) {
        throw new Error('No saved payment method found for this client.');
    }
    const paymentMethodId = paymentMethods.data[0].id;

    // Create and confirm a PaymentIntent for an off-session payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Amount in cents
      currency: 'eur',
      customer: client.stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: { orderId: order._id.toString() },
    });

    // --- Payment Successful ---
    order.paymentStatus = 'Paid';
    order.status = 'confirmed';
    order.paymentDetails = {
      method: 'stripe',
      transactionId: paymentIntent.id,
    };
    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    if (client.email) {
      const productDetailsList = order.items.map(item => {
        const inventoryItem = inventoryItems.find(invItem => invItem.product._id.equals(item.product));
        const productName = inventoryItem ? inventoryItem.product.name : 'Unknown Product';
        return `<li>${productName} (Quantity: ${item.quantity})</li>`;
      }).join('');

      const emailHtml = `
        <h1>Hello ${client.name},</h1>
        <p>Your automatic order <strong>${order.orderNumber}</strong> has been created and paid successfully.</p>
        <h3>Order Details:</h3>
        <ul>
          ${productDetailsList}
        </ul>
        <p><strong>Total Amount: ${order.totalAmount.toFixed(2)}€</strong></p>
        <p>Thank you for your trust.</p>
      `;
      await sendEmail(client.email, 'Confirmation of your automatic order', emailHtml);
    }

    return { success: true, message: 'Automatic order created and paid successfully.', order };

  } catch (error) {
    console.error('Stripe automatic payment error:', error);
    order.paymentStatus = 'Failed';
    order.notes += ` Automatic payment failed: ${error.message}`;
    await order.save();
    return { success: false, message: `Automatic order created, but payment failed: ${error.message}`, order };
  }
};

module.exports = { createAndPayAutoOrder };