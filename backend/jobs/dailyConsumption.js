const cron = require('node-cron');
const ClientInventory = require('../models/ClientInventory');
const { createAndPayAutoOrder } = require('../services/paymentService');
const mongoose = require('mongoose');
const Client = require('../models/Client');

async function runAutoOrdersForClient(client) {
  console.log(`Checking auto-orders for client: ${client.name}`);
  try {
    const result = await createAndPayAutoOrder(client._id);
    if (result.order) {
      console.log(`Auto-order created for client ${client.name}, Order ID: ${result.order._id}, Success: ${result.success}`);
    } else {
      console.log(`No auto-order needed for client ${client.name}. Reason: ${result.message}`);
    }
  } catch (error) {
    console.error(`Error processing auto-order for client ${client._id}:`, error);
  }
}

function scheduleDailyConsumption() {
  // Schedule to run every day at 'min h' (server time)
  cron.schedule('53 19 * * *', async () => {
    console.log('Starting daily consumption and auto-order job...');
    try {
      // 1. Decrement stock based on daily usage for all inventories
      await ClientInventory.updateMany(
        { dailyUsage: { $gt: 0 } },
        [
          {
            $set: {
              currentStock: {
                $max: [0, { $subtract: ['$currentStock', '$dailyUsage'] }]
              },
              lastDecrementAt: new Date()
            }
          }
        ]
      );
      console.log('Daily consumption stock decremented.');

      // 2. Find all clients with items that have auto-ordering enabled
      const clientsWithAutoOrder = await ClientInventory.distinct('client', { 'autoOrder.enabled': true });

      // 3. Process auto-orders for each client
      for (const clientId of clientsWithAutoOrder) {
        const client = await Client.findById(clientId);
        if (client) {
          await runAutoOrdersForClient(client);
        }
      }

      console.log('Daily consumption and auto-order job finished.');
    } catch (e) {
      console.error('Error in daily consumption job:', e);
    }
  }, {
    timezone: 'Africa/Tunis' // Example timezone
  });
}

module.exports = { scheduleDailyConsumption };