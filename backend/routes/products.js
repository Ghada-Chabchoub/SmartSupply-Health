const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const controller = require('../controllers/productController');
const upload = require('../middleware/upload'); // middleware multer configuré

// Public route - no auth required
router.get('/public', controller.getPublicProducts);


// toutes les routes nécessitent le rôle "supplier"
router.use(auth, authorize('supplier','client'));

// Création produit avec upload images 
router.post('/', upload.array('images'), controller.createProduct);

// Liste produits
router.get('/', controller.listProducts);
//liste des categories
router.get('/categories', controller.getCategories); 


// Détail produit
router.get('/:id', controller.getProduct);

// Mise à jour produit avec upload images 
router.put('/:id', upload.array('images'), controller.updateProduct);

// Ajuster le stock
router.patch('/:id/stock', controller.updateStock);

// Suppression soft
router.delete('/:id', controller.deleteProduct);
// get client catalog
router.get('/client-dashboard/catalog', controller.listProductsForClient);

router.post('/categories',  controller.addCategory); // New endpoint for adding category

module.exports = router;
