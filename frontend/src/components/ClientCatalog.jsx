import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import '../style/ProductList.css';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import ClientNavbar from './dashboard/ClientNavbar';

export default function ClientCatalog({ reload }) {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  // Récupérer le clientId
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const res = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Le clientId se trouve dans res.data.data.user._id
        const possibleClientId = res.data.data?.user?._id;
        
        if (possibleClientId) {
          setClientId(possibleClientId);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du clientId:', err.response?.data?.message || err.message);
      }
    };
    fetchClientId();
  }, []);

  // Récupérer les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const res = await axios.get('http://localhost:5000/api/products/categories', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(res.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des catégories:', err.response?.data?.message || err.message);
        alert(`Erreur chargement catégories: ${err.response?.data?.message || 'Vérifiez votre connexion'}`);
      }
    };
    fetchCategories();
  }, []);

  // Récupérer les produits
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const res = await axios.get('http://localhost:5000/api/products/client-dashboard/catalog', {
        params: { q, category: category || undefined, page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.data || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error('Erreur lors de la récupération des produits:', err.response?.data?.message || err.message);
      alert(`Erreur chargement produits: ${err.response?.data?.message || 'Vérifiez votre connexion'}`);
    } finally {
      setLoading(false);
    }
  }, [q, category, page]);

  // Récupérer les recommandations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!clientId) return;
      
      try {
        setRecommendationsLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/recommendations/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (Array.isArray(res.data)) {
          setRecommendations(res.data);
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des recommandations:', err.response?.data?.message || err.message);
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [clientId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, reload]);

  const handleSearchChange = e => {
    setQ(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = e => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleOrder = (product) => {
    addToCart(product);
    navigate('/client-dashboard/new-order');
  };

  return (
    <div className="product-list-container">
      <ClientNavbar />

      <div className="search-section">
        <input
          value={q}
          onChange={handleSearchChange}
          placeholder="Rechercher un produit..."
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

      {/* Section des recommandations - Carrousel */}
      {recommendationsLoading && (
        <div className="recommendations-carousel-section">
          <h2>🔄 Chargement des recommandations...</h2>
        </div>
      )}
      
      {!recommendationsLoading && recommendations.length > 0 && (
        <div className="recommendations-carousel-section">
          <div className="recommendations-header">
            <h2>✨ Nos recommandations pour vous</h2>
            <p>Produits sélectionnés spécialement selon vos préférences</p>
          </div>
          
          <div className="recommendations-carousel">
            <div className="carousel-container">
              <div className="carousel-track">
                {recommendations.map((p, index) => (
                  <div key={p._id} className="recommendation-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="rec-card-badge">
                      <span>Recommandé</span>
                    </div>
                    
                    <div className="rec-image-container">
                      {p.images?.length > 0 ? (
                        <img
                          src={`http://localhost:5000${p.images[0]}`}
                          alt={p.name}
                          className="rec-image"
                        />
                      ) : (
                        <div className="rec-image-placeholder">
                          <span>📦</span>
                        </div>
                      )}
                      <div className="rec-overlay">
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="quick-view-btn"
                        >
                          👁️ Aperçu rapide
                        </button>
                      </div>
                    </div>
                    
                    <div className="rec-content">
                      <div className="rec-category-tag">
                        {p.category || 'Produit'}
                      </div>
                      <h3 className="rec-title">{p.name}</h3>
                      <p className="rec-description">
                        {p.description?.length > 60 
                          ? p.description.substring(0, 60) + '...' 
                          : p.description}
                      </p>
                      
                      <div className="rec-info">
                        <div className="rec-price-container">
                          <span className="rec-price">{p.price} €</span>
                          <span className="rec-stock">Stock: {p.stock}</span>
                        </div>
                      </div>
                      
                      <div className="rec-actions">
                        <button
                          onClick={() => handleOrder(p)}
                          className={`rec-add-btn ${p.stock <= 0 ? 'disabled' : ''}`}
                          disabled={p.stock <= 0}
                        >
                          {p.stock <= 0 ? '❌ Rupture' : '🛒 Ajouter'}
                        </button>
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="rec-details-btn"
                        >
                          ℹ️ Détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="carousel-indicators">
              {recommendations.map((_, index) => (
                <div key={index} className="indicator"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Liste des produits */}
      <div className="products-grid">
        {loading ? (
          <div>Chargement des produits...</div>
        ) : (
          products.map(p => (
            <div key={p._id} className="product-card">
              <div className="product-image-container">
                {p.images?.length > 0 ? (
                  <img
                    src={`http://localhost:5000${p.images[0]}`}
                    alt={p.name}
                    className="product-image"
                  />
                ) : (
                  <div className="product-image-placeholder">Aucune image</div>
                )}
              </div>
              
              <div className="product-content">
                <h3 className="product-title">{p.name}</h3>
                <p className="product-description">{p.description}</p>
                <p className="product-price">Prix : {p.price} €</p>
                <p className="product-stock">Stock : {p.stock}</p>
                <p className="product-category">
                  Catégorie : {p.category || 'Non spécifiée'}
                </p>
              </div>
              <div className="product-actions">
                <button
                  onClick={() => handleOrder(p)}
                  className={`action-button blue ${p.stock <= 0 ? 'out-of-stock' : ''}`}
                  disabled={p.stock <= 0}
                  title={p.stock <= 0 ? "Rupture de stock" : "Commander"}
                >
                  {p.stock > 0 ? 'Ajouter au panier' : 'En rupture'}
                </button>
                <button
                  onClick={() => setSelectedProduct(p)}
                  className="action-button green"
                >
                  Voir détails
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pagination">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="pagination-button prev"
        >
          Précédent
        </button>
        <span className="pagination-info">Page {page} sur {pages}</span>
        <button
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
          className="pagination-button next"
        >
          Suivant
        </button>
      </div>

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedProduct.name}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {selectedProduct.images?.length > 0 && (
                <img
                  src={`http://localhost:5000${selectedProduct.images[0]}`}
                  alt={selectedProduct.name}
                  className="modal-image"
                />
              )}
              <p className="modal-description"><strong>Description :</strong> {selectedProduct.description}</p>
              <div className="modal-details">
                <p><strong>Prix :</strong> {selectedProduct.price} €</p>
                <p><strong>Stock :</strong> {selectedProduct.stock}</p>
                <p><strong>Catégorie :</strong> {selectedProduct.category || 'Non spécifiée'}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setSelectedProduct(null)}
                className="modal-button cancel"
              >
                Fermer
              </button>
              <button
                onClick={() => handleOrder(selectedProduct)}
                className={`action-button blue ${selectedProduct.stock <= 0 ? 'out-of-stock' : ''}`}
                disabled={selectedProduct.stock <= 0}
                title={selectedProduct.stock <= 0 ? "Rupture de stock" : "Commander"}
              >
                {selectedProduct.stock > 0 ? 'Ajouter au panier' : 'En rupture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}