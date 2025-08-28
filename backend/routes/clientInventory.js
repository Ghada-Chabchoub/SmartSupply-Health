const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ClientInventory = require('../models/ClientInventory');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');

// ✅ Toutes les routes ci-dessous exigent un token valide ET le rôle client
router.use(auth, authorize('client'));

// LISTE — tableau de stock du client (avec jointure produit)
router.get('/', async (req, res) => {
  try {
    const clientId = req.user._id; // vient du middleware auth
    const items = await ClientInventory.find({ client: clientId })
      .populate('product', 'name reference price images category');
    res.json(items);
  } catch (e) {
    console.error('GET /client-inventory error:', e);
    res.status(500).json({ message: 'Erreur liste inventaire', error: e.message });
  }
});

// CRÉER / METTRE À JOUR (upsert) une ligne pour un produit
router.post('/upsert', async (req, res) => {
  try {
    const clientId = req.user._id;
    const { productId, currentStock, dailyUsage, reorderPoint, reorderQty, autoOrder } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'productId invalide' });
    }

    const prod = await Product.findById(productId);
    if (!prod) return res.status(404).json({ message: 'Produit introuvable' });

    const doc = await ClientInventory.findOneAndUpdate(
      { client: clientId, product: productId },
      {
        $set: {
          currentStock: Number(currentStock ?? 0),
          dailyUsage: Number(dailyUsage ?? 0),
          reorderPoint: Number(reorderPoint ?? 0),
          reorderQty: Number(reorderQty ?? 0),
          autoOrder: { enabled: autoOrder?.enabled !== false }
        }
      },
      { new: true, upsert: true }
    );
    res.json(doc);
  } catch (e) {
    console.error('POST /client-inventory/upsert error:', e);
    res.status(500).json({ message: 'Erreur upsert inventaire', error: e.message });
  }
});

// AJUSTER le stock manuellement (+/-)
router.patch('/:inventoryId/adjust', async (req, res) => {
  try {
    const clientId = req.user._id;
    const { delta } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.inventoryId)) {
      return res.status(400).json({ message: 'inventoryId invalide' });
    }

    const inv = await ClientInventory.findOneAndUpdate(
      { _id: req.params.inventoryId, client: clientId },
      { $inc: { currentStock: Number(delta || 0) } },
      { new: true }
    );
    if (!inv) return res.status(404).json({ message: 'Ligne non trouvée' });
    res.json(inv);
  } catch (e) {
    console.error('PATCH /client-inventory/:id/adjust error:', e);
    res.status(500).json({ message: 'Erreur ajustement stock', error: e.message });
  }
});

// SIMULER sur N jours
router.get('/simulate-consumption', async (req, res) => {
  try {
    const clientId = req.user._id;
    const days = Math.max(1, Number(req.query.days || 7));
    const items = await ClientInventory.find({ client: clientId }).populate('product', 'name price');
    const out = items.map(it => {
      const current = Number(it.currentStock || 0);
      const daily = Number(it.dailyUsage || 0);
      const projected = Math.max(0, current - daily * days);
      return {
        product: it.product,
        currentStock: current,
        dailyUsage: daily,
        afterDays: days,
        projectedStock: projected,
        hitsReorder: projected <= Number(it.reorderPoint || 0)
      };
    });
    res.json(out);
  } catch (e) {
    console.error('GET /client-inventory/simulate-consumption error:', e);
    res.status(500).json({ message: 'Erreur simulation', error: e.message });
  }
});

module.exports = router;
