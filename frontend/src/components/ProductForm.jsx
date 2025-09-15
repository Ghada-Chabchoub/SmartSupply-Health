import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import '../style/ProductForm.css';

export default function ProductForm({ product, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    usageInstructions: '',
    brandInfo: '',
    targetAudience: '',
    technicalSpecs: [{ specName: '', specValue: '' }],
    faqs: [{ question: '', answer: '' }]
  });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  const resetForm = useCallback(() => {
    const initialState = {
      name: '', description: '', price: '', stock: '', category: '',
      usageInstructions: '', brandInfo: '', targetAudience: '',
      technicalSpecs: [{ specName: '', specValue: '' }],
      faqs: [{ question: '', answer: '' }]
    };

    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        category: product.category || '',
        usageInstructions: product.usageInstructions || '',
        brandInfo: product.brandInfo || '',
        targetAudience: product.targetAudience || '',
        technicalSpecs: product.technicalSpecs?.length ? product.technicalSpecs : [{ specName: '', specValue: '' }],
        faqs: product.faqs?.length ? product.faqs : [{ question: '', answer: '' }]
      });
    } else {
      setForm(initialState);
    }
    setFormErrors({});
    setTouched({});
    setSelectedFiles([]);
  }, [product]);

  useEffect(() => {
    resetForm();
  }, [product, resetForm]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products/categories', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setCategories(res.data);
      } catch (err) { console.error(err); }
    };
    fetchCategories();
  }, []);

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Le nom du produit est requis.';
        if (!/[a-zA-Z]/.test(value)) return 'Le nom doit contenir des lettres.';
        break;
      case 'description':
        if (value && !/[a-zA-Z]/.test(value)) return 'La description doit contenir des lettres.';
        if (value && value.length > 1000) return 'La description ne peut pas dépasser 1000 caractères.';
        break;
      case 'price':
        if (String(value).trim() === '') return 'Le prix est requis.';
        if (isNaN(value) || Number(value) < 0) return 'Le prix doit être un nombre positif.';
        break;
      case 'stock':
        if (String(value).trim() === '') return 'Le stock est requis.';
        if (isNaN(value) || !Number.isInteger(Number(value)) || Number(value) < 0) return 'Le stock doit être un entier positif.';
        break;
      case 'category':
        if (!value) return 'Veuillez sélectionner une catégorie.';
        break;
      // IA Fields Validation
      case 'usageInstructions':
        if (value && !/[a-zA-Z]/.test(value)) return 'Les instructions doivent contenir des lettres.';
        break;
      case 'brandInfo':
        if (value && !/[a-zA-Z]/.test(value)) return 'L\'info marque doit contenir des lettres.';
        break;
      case 'targetAudience':
        if (value && !/[a-zA-Z]/.test(value)) return 'L\'audience doit contenir des lettres.';
        break;
      default:
        break;
    }
    return null;
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setFormErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleDynamicChange = (e, index, section, field) => {
    const { value } = e.target;
    const updatedSection = [...form[section]];
    updatedSection[index][field] = value;
    setForm(prev => ({ ...prev, [section]: updatedSection }));

    let error = null;
    if (value && !/[a-zA-Z]/.test(value)) {
      error = 'Ce champ doit contenir des lettres.';
    }
    
    setFormErrors(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [`${index}-${field}`]: error
      }
    }));
  };
  
  const handleDynamicBlur = (e, index, section, field) => {
    setTouched(prev => ({ ...prev, [`${section}-${index}-${field}`]: true }));
    handleDynamicChange(e, index, section, field); // Re-run validation on blur
  };

  const addSpec = () => setForm(prev => ({ ...prev, technicalSpecs: [...prev.technicalSpecs, { specName: '', specValue: '' }] }));
  const removeSpec = (index) => setForm(prev => ({ ...prev, technicalSpecs: prev.technicalSpecs.filter((_, i) => i !== index) }));

  const addFaq = () => setForm(prev => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }));
  const removeFaq = (index) => setForm(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));

  const handleFileChange = e => setSelectedFiles([...e.target.files]);

  const handleAddCategory = async () => {
    if (!newCategory) return;
    try {
      await axios.post('http://localhost:5000/api/products/categories', { category: newCategory }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCategories(prev => [...prev, newCategory]);
      setNewCategory('');
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {};
    Object.keys(form).forEach(key => {
      if (key !== 'technicalSpecs' && key !== 'faqs') {
        const error = validateField(key, form[key]);
        if (error) errors[key] = error;
      }
    });
    // Manual validation for dynamic fields before submit
    form.technicalSpecs.forEach((spec, index) => {
      if (spec.specName && !/[a-zA-Z]/.test(spec.specName)) errors[`technicalSpecs-${index}-specName`] = 'La caractéristique doit contenir des lettres.';
      if (spec.specValue && !/[a-zA-Z0-9]/.test(spec.specValue)) errors[`technicalSpecs-${index}-specValue`] = 'La valeur doit contenir des lettres ou chiffres.';
    });
    form.faqs.forEach((faq, index) => {
      if (faq.question && !/[a-zA-Z]/.test(faq.question)) errors[`faqs-${index}-question`] = 'La question doit contenir des lettres.';
      if (faq.answer && !/[a-zA-Z]/.test(faq.answer)) errors[`faqs-${index}-answer`] = 'La réponse doit contenir des lettres.';
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setTouched(Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    const formData = new FormData();
    Object.keys(form).forEach(key => {
      formData.append(key, (key === 'technicalSpecs' || key === 'faqs') ? JSON.stringify(form[key]) : form[key]);
    });
    selectedFiles.forEach(file => formData.append('images', file));

    try {
      const headers = { 
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      };
      if (product) {
        await axios.put(`http://localhost:5000/api/products/${product._id}`, formData, { headers });
      } else {
        const res = await axios.post('http://localhost:5000/api/products', form, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
        if (selectedFiles.length > 0) {
          await axios.post(`http://localhost:5000/api/products/${res.data._id}/images`, formData, { headers });
        }
      }
      onSaved && onSaved();
    } catch (err) {
      console.error('Erreur enregistrement:', err.response?.data || err);
    }
  };

  return (
    <div className="product-form-container">
      <div className="form-header">
        <h3 className={`form-title ${product ? 'edit' : 'create'}`}>{product ? 'Éditer' : 'Créer'} produit</h3>
      </div>

      <form onSubmit={handleSubmit} className="product-form" noValidate>
        {/* --- Champs principaux --- */}
        <div className="form-field">
          <label className="field-label">Nom du produit *</label>
          <input required name="name" placeholder="Nom du produit" value={form.name} onChange={handleChange} onBlur={handleBlur} className={`field-input ${formErrors.name && touched.name ? 'is-invalid' : ''}`} />
          {formErrors.name && touched.name && <p className="error-text">{formErrors.name}</p>}
        </div>
        <div className="form-field">
          <label className="field-label">Description</label>
          <textarea name="description" placeholder="Description détaillée..." value={form.description} onChange={handleChange} onBlur={handleBlur} className={`field-textarea ${formErrors.description && touched.description ? 'is-invalid' : ''}`} />
          {formErrors.description && touched.description && <p className="error-text">{formErrors.description}</p>}
        </div>

        {/* --- Section IA --- */}
        <details className="ia-details-section">
          <summary>Détails pour l\'Assistant IA (Optionnel)</summary>
          <div className="form-field">
            <label className="field-label">Instructions d\'utilisation</label>
            <textarea name="usageInstructions" placeholder="Comment utiliser ce produit..." value={form.usageInstructions} onChange={handleChange} onBlur={handleBlur} className={`field-textarea ${formErrors.usageInstructions && touched.usageInstructions ? 'is-invalid' : ''}`} />
            {formErrors.usageInstructions && touched.usageInstructions && <p className="error-text">{formErrors.usageInstructions}</p>}
          </div>
          <div className="form-field">
            <label className="field-label">Informations sur la marque</label>
            <input name="brandInfo" placeholder="Histoire, avantages..." value={form.brandInfo} onChange={handleChange} onBlur={handleBlur} className={`field-input ${formErrors.brandInfo && touched.brandInfo ? 'is-invalid' : ''}`} />
            {formErrors.brandInfo && touched.brandInfo && <p className="error-text">{formErrors.brandInfo}</p>}
          </div>
          <div className="form-field">
            <label className="field-label">Audience Cible</label>
            <input name="targetAudience" placeholder="Ex: Cliniques dentaires..." value={form.targetAudience} onChange={handleChange} onBlur={handleBlur} className={`field-input ${formErrors.targetAudience && touched.targetAudience ? 'is-invalid' : ''}`} />
            {formErrors.targetAudience && touched.targetAudience && <p className="error-text">{formErrors.targetAudience}</p>}
          </div>
          
          {/* Spécifications Techniques */}
          <div className="dynamic-section">
            <h4 className="dynamic-section-title">Spécifications Techniques</h4>
            {form.technicalSpecs.map((spec, index) => (
              <div key={index} className="dynamic-item">
                <input placeholder="Caractéristique" value={spec.specName} onChange={e => handleDynamicChange(e, index, 'technicalSpecs', 'specName')} onBlur={e => handleDynamicBlur(e, index, 'technicalSpecs', 'specName')} className={`field-input ${formErrors.technicalSpecs?.[`${index}-specName`] && touched[`technicalSpecs-${index}-specName`] ? 'is-invalid' : ''}`} />
                <input placeholder="Valeur" value={spec.specValue} onChange={e => handleDynamicChange(e, index, 'technicalSpecs', 'specValue')} onBlur={e => handleDynamicBlur(e, index, 'technicalSpecs', 'specValue')} className={`field-input ${formErrors.technicalSpecs?.[`${index}-specValue`] && touched[`technicalSpecs-${index}-specValue`] ? 'is-invalid' : ''}`} />
                <button type="button" onClick={() => removeSpec(index)} className="remove-btn">✕</button>
                {formErrors.technicalSpecs?.[`${index}-specName`] && touched[`technicalSpecs-${index}-specName`] && <p className="error-text dynamic-error">{formErrors.technicalSpecs[`${index}-specName`]}</p>}
                {formErrors.technicalSpecs?.[`${index}-specValue`] && touched[`technicalSpecs-${index}-specValue`] && <p className="error-text dynamic-error">{formErrors.technicalSpecs[`${index}-specValue`]}</p>}
              </div>
            ))}
            <button type="button" onClick={addSpec} className="add-btn">Ajouter spécification</button>
          </div>

          {/* FAQs */}
          <div className="dynamic-section">
            <h4 className="dynamic-section-title">FAQ</h4>
            {form.faqs.map((faq, index) => (
              <div key={index} className="dynamic-item">
                <input placeholder="Question" value={faq.question} onChange={e => handleDynamicChange(e, index, 'faqs', 'question')} onBlur={e => handleDynamicBlur(e, index, 'faqs', 'question')} className={`field-input ${formErrors.faqs?.[`${index}-question`] && touched[`faqs-${index}-question`] ? 'is-invalid' : ''}`} />
                <textarea placeholder="Réponse" value={faq.answer} onChange={e => handleDynamicChange(e, index, 'faqs', 'answer')} onBlur={e => handleDynamicBlur(e, index, 'faqs', 'answer')} className={`field-textarea ${formErrors.faqs?.[`${index}-answer`] && touched[`faqs-${index}-answer`] ? 'is-invalid' : ''}`} />
                <button type="button" onClick={() => removeFaq(index)} className="remove-btn">✕</button>
                {formErrors.faqs?.[`${index}-question`] && touched[`faqs-${index}-question`] && <p className="error-text dynamic-error">{formErrors.faqs[`${index}-question`]}</p>}
                {formErrors.faqs?.[`${index}-answer`] && touched[`faqs-${index}-answer`] && <p className="error-text dynamic-error">{formErrors.faqs[`${index}-answer`]}</p>}
              </div>
            ))}
            <button type="button" onClick={addFaq} className="add-btn">Ajouter FAQ</button>
          </div>
        </details>

        {/* --- Prix, Stock, Catégorie --- */}
        <div className="form-field price-field">
          <label className="field-label">Prix (€) *</label>
          <input type="number" name="price" step="0.01" placeholder="0.00" value={form.price} onChange={handleChange} onBlur={handleBlur} className={`field-input price-input ${formErrors.price && touched.price ? 'is-invalid' : ''}`} />
          {formErrors.price && touched.price && <p className="error-text">{formErrors.price}</p>}
        </div>
        <div className="form-field">
          <label className="field-label">Stock initial *</label>
          <input type="number" name="stock" placeholder="0" value={form.stock} onChange={handleChange} onBlur={handleBlur} className={`field-input ${formErrors.stock && touched.stock ? 'is-invalid' : ''}`} />
          {formErrors.stock && touched.stock && <p className="error-text">{formErrors.stock}</p>}
        </div>
        <div className="form-field">
          <label className="field-label">Catégorie *</label>
          <select name="category" value={form.category} onChange={handleChange} onBlur={handleBlur} className={`field-select ${formErrors.category && touched.category ? 'is-invalid' : ''}`} required>
            <option value="">Sélectionner une catégorie</option>
            {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
          </select>
          {formErrors.category && touched.category && <p className="error-text">{formErrors.category}</p>}
        </div>

        {/* --- Autres champs --- */}
        <div className="form-field">
          <label className="field-label">Ajouter une nouvelle catégorie</label>
          <div className="category-input-container">
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nouvelle catégorie" className="field-input" />
            <button type="button" onClick={handleAddCategory} className="add-category-button">Ajouter</button>
          </div>
        </div>
        <div className="form-field">
          <label className="field-label">Images du produit</label>
          <div className="file-input-container">
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="file-input" />
            {selectedFiles.length > 0 && (<div className="file-count">{selectedFiles.length} fichier(s) sélectionné(s)</div>)}
          </div>
        </div>

        <button type="submit" className={`submit-button ${product ? 'edit' : 'create'}`}>{product ? 'Sauvegarder' : 'Créer'}</button>
      </form>
    </div>
  );
}