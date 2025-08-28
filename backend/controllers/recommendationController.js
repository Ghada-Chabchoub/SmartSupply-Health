// controllers/recommendationController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const natural = require('natural');
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

function preprocessText(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
}

async function buildTfidfMatrix() {
  try {
    const products = await Product.find({ active: true }).lean();
    tfidf.documents = [];
    products.forEach((product, index) => {
      const text = `${product.category || ''} ${preprocessText(product.description || '')}`;
      tfidf.addDocument(text, index);
    });
    return products;
  } catch (error) {
    console.error('Erreur lors de la construction de la matrice TF-IDF :', error);
    throw error;
  }
}

async function getRecommendations(clientId, limit = 5) {
  try {
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      throw new Error('Invalid client ID');
    }
    const orders = await Order.find({ client: clientId }).populate('items.product').lean();
    const purchasedProductIds = new Set(
      orders.flatMap(order => order.items.map(item => item.product._id.toString()))
    );
    const products = await buildTfidfMatrix();
    const recommendations = new Map();
    for (const order of orders) {
      for (const item of order.items) {
        const productIndex = products.findIndex(p => p._id.toString() === item.product._id.toString());
        if (productIndex === -1) continue;
        tfidf.listTerms(productIndex).forEach(term => {
          tfidf.tfidfs(term.term, (i, measure) => {
            if (i !== productIndex && measure > 0) {
              const similarProduct = products[i];
              if (!purchasedProductIds.has(similarProduct._id.toString())) {
                recommendations.set(similarProduct._id.toString(), {
                  product: similarProduct,
                  score: (recommendations.get(similarProduct._id.toString())?.score || 0) + measure
                });
              }
            }
          });
        });
      }
    }
    return [...recommendations.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);
  } catch (error) {
    console.error('Erreur lors de la génération des recommandations :', error);
    throw error;
  }
}

exports.getRecommendationsForClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }
    const recommendations = await getRecommendations(clientId);
    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des recommandations', error: error.message });
  }
};