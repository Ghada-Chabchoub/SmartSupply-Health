const Order = require('../models/Order');
const ClientInventory = require('../models/ClientInventory');
const Product = require('../models/Product');

const simulatePaymentGateway = async (amount, paymentDetails) => {
  console.log(`Processing payment of ${amount}€ with method ${paymentDetails.method}`);
  return new Promise(resolve => {
    setTimeout(() => {
      const isSuccess = Math.random() > 0.1; // 90% success rate
      resolve({
        success: isSuccess,
        transactionId: `txn_${Date.now()}`,
        message: isSuccess ? 'Payment successful' : 'Payment failed',
      });
    }, 1000);
  });
};

const createAndPayAutoOrder = async (clientId) => {
  const inventoryItems = await ClientInventory.find({ client: clientId, 'autoOrder.enabled': true }).populate('product');
  
  const itemsToOrder = inventoryItems.filter(item => item.currentStock <= item.reorderPoint && item.reorderQty > 0);

  if (itemsToOrder.length === 0) {
    return { message: 'No items to reorder at this time.' };
  }

  const orderProducts = itemsToOrder.map(item => ({
    product: item.product._id,
    quantity: item.reorderQty,
    price: item.product.price,
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
    client: clientId,
    items: orderProducts,
    totalAmount,
    deliveryAddress,
    notes: 'Commande automatique générée par le système.',
    status: 'pending',
    paymentStatus: 'Pending',
  });
  
  await order.save();

  const autoPaymentDetails = { method: 'saved_card', cardId: 'card_default' };
  const paymentResult = await simulatePaymentGateway(order.totalAmount, autoPaymentDetails);

  if (paymentResult.success) {
    order.paymentStatus = 'Paid';
    order.status = 'confirmed';
    order.paymentDetails = {
      method: autoPaymentDetails.method,
      transactionId: paymentResult.transactionId,
    };
    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    return { success: true, message: 'Automatic order created and paid successfully.', order };
  } else {
    order.paymentStatus = 'Failed';
    order.notes += ' Le paiement automatique a échoué.';
    await order.save();
    return { success: false, message: 'Automatic order created, but payment failed.', order };
  }
};

module.exports = { createAndPayAutoOrder, simulatePaymentGateway };
