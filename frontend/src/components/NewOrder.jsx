import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../style/NewOrder.css';
import ClientNavbar from './dashboard/ClientNavbar';
import PaymentModal from './PaymentModal';
import Notification from './common/Notification';

export default function NewOrder() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCheckoutVisible, setCheckoutVisible] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [orderToPay, setOrderToPay] = useState(null);
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem('token'), []);
  const axiosAuth = useMemo(() => {
    return axios.create({
      baseURL: 'http://localhost:5000',
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axiosAuth.get('/api/products/public');
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setNotification({ message: 'Erreur lors du chargement des produits.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [axiosAuth]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product._id === product._id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.product._id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product._id !== productId));
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === '' || p.category === selectedCategory)
    );
  }, [products, searchTerm, selectedCategory]);

  const handleConfirmOrder = async () => {
    if (Object.values(deliveryAddress).some(field => !field.trim())) {
      setNotification({ message: 'Veuillez remplir tous les champs de l\'adresse.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        products: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        deliveryAddress,
        notes: orderNotes,
        totalAmount,
      };
      const { data: newOrder } = await axiosAuth.post('/api/orders', orderData);
      setOrderToPay(newOrder);
      setCheckoutVisible(false);
    } catch (e) {
      console.error(e);
      setNotification({ message: 'Erreur lors de la création de la commande.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (orderId, paymentDetails) => {
    try {
      setLoading(true);
      await axiosAuth.post(`/api/payments/pay/${orderId}`, { paymentDetails });
      setOrderToPay(null);
      setCart([]);
      setNotification({ message: 'Commande et paiement réussis !', type: 'success' });
      setTimeout(() => navigate('/client-dashboard/orders'), 1500);
    } catch (e) {
      console.error(e);
      setNotification({ message: 'Erreur lors du traitement du paiement.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setOrderToPay(null);
    setNotification({ message: 'Paiement annulé. Votre commande est en attente de paiement.', type: 'info' });
    setTimeout(() => navigate('/client-dashboard/orders'), 1500);
  };

  return (
    <div className="new-order-container">
      <ClientNavbar />
      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: '', type: '' })} 
      />
      <header className="new-order-header">
        <h1>Passer une Nouvelle Commande</h1>
        <p>Parcourez notre catalogue et ajoutez des produits à votre panier.</p>
      </header>

      <div className="order-content">
        <div className="products-section">
          <div className="products-header">
            <h2>Catalogue de Produits</h2>
            <div className="filters">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {[...new Set(products.map(p => p.category))].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="products-grid">
            {loading ? (
              <p>Chargement...</p>
            ) : (
              filteredProducts.map((p) => (
                <div key={p._id} className="product-card">
                  <img src={`http://localhost:5000/${p.image}`} alt={p.name} className="product-image" />
                  <div className="product-info">
                    <h3 className="product-name">{p.name}</h3>
                    <p className="product-description">{p.description}</p>
                    <div className="product-details">
                      <span className="product-price">{p.price.toFixed(2)} €</span>
                      <span className={`product-stock ${p.stock < 10 ? 'low-stock' : ''}`}>
                        Stock: {p.stock}
                      </span>
                    </div>
                    <button
                      className="add-to-cart-btn"
                      onClick={() => addToCart(p)}
                      disabled={p.stock === 0}
                    >
                      {p.stock > 0 ? 'Ajouter au Panier' : 'En rupture'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="cart-section">
          <div className="cart-header">
            <h2>Votre Panier</h2>
          </div>
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Votre panier est vide.</p>
              <p>Ajoutez des produits depuis le catalogue pour commencer.</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.product._id} className="cart-item">
                    <div className="item-info">
                      <h4>{item.product.name}</h4>
                      <p>{item.product.price.toFixed(2)} €</p>
                    </div>
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button className="qty-btn" onClick={() => updateQuantity(item.product._id, -1)}>-</button>
                        <span className="quantity">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.product._id, 1)} disabled={item.quantity >= item.product.stock}>+</button>
                      </div>
                      <span className="item-total">
                        {(item.product.price * item.quantity).toFixed(2)} €
                      </span>
                      <button className="remove-btn" onClick={() => removeFromCart(item.product._id)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-summary">
                <div className="total-amount">
                  Total: {totalAmount.toFixed(2)} €
                </div>
                <button className="checkout-btn" onClick={() => setCheckoutVisible(true)} disabled={cart.length === 0}>
                  Valider la Commande
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isCheckoutVisible && (
        <div className="checkout-modal">
          <div className="checkout-content">
            <div className="checkout-header">
              <h2>Finaliser la Commande</h2>
              <button className="close-btn" onClick={() => setCheckoutVisible(false)}>×</button>
            </div>
            <div className="delivery-section">
              <h3>Adresse de Livraison</h3>
              <form className="address-form">
                <input type="text" placeholder="Rue et numéro" value={deliveryAddress.street} onChange={e => setDeliveryAddress(s => ({ ...s, street: e.target.value }))} />
                <div className="address-row">
                  <input type="text" placeholder="Ville" value={deliveryAddress.city} onChange={e => setDeliveryAddress(s => ({ ...s, city: e.target.value }))} />
                  <input type="text" placeholder="Code Postal" value={deliveryAddress.postalCode} onChange={e => setDeliveryAddress(s => ({ ...s, postalCode: e.target.value }))} />
                </div>
                <input type="text" placeholder="Pays" value={deliveryAddress.country} onChange={e => setDeliveryAddress(s => ({ ...s, country: e.target.value }))} />
              </form>
            </div>
            <div className="notes-section">
              <h3>Notes de Commande (optionnel)</h3>
              <textarea
                placeholder="Instructions spéciales pour la livraison..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              ></textarea>
            </div>
            <div className="checkout-summary">
              <div className="checkout-total">
                <span className="checkout-total-label">Total à Payer</span>
                <span className="checkout-total-amount">{totalAmount.toFixed(2)} €</span>
              </div>
              <div className="checkout-actions">
                <button className="cancel-btn" onClick={() => setCheckoutVisible(false)}>Annuler</button>
                <button className="confirm-order-btn" onClick={handleConfirmOrder} disabled={loading}>
                  {loading ? 'Confirmation...' : 'Confirmer et Payer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {orderToPay && (
        <PaymentModal
          order={orderToPay}
          onPay={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}
