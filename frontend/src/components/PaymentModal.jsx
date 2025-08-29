import React, { useState } from 'react';
import './../style/PaymentModal.css';

const PaymentModal = ({ order, onPay, onCancel }) => {
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails({ ...cardDetails, [name]: value });
  };

  const validateCardDetails = () => {
    if (!/^\d{16}$/.test(cardDetails.cardNumber.replace(/\s/g, ''))) {
      return 'Numéro de carte invalide (16 chiffres).';
    }
    if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
      return 'Date d\'expiration invalide (MM/AA).';
    }
    if (!/^\d{3}$/.test(cardDetails.cvv)) {
      return 'CVV invalide (3 chiffres).';
    }
    return '';
  };

  const handlePayment = async () => {
    const validationError = validateCardDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Simulate API call to payment gateway
      await new Promise(resolve => setTimeout(resolve, 1500));
      onPay(order._id, { ...cardDetails, method: 'card' });
    } catch (err) {
      setError('Le paiement a échoué. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h3>Paiement de la Commande</h3>
          <p>Montant Total : <strong>{order.totalAmount.toFixed(2)} €</strong></p>
        </div>
        <div className="payment-modal-body">
          {error && <div className="payment-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="cardNumber">Numéro de Carte</label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              placeholder="0000 0000 0000 0000"
              value={cardDetails.cardNumber}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiryDate">Date d'Expiration</label>
              <input
                type="text"
                id="expiryDate"
                name="expiryDate"
                placeholder="MM/AA"
                value={cardDetails.expiryDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cvv">CVV</label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
        <div className="payment-modal-footer">
          <button className="cancel-btn" onClick={onCancel} disabled={loading}>
            Annuler
          </button>
          <button className="pay-btn" onClick={handlePayment} disabled={loading}>
            {loading ? 'Paiement en cours...' : `Payer ${order.totalAmount.toFixed(2)} €`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
