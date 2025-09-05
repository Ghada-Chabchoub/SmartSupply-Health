import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';
import ClientNavbar from './dashboard/ClientNavbar';
import '../style/ProductForm.css'; // Re-using some styles for consistency

// --- AddCardForm Sub-component ---
const AddCardForm = ({ clientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    onError('');

    if (!stripe || !elements) {
      onError('Stripe is not ready. Please wait a moment.');
      setIsProcessing(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    const { error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
            card: cardElement,
        },
    });

    if (error) {
      onError(error.message);
    } else {
      onSuccess();
    }
    setIsProcessing(false);
  };
  
  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: "16px",
      },
      invalid: { color: "#fa755a" },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <CardElement options={CARD_ELEMENT_OPTIONS} />
      <button type="submit" disabled={!stripe || isProcessing} className="auth-button" style={{marginTop: '20px'}}>
        {isProcessing ? 'Saving...' : 'Save Card'}
      </button>
    </form>
  );
};

// --- Main Component ---
const ManagePaymentMethods = () => {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [savedCards, setSavedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  const setup = useCallback(async () => {
    setLoading(true);
    try {
      const cardsRes = await api.get('/payments/payment-methods');
      setSavedCards(cardsRes.data);

      const intentRes = await api.post('/payments/create-setup-intent');
      setClientSecret(intentRes.data.clientSecret);
      if (!stripePromise) {
        setStripePromise(loadStripe(intentRes.data.publishableKey));
      }
    } catch (err) {
      setError('Failed to load payment details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [stripePromise]);

  useEffect(() => {
    setup();
  }, [setup]);

  const refreshCards = async () => {
    try {
        const cardsRes = await api.get('/payments/payment-methods');
        setSavedCards(cardsRes.data);
    } catch (err) {
        console.error("Could not refresh cards list", err);
    }
  }

  return (
    <div className="product-form-container">
      <ClientNavbar />
      <div className="product-form-card">
        <h2 className="product-form-title">Manage Payment Methods</h2>
        
        {error && <div className="auth-error">{error}</div>}
        {notification && <div className="auth-success">{notification}</div>}

        <div className="saved-cards-section">
          <h3>Your Saved Cards</h3>
          {loading && <p>Loading cards...</p>}
          {!loading && savedCards.length === 0 && (
            <p>You have no saved payment methods.</p>
          )}
          {!loading && savedCards.length > 0 && (
            <ul className="saved-cards-list">
              {savedCards.map(card => (
                <li key={card.id} className="saved-card-item">
                  <span>{card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} ending in {card.last4}</span>
                  <span>Expires {card.exp_month}/{card.exp_year}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <hr className="form-divider" />

        <div className="add-card-section">
          <h3>Add a New Card</h3>
          <p>Your card will be securely saved for future automatic payments.</p>
          {clientSecret && stripePromise ? (
            <Elements stripe={stripePromise}>
              <AddCardForm 
                clientSecret={clientSecret}
                onSuccess={() => {
                  setNotification('Card saved successfully!');
                  refreshCards();
                }} 
                onError={setError}
              />
            </Elements>
          ) : (
            <p>Loading payment form...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePaymentMethods;