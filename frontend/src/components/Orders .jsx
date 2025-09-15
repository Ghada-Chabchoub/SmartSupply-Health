// src/components/Orders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; // Use the centralized api instance
import '../style/Orders.css';
import ClientNavbar from './dashboard/ClientNavbar';
import PaymentModal from './PaymentModal'; // Import the payment modal

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [orderToPay, setOrderToPay] = useState(null); // State for the order to be paid

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            // Use the new secure endpoint for fetching client-specific orders
            const url = filter === 'all'
                ? '/orders/my-orders'
                : `/orders/my-orders?status=${filter}`;

            const response = await api.get(url);

            if (response.data.success) {
                setOrders(response.data.data);
            } else {
                setError(response.data.message || 'Error loading orders');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Could not connect to the server';
            setError(errorMessage);
            console.error('Fetch orders error:', err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const cancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) {
            return;
        }
        try {
            await api.delete(`/orders/${orderId}`);
            fetchOrders(); // Refresh the list
            alert('Order cancelled successfully');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error during cancellation';
            alert(errorMessage);
            console.error('Cancel order error:', err);
        }
    };

    // --- PAYMENT HANDLERS ---
    const handlePayClick = (order) => {
        setOrderToPay(order);
    };

    const handlePaymentSuccess = () => {
        setOrderToPay(null);
        alert('Payment successful!');
        fetchOrders(); // Refresh the list to show the updated status
    };

    const handlePaymentCancel = () => {
        setOrderToPay(null);
    };
    // --- END OF PAYMENT HANDLERS ---

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'En attente', class: 'status-pending' },
            confirmed: { label: 'Confirmée', class: 'status-confirmed' },
            processing: { label: 'En traitement', class: 'status-processing' },
            shipped: { label: 'Expédiée', class: 'status-shipped' },
            delivered: { label: 'Livrée', class: 'status-delivered' },
            cancelled: { label: 'Annulée', class: 'status-cancelled' }
        };
        const config = statusConfig[status] || { label: status, class: 'status-unknown' };
        return <span className={`status-badge ${config.class}`}>{config.label}</span>;
    };
    
    const getPaymentStatusBadge = (status) => {
        const statusConfig = {
            Pending: { label: 'En attente', class: 'status-pending' },
            Paid: { label: 'Payée', class: 'status-confirmed' },
            Failed: { label: 'Échoué', class: 'status-cancelled' },
        };
        const config = statusConfig[status] || { label: status, class: 'status-unknown' };
        return <span className={`status-badge ${config.class}`}>{config.label}</span>;
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const formatPrice = (price) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);

    const openOrderDetails = (order) => {
        console.log('Opening details for order:', JSON.stringify(order, null, 2));
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedOrder(null);
    };

    if (loading) {
        return (
            <div className="orders-container">
                <ClientNavbar />
                <div className="loading-spinner"><div className="spinner"></div><p>Chargement des commandes...</p></div>
            </div>
        );
    }

    return (
        <div className="orders-container">
            <ClientNavbar />
            <div className="orders-header">
                <h1>Mes Commandes</h1>
                <p>Gérez vos commandes et suivez leur statut</p>
            </div>

            <div className="orders-filters">
                <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Toutes
                </button>
                <button 
                    className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    En attente
                </button>
                <button 
                    className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
                    onClick={() => setFilter('confirmed')}
                >
                    Confirmées
                </button>
                <button 
                    className={`filter-btn ${filter === 'processing' ? 'active' : ''}`}
                    onClick={() => setFilter('processing')}
                >
                    En traitement
                </button>
                <button 
                    className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`}
                    onClick={() => setFilter('delivered')}
                >
                    Livrées
                </button>
            </div>

            {error && <div className="error-message"><p>{error}</p><button onClick={fetchOrders}>Réessayer</button></div>}

            {orders.length === 0 ? (
                <div className="no-orders">
                    <div className="no-orders-icon">📦</div>
                    <h3>Aucune commande trouvée</h3>
                    <p>Vous n'avez pas encore passé de commande{filter !== 'all' ? ` avec le statut "${filter}"` : ''}.</p>
                </div>
            ) : (
                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>N° Commande</th>
                                <th>Date</th>
                                <th>Montant Total</th>
                                <th>Statut Commande</th>
                                <th>Statut Paiement</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order._id}>
                                    <td><strong>{order.orderNumber}</strong></td>
                                    <td>{formatDate(order.createdAt)}</td>
                                    <td><strong>{formatPrice(order.totalAmount)}</strong></td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td>{getPaymentStatusBadge(order.paymentStatus)}</td>
                                    <td>
                                        <div className="order-actions">
                                            <button className="btn-details" onClick={() => openOrderDetails(order)}>Détails</button>
                                            {/* Show Pay button if payment is pending OR has failed */}
                                            {['Pending', 'Failed'].includes(order.paymentStatus) && (
                                                <button className="btn-pay" onClick={() => handlePayClick(order)}>
                                                    Payer
                                                </button>
                                            )}
                                            {['pending', 'confirmed'].includes(order.status) && (
                                                <button className="btn-cancel" onClick={() => cancelOrder(order._id)}>Annuler</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showDetailModal && selectedOrder && (
                <>
                {console.log('Selected Order for Detail View:', JSON.stringify(selectedOrder, null, 2))}
                <div className="modal-overlay" onClick={closeDetailModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Détails de la commande {selectedOrder.orderNumber}</h2>
                            <button className="modal-close" onClick={closeDetailModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="order-info">
                                <div className="info-row">
                                    <span className="label">Date de commande:</span>
                                    <span className="value">{formatDate(selectedOrder.createdAt)}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Statut:</span>
                                    <span className="value">{getStatusBadge(selectedOrder.status)}</span>
                                </div>
                                {selectedOrder.deliveryAddress && (
                                    <div className="info-row">
                                        <span className="label">Adresse de livraison:</span>
                                        <span className="value">
                                            {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city} {selectedOrder.deliveryAddress.postalCode}, {selectedOrder.deliveryAddress.country}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="order-items">
                                <h3>Produits commandés</h3>
                                {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="order-item">
                                        <div className="item-info">
                                            <div className="item-name">{item.product?.name || 'Produit non disponible'}</div>
                                            <div className="item-details">
                                                Quantité: {item.quantity} × {formatPrice(item.unitPrice)}
                                            </div>
                                        </div>
                                        <div className="item-total">
                                            {formatPrice(item.totalPrice)}
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="order-total">
                                    <strong>Total: {formatPrice(selectedOrder.totalAmount)}</strong>
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div className="order-notes">
                                    <h3>Notes</h3>
                                    <p>{selectedOrder.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            {/* Show Pay button if payment is pending OR has failed */}
                            {selectedOrder.paymentStatus && ['Pending', 'Failed'].includes(selectedOrder.paymentStatus) && (
                                <button 
                                    className="btn-pay"
                                    onClick={() => {
                                        closeDetailModal();
                                        handlePayClick(selectedOrder);
                                    }}
                                >
                                    Payer la commande
                                </button>
                            )}
                            {['pending', 'confirmed', 'processing'].includes(selectedOrder.status) && (
                                <button 
                                    className="btn-cancel"
                                    onClick={() => {
                                        cancelOrder(selectedOrder._id);
                                        closeDetailModal();
                                    }}
                                >
                                    Annuler la commande
                                </button>
                            )}
                            <button className="btn-close" onClick={closeDetailModal}>
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
                </>
            )}

            {/* --- PAYMENT MODAL RENDER --- */}
            {orderToPay && (
                <PaymentModal
                    order={orderToPay}
                    onPay={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                />
            )}
        </div>
    );
};

export default Orders;