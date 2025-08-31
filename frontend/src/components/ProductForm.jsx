import axios from 'axios';
import React, { useEffect, useState } from 'react';
import '../style/ProductForm.css';

export default function ProductForm({ product, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    // --- IA Fields ---
    usageInstructions: '',
    brandInfo: '',
    targetAudience: '',
    technicalSpecs: [{ specName: '', specValue: '' }],
    faqs: [{ question: '', answer: '' }]
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
        description: product.description || '',
        price: product.price || 0,
        stock: product.stock || 0,
        category: product.category || '',
        // --- IA Fields ---
        usageInstructions: product.usageInstructions || '',
        brandInfo: product.brandInfo || '',
        targetAudience: product.targetAudience || '',
        technicalSpecs: product.technicalSpecs?.length ? product.technicalSpecs : [{ specName: '', specValue: '' }],
        faqs: product.faqs?.length ? product.faqs : [{ question: '', answer: '' }]
      });
    } else {
      // Reset form for new product
      setForm({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: '',
        usageInstructions: '',
        brandInfo: '',
        targetAudience: '',
        technicalSpecs: [{ specName: '', specValue: '' }],
        faqs: [{ question: '', answer: '' }]
      });
    }
    setSelectedFiles([]);
  }, [product]);

  // --- Handlers for dynamic fields ---

  // Specs
  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...form.technicalSpecs];
    newSpecs[index][field] = value;
    setForm({ ...form, technicalSpecs: newSpecs });
  };

  const addSpec = () => {
    setForm({ ...form, technicalSpecs: [...form.technicalSpecs, { specName: '', specValue: '' }] });
  };

  const removeSpec = (index) => {
    const newSpecs = form.technicalSpecs.filter((_, i) => i !== index);
    setForm({ ...form, technicalSpecs: newSpecs });
  };

  // FAQs
  const handleFaqChange = (index, field, value) => {
    const newFaqs = [...form.faqs];
    newFaqs[index][field] = value;
    setForm({ ...form, faqs: newFaqs });
  };

  const addFaq = () => {
    setForm({ ...form, faqs: [...form.faqs, { question: '', answer: '' }] });
  };

  const removeFaq = (index) => {
    const newFaqs = form.faqs.filter((_, i) => i !== index);
    setForm({ ...form, faqs: newFaqs });
  };

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
    
    const formData = new FormData();
    
    // Append all form fields to formData
    Object.keys(form).forEach(key => {
      if (key === 'technicalSpecs' || key === 'faqs') {
        formData.append(key, JSON.stringify(form[key]));
      } else {
        formData.append(key, form[key]);
      }
    });

    // Append files
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const headers = { 
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      };

      if (product) {
        // Update product with images
        await axios.put(`http://localhost:5000/api/products/${product._id}`, formData, { headers });
      } else {
        // Create new product, then upload images
        const response = await axios.post('http://localhost:5000/api/products', form, { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const productId = response.data._id;
        if (selectedFiles.length > 0) {
          await axios.post(`http://localhost:5000/api/products/${productId}/images`, formData, { headers });
        }
      }

      alert(`Produit ${product ? 'mis à jour' : 'créé'} avec succès`);
      onSaved && onSaved();

    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du produit:', err.response?.data || err);
      alert('Erreur enregistrement: ' + (err.response?.data?.message || 'Vérifiez les champs'));
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
          <label className="field-label">Description</label>
          <textarea 
            placeholder="Description détaillée du produit..." 
            value={form.description} 
            onChange={e => setForm({ ...form, description: e.target.value })} 
            className="field-textarea"
          />
        </div>

        {/* --- Section IA --- */}
        <details className="ia-details-section">
          <summary>Détails pour l'Assistant IA (Optionnel)</summary>
          
          <div className="form-field">
            <label className="field-label">Instructions d'utilisation</label>
            <textarea 
              placeholder="Comment utiliser ce produit, précautions, etc." 
              value={form.usageInstructions} 
              onChange={e => setForm({ ...form, usageInstructions: e.target.value })} 
              className="field-textarea"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Informations sur la marque</label>
            <input 
              placeholder="Histoire, avantages ou réputation de la marque" 
              value={form.brandInfo} 
              onChange={e => setForm({ ...form, brandInfo: e.target.value })} 
              className="field-input"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Audience Cible</label>
            <input 
              placeholder="Ex: Cliniques dentaires, laboratoires, hôpitaux..." 
              value={form.targetAudience} 
              onChange={e => setForm({ ...form, targetAudience: e.target.value })} 
              className="field-input"
            />
          </div>

          {/* --- Spécifications Techniques --- */}
          <div className="dynamic-section">
            <h4 className="dynamic-section-title">Spécifications Techniques</h4>
            {form.technicalSpecs.map((spec, index) => (
              <div key={index} className="dynamic-item">
                <input 
                  placeholder="Caractéristique (ex: Matériau)" 
                  value={spec.specName} 
                  onChange={e => handleSpecChange(index, 'specName', e.target.value)} 
                  className="field-input"
                />
                <input 
                  placeholder="Valeur (ex: Acier inoxydable)" 
                  value={spec.specValue} 
                  onChange={e => handleSpecChange(index, 'specValue', e.target.value)} 
                  className="field-input"
                />
                <button type="button" onClick={() => removeSpec(index)} className="remove-btn">✕</button>
              </div>
            ))}
            <button type="button" onClick={addSpec} className="add-btn">Ajouter une spécification</button>
          </div>

          {/* --- FAQs --- */}
          <div className="dynamic-section">
            <h4 className="dynamic-section-title">FAQ</h4>
            {form.faqs.map((faq, index) => (
              <div key={index} className="dynamic-item">
                <input 
                  placeholder="Question" 
                  value={faq.question} 
                  onChange={e => handleFaqChange(index, 'question', e.target.value)} 
                  className="field-input"
                />
                <textarea 
                  placeholder="Réponse" 
                  value={faq.answer} 
                  onChange={e => handleFaqChange(index, 'answer', e.target.value)} 
                  className="field-textarea"
                />
                <button type="button" onClick={() => removeFaq(index)} className="remove-btn">✕</button>
              </div>
            ))}
            <button type="button" onClick={addFaq} className="add-btn">Ajouter une FAQ</button>
          </div>

        </details>
        {/* --- Fin Section IA --- */}

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