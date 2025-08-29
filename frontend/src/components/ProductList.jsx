import React, { useState, useEffect, useCallback } from 'react';
import StockAdjustModal from './StockAdjustModal';
import axios from 'axios';
import '../style/ProductList.css';
import CompetitorModal from './CompetitorModal';
import PriceSimulationModal from './PriceSimulationModal';

export default function ProductList({ onEdit, reload }) {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [offers, setOffers] = useState([]);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const res = await axios.get('http://localhost:5000/api/products/categories', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Fetched categories:', res.data); // Debug log
        setCategories(res.data);
      } catch (err) {
        console.error('Error fetching categories:', err.response?.data?.message || err.message);
        alert(`Erreur chargement catégories: ${err.response?.data?.message || 'Vérifiez votre connexion ou authentification'}`);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      console.log('Fetching products with params:', { q, category, page, limit: 10 }); // Debug log
      const res = await axios.get('http://localhost:5000/api/products', {
        params: { q, category: category || undefined, page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched products:', res.data); // Debug log
      setProducts(res.data.data || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error('Error fetching products:', err.response?.data?.message || err.message);
      alert(`Erreur chargement produits: ${err.response?.data?.message || 'Vérifiez votre connexion ou authentification'}`);
    }
  }, [q, category, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, reload]);

  const handleSearchChange = e => {
    setQ(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = e => {
    console.log('Selected category:', e.target.value); // Debug log
    setCategory(e.target.value);
    setPage(1);
  };

  const remove = async id => {
    if (!window.confirm('Supprimer le produit ?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err.response?.data?.message || err.message);
      alert(`Erreur suppression produit: ${err.response?.data?.message || 'Vérifiez votre connexion ou authentification'}`);
    }
  };
 const analyzeCompetitors = async (productId) => {
try {
const token = localStorage.getItem('token');
const res = await axios.post(`http://localhost:5000/api/scrape/${productId}`, {}, {
headers: { Authorization: `Bearer ${token}` }
});
setOffers(res.data.offers || []);
setShowCompetitorModal(true);
} catch (err) {
console.error('Erreur analyse concurrence:', err.message);
alert('Erreur lors de l’analyse concurrentielle.');
}
};


const simulatePrice = async (productId) => {
try {
const token = localStorage.getItem('token');
const res = await axios.get(`http://localhost:5000/api/simulate/${productId}`, {
headers: { Authorization: `Bearer ${token}` }
});
setSimulationData(res.data);
setShowSimulationModal(true);
} catch (err) {
console.error('Erreur simulation:', err.message);
alert('Erreur lors de la simulation du prix.');
}
};




  return (
    <div className="product-list-container">
      <div className="search-section">
        <input
          value={q}
          onChange={handleSearchChange}
          placeholder="Rechercher..."
          className="search-input"
        />
        <select
          value={category}
          onChange={handleCategoryChange}
          className="category-select"
        >
          <option value="">Toutes catégories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button onClick={() => fetchProducts()} className="search-button">
          Rechercher
        </button>
      </div>

      <div className="products-grid">
        {products.map(p => (
          <div key={p._id} className="product-card">
            <div className="product-image-container">
              {p.images && p.images.length > 0 ? (
                <img
                  src={`http://localhost:5000${p.images[0]}`}
                  alt={p.name}
                  className="product-image"
                />
              ) : (
                <div className="product-image-placeholder">
                  Aucune image
                </div>
              )}
            </div>

            <div className="product-content">
              <h3 className="product-title">{p.name}</h3>
              <p className="product-description">{p.description}</p>
              <p className="product-price">
                Prix : {p.price} dt
              </p>
              <p className="product-stock">
                Stock : {p.stock}
              </p>
              <p className="product-category">
                Catégorie : {p.category || 'Non spécifiée'}
              </p>
            </div>

            <div className="product-actions">
              <button
                onClick={() => onEdit(p)}
                className="action-button edit"
              >
                Éditer
              </button>
              <button
                onClick={() => setSelectedProduct(p)}
                className="action-button stock"
              >
                Stock
              </button>
              <button
                onClick={() => remove(p._id)}
                className="action-button delete"
              >
                Supprimer
              </button>
              <button onClick={() => analyzeCompetitors(p._id)} className="action-button info">🔍 Analyse</button>
              <button onClick={() => simulatePrice(p._id)} className="action-button info">📈 Simuler</button>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="pagination-button prev"
        >
          Précédent
        </button>
        <span className="pagination-info">
          Page {page} sur {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
          className="pagination-button next"
        >
          Suivant
        </button>
      </div>

      <StockAdjustModal
        product={selectedProduct}
        onClose={() => {
          setSelectedProduct(null);
          fetchProducts();
        }}
      />
      <CompetitorModal
      open={showCompetitorModal}
      onClose={() => setShowCompetitorModal(false)}
      offers={offers}
    />

    <PriceSimulationModal
      open={showSimulationModal}
      onClose={() => setShowSimulationModal(false)}
      data={simulationData}
    />
    </div>
  );
}
