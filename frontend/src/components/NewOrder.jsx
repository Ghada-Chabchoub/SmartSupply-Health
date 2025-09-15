import React, { useState, useMemo, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../style/NewOrder.css';
import ClientNavbar from './dashboard/ClientNavbar';
import PaymentModal from './PaymentModal';
import Notification from './common/Notification';
import { CartContext } from '../contexts/CartContext'; // 1. Importer le contexte

export default function NewOrder() {
  // 2. Utiliser le contexte pour le panier
  const { cart, updateCartQuantity, removeFromCart, clearCart } = useContext(CartContext);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isCheckoutVisible, setCheckoutVisible] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
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
    const fetchClientAddress = async () => {
      try {
        const response = await axiosAuth.get('/api/auth/me');
        const user = response.data.data.user;
        if (user && user.address) {
          setDeliveryAddress(user.address);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'adresse du client:", error);
      }
    };

    fetchClientAddress();
  }, [axiosAuth]);

  // 3. Le calcul du total utilise maintenant le panier du contexte
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleConfirmOrder = async () => {
    if (!deliveryAddress.trim()) {
      setNotification({ message: 'Veuillez remplir le champ de l\'adresse.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        products: cart.map(item => ({
          product: item.productId, // Utiliser productId du contexte
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: {
          street: deliveryAddress,
          city: 'N/A',
          postalCode: 'N/A',
          country: 'N/A',
        },
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

  const handlePaymentSuccess = () => {
    // The PaymentModal now handles the entire payment process.
    // This function is called only after the payment is successful.
    setLoading(true);
    setOrderToPay(null);
    clearCart(); // Clear the cart from context
    setNotification({ message: 'Order and payment successful!', type: 'success' });
    setTimeout(() => navigate('/client-dashboard/orders'), 1500);
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
        <h1>Mon Panier</h1>
        <p>Vérifiez les articles de votre panier avant de finaliser la commande.</p>
      </header>

      {/* 4. La section catalogue est supprimée. On affiche directement le panier. */}
      <div className="order-content-cart-only">
        <div className="cart-section">
          <div className="cart-header">
            <h2>Votre Commande</h2>
          </div>
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Votre panier est vide.</p>
              <p>Ajoutez des produits depuis le <a href="/client-dashboard/catalog">catalogue</a> pour commencer.</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p>{item.price.toFixed(2)} €</p>
                    </div>
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button className="qty-btn" onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}>-</button>
                        <span className="quantity">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateCartQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.maxStock}>+</button>
                      </div>
                      <span className="item-total">
                        {(item.price * item.quantity).toFixed(2)} €
                      </span>
                      <button className="remove-btn" onClick={() => removeFromCart(item.productId)}>×</button>
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
                <input 
                  type="text" 
                  placeholder="Adresse complète" 
                  value={deliveryAddress} 
                  onChange={e => setDeliveryAddress(e.target.value)} 
                />
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
