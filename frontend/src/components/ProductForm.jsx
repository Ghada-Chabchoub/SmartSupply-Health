import axios from 'axios';
import React, { useEffect, useState } from 'react';
import '../style/ProductForm.css';

export default function ProductForm({ product, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    reference: '',
    description: '',
    price: 0,
    stock: 0,
    category: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products/categories', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setCategories(res.data);
      } catch (err) {
        console.error(err);
        alert('Erreur chargement catégories');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        reference: product.reference || '',
        description: product.description || '',
        price: product.price || 0,
        stock: product.stock || 0,
        category: product.category || ''
      });
      setSelectedFiles([]);
    } else {
      setForm({ name: '', reference: '', description: '', price: 0, stock: 0, category: '' });
      setSelectedFiles([]);
    }
  }, [product]);

  const handleFileChange = e => {
    setSelectedFiles([...e.target.files]);
  };

  const handleAddCategory = async () => {
    if (!newCategory) {
      alert('Veuillez entrer une catégorie');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/products/categories', { category: newCategory }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCategories([...categories, newCategory]);
      setNewCategory('');
      alert('Catégorie ajoutée');
    } catch (err) {
      console.error(err);
      alert('Erreur ajout catégorie');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('reference', form.reference);
      data.append('description', form.description);
      data.append('price', form.price);
      data.append('stock', form.stock);
      data.append('category', form.category);

      selectedFiles.forEach(file => {
        data.append('images', file);
      });

      if (product) {
        await axios.put(`http://localhost:5000/api/products/${product._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Produit mis à jour');
      } else {
        await axios.post('http://localhost:5000/api/products', data, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Produit créé');
        setForm({ name: '', reference: '', description: '', price: 0, stock: 0, category: '' });
        setSelectedFiles([]);
      }
      onSaved && onSaved();
    } catch (err) {
      console.error(err);
      alert('Erreur enregistrement');
    }
  };

  return (
    <div className="product-form-container">
      <div className="form-header">
        <h3 className={`form-title ${product ? 'edit' : 'create'}`}>
          {product ? 'Éditer produit' : 'Créer produit'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-field">
          <label className="field-label">Nom du produit *</label>
          <input 
            required 
            placeholder="Nom du produit" 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            className="field-input"
          />
        </div>

        <div className="form-field">
          <label className="field-label">Référence</label>
          <input 
            placeholder="REF-001" 
            value={form.reference} 
            onChange={e => setForm({ ...form, reference: e.target.value })} 
            className="field-input reference"
          />
        </div>

        <div className="form-field">
          <label className="field-label">Description</label>
          <textarea 
            placeholder="Description détaillée du produit..." 
            value={form.description} 
            onChange={e => setForm({ ...form, description: e.target.value })} 
            className="field-textarea"
          />
        </div>

        <div className="form-field price-field">
          <label className="field-label">Prix (€)</label>
          <input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={form.price} 
            onChange={e => setForm({ ...form, price: Number(e.target.value) })} 
            className="field-input price-input"
          />
        </div>

        <div className="form-field">
          <label className="field-label">Stock initial</label>
          <input 
            type="number" 
            placeholder="0" 
            value={form.stock} 
            onChange={e => setForm({ ...form, stock: Number(e.target.value) })} 
            className="field-input"
          />
        </div>

        <div className="form-field">
          <label className="field-label">Catégorie</label>
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="field-select"
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="field-label">Ajouter une nouvelle catégorie</label>
          <div className="category-input-container">
            <input
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Nouvelle catégorie"
              className="field-input"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="add-category-button"
            >
              Ajouter
            </button>
          </div>
        </div>

        <div className="form-field">
          <label className="field-label">Images du produit</label>
          <div className="file-input-container">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange} 
              className="file-input"
            />
            {selectedFiles.length > 0 && (
              <div className="file-count">
                {selectedFiles.length} fichier(s) sélectionné(s)
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          className={`submit-button ${product ? 'edit' : 'create'}`}
        >
          {product ? 'Sauvegarder' : 'Créer'}
        </button>
      </form>
    </div>
  );
}