const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
 supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  name: { type: String, required: true },
  reference: { type: String, index: true }, 
  category: { type: String },
  description: { type: String },
  price: { type: Number, required: true, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  images: [{ type: String }],
  active: { type: Boolean, default: true }, // ✅ added for soft delete
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Mettre à jour updatedAt
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
