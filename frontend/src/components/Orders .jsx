// src/components/Orders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../style/Orders.css';
import ClientNavbar from './dashboard/ClientNavbar';

const Orders = () => {
    const { token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const url = filter === 'all'
                ? `${API_URL}/api/orders`
                : `${API_URL}/api/orders?status=${filter}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                setError(`Erreur serveur: Réponse non-JSON reçue (statut ${response.status})`);
                alert(`Erreur serveur: Réponse non-JSON reçue (statut ${response.status})`);
                console.error('Réponse non-JSON:', await response.text());
                return;
            }

            if (result.success) {
                setOrders(result.data);
            } else {
                setError(result.message || 'Erreur lors du chargement des commandes');
                alert(result.message || 'Erreur lors du chargement des commandes');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            alert('Erreur de connexion au serveur');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    }, [filter, token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const cancelOrder = async (orderId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
            return;
        }

        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                alert(`Erreur serveur: Réponse non-JSON reçue (statut ${response.status})`);
                console.error('Réponse non-JSON:', await response.text());
                return;
            }

            if (result.success) {
                fetchOrders();
                alert('Commande annulée avec succès');
            } else {
                alert(result.message || 'Erreur lors de l\'annulation');
            }
        } catch (err) {
            alert('Erreur de connexion au serveur');
            console.error('Erreur:', err);
        }
    };

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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
    };

    if (loading) {
        return (
            <div className="orders-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement des commandes...</p>
                </div>
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

            {/* Filtres */}
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

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={fetchOrders}>Réessayer</button>
                </div>
            )}

            {/* Liste des commandes */}
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
                                <th>Produits</th>
                                <th>Montant Total</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order._id}>
                                    <td>
                                        <strong>{order.orderNumber}</strong>
                                    </td>
                                    <td>{formatDate(order.createdAt)}</td>
                                    <td>
                                        <div className="order-items-summary">
                                            {order.items.length} produit{order.items.length > 1 ? 's' : ''}
                                            <div className="items-preview">
                                                {order.items.slice(0, 2).map((item, index) => (
                                                    <span key={index} className="item-name">
                                                        {item.product.name}
                                                        {index < Math.min(order.items.length, 2) - 1 && ', '}
                                                    </span>
                                                ))}
                                                {order.items.length > 2 && (
                                                    <span className="more-items">
                                                        +{order.items.length - 2} autre{order.items.length > 3 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <strong>{formatPrice(order.totalAmount)}</strong>
                                    </td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td>
                                        <div className="order-actions">
                                            <button 
                                                className="btn-details"
                                                onClick={() => openOrderDetails(order)}
                                            >
                                                Détails
                                            </button>
                                            {['pending', 'confirmed', 'processing'].includes(order.status) && (
                                                <button 
                                                    className="btn-cancel"
                                                    onClick={() => cancelOrder(order._id)}
                                                >
                                                    Annuler
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal détails de commande */}
            {showModal && selectedOrder && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Détails de la commande {selectedOrder.orderNumber}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
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
                                            <div className="item-name">{item.product.name}</div>
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
                            {['pending', 'confirmed', 'processing'].includes(selectedOrder.status) && (
                                <button 
                                    className="btn-cancel"
                                    onClick={() => {
                                        cancelOrder(selectedOrder._id);
                                        closeModal();
                                    }}
                                >
                                    Annuler la commande
                                </button>
                            )}
                            <button className="btn-close" onClick={closeModal}>
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;