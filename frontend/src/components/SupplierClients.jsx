import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../style/Client.css';
import SupplierNavbar from './dashboard/SupplierNavbar';

const SupplierClients = () => {
    const { token } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchClients = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await fetch(`${API_URL}/api/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                const clientMap = new Map();
                result.data.forEach(order => {
                    const client = order.client;
                    if (!client || !client._id) {
                        console.warn(`Order ${order._id} has invalid client data: ${JSON.stringify(client)}`);
                        return;
                    }
                    if (!clientMap.has(client._id)) {
                        clientMap.set(client._id, {
                            _id: client._id,
                            name: client.name,
                            email: client.email,
                            phone: client.phone,
                            clinicName: client.clinicName,
                            clinicType: client.clinicType,
                            orderCount: 0,
                            totalSpent: 0
                        });
                    }
                    const clientData = clientMap.get(client._id);
                    clientData.orderCount += 1;
                    clientData.totalSpent += order.totalAmount;
                });
                setClients(Array.from(clientMap.values()));
            } else {
                setError(result.message || 'Erreur lors du chargement des clients');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur. Veuillez réessayer.');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'TND' // Changed to TND for consistency
        }).format(price);
    };

    if (loading) {
        return (
            <div className="clients-container">
                <SupplierNavbar />
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement des clients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="clients-container">
            <SupplierNavbar />
            <div className="clients-header">
                <h1>Mes Clients</h1>
                <p>Liste des clients ayant commandé vos produits</p>
            </div>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={fetchClients}>Réessayer</button>
                </div>
            )}

            {!error && clients.length === 0 ? (
                <div className="no-clients">
                    <div className="no-clients-icon">👥</div>
                    <h3>Aucun client trouvé</h3>
                    <p>Aucun client n'a encore passé de commande.</p>
                </div>
            ) : (
                <div className="clients-table-container">
                    <table className="clients-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Clinique</th>
                                <th>Email</th>
                                <th>Commandes</th>
                                <th>Total Dépensé</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((client) => (
                                <tr key={client._id}>
                                    <td data-label="Nom">{client.name || 'N/A'}</td>
                                    <td data-label="Clinique">{client.clinicName || 'N/A'}</td>
                                    <td data-label="Email">{client.email || 'N/A'}</td>
                                    <td data-label="Commandes">{client.orderCount}</td>
                                    <td data-label="Total Dépensé">{formatPrice(client.totalSpent)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SupplierClients;