// server.js
const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' }); // <- DOIT être la première ligne

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const orderRoutes = require('./routes/order');
const recommendationRoutes = require('./routes/recommendations');
const scrapingRoutes = require('./routes/scraping');
const clientInventoryRoutes = require('./routes/clientInventory');
const paymentRoutes = require('./routes/payment');

// Error handler (doit être APRES les routes)
const errorHandler = require('./middleware/errorHandler');



const app = express();

/* ------------------------ 1) CORE MIDDLEWARES ------------------------ */
app.use(cors());
app.use(express.json()); // <- une seule fois et AVANT les routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ------------------------ 2) ROUTES PUBLIQUES ------------------------ */
// Auth en premier (login/register)
app.use('/api/auth', authRoutes);

/* ------------------------ 3) ROUTES MÉTIER --------------------------- */
// Produits, commandes, recommandations
app.use('/api/products', productsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Scraping (expose /api/scrape/:productId et /api/simulate/:productId)
app.use('/api', scrapingRoutes);

// Inventaire client (GET /api/client-inventory, etc.)
app.use('/api/client-inventory', clientInventoryRoutes);
app.use('/api/payments', paymentRoutes);

/* ------------------------ 4) HEALTHCHECK ----------------------------- */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'dev' });
});

/* ------------------------ 5) ERROR HANDLER --------------------------- */
// ⚠️ Toujours APRES toutes les routes
app.use(errorHandler);

/* ------------------------ 6) MONGOOSE CONNECTION --------------------- */
async function start() {
  try {
    // Mongoose v6+ : pas besoin de useNewUrlParser/useUnifiedTopology
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

start();
