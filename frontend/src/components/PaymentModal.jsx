import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';
import './../style/PaymentModal.css';

// 1. CheckoutForm Component - The actual payment form
const CheckoutForm = ({ order, onPaySuccess, onCancel, setErrorMessage }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (!stripe || !elements) {
      setErrorMessage('Stripe has not loaded yet. Please wait a moment.');
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      // Get client secret from your backend
      const res = await api.post(`/payments/create-payment-intent/${order._id}`);
      const { clientSecret } = res.data;

      // Confirm the card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // You can collect and add more details here if needed
            name: 'Customer Name', 
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
      } else if (paymentIntent.status === 'succeeded') {
        // Payment succeeded, now update the order status on your backend
        await api.post(`/payments/update-order-payment-status/${order._id}`, {
          paymentIntentId: paymentIntent.id,
        });
        onPaySuccess(); // Notify parent component of success
      }
    } catch (err) {
      console.error('Payment error:', err);
      const message = err.response?.data?.message || 'An unexpected error occurred.';
      setErrorMessage(message);
      setLoading(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="payment-modal-body">
        <label htmlFor="card-element">Card Details</label>
        <CardElement id="card-element" options={CARD_ELEMENT_OPTIONS} />
      </div>
      <div className="payment-modal-footer">
        <button type="button" className="cancel-btn" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="pay-btn" disabled={!stripe || loading}>
          {loading ? 'Processing...' : `Pay ${order.totalAmount.toFixed(2)} €`}
        </button>
      </div>
    </form>
  );
};

// 2. StripePaymentModal Wrapper Component - Loads Stripe and handles state
const StripePaymentModal = ({ order, onPay, onCancel }) => {
  const [stripePromise, setStripePromise] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchPublishableKey = async () => {
      try {
        // We need a temporary API call to get the publishable key.
        // NOTE: In a real app, you might fetch this once when the app loads.
        // We create a payment intent just to get the key, but we don't use the clientSecret here.
        const res = await api.post(`/payments/create-payment-intent/${order._id}`);
        const { publishableKey } = res.data;
        setStripePromise(loadStripe(publishableKey));
      } catch (error) {
        console.error("Failed to fetch Stripe publishable key:", error);
        setErrorMessage("Failed to connect to the payment service.");
      }
    };
    fetchPublishableKey();
  }, [order._id]);

  const handlePaySuccess = () => {
    // This function is called from the CheckoutForm on successful payment
    // It then calls the original onPay prop passed to StripePaymentModal
    onPay(order._id); 
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h3>Pay for Order</h3>
          <p>Total Amount: <strong>{order.totalAmount.toFixed(2)} €</strong></p>
        </div>
        {errorMessage && <div className="payment-error">{errorMessage}</div>}
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              order={order} 
              onPaySuccess={handlePaySuccess} 
              onCancel={onCancel}
              setErrorMessage={setErrorMessage}
            />
          </Elements>
        ) : (
          <div className="payment-modal-body">
            <p>Loading Payment Gateway...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StripePaymentModal;