// backend/config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connectée avec succès.');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err.message);
    // Quitter le processus en cas d'échec de la connexion
    process.exit(1);
  }
};

module.exports = connectDB;
