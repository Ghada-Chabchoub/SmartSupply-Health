import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import ClientNavbar from './ClientNavbar';
import api from '../../services/api'; // Assuming you have an api service

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingOrders: 0,
    deliveredOrders: 0,
    totalPaidThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const ordersResponse = await api.get('/orders');
        const orders = ordersResponse.data.data || [];

        const pendingOrders = orders.filter(order =>
          ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)
        ).length;

        const deliveredOrders = orders.filter(order => order.status === 'delivered').length;

        // Calculate total amount paid for the current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const totalPaidThisMonth = orders
          .filter(order => {
            const orderDate = new Date(order.createdAt);
            return (
              order.paymentStatus === 'Paid' &&
              orderDate.getMonth() === currentMonth &&
              orderDate.getFullYear() === currentYear
            );
          })
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        setStats({
          pendingOrders,
          deliveredOrders,
          totalPaidThisMonth,
        });

      } catch (error) {
        console.error("Erreur lors de la récupération des données du tableau de bord:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <ClientNavbar />

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-welcome-section">
            <h2 className="dashboard-welcome-title">
              Bienvenue, {user?.name} !
            </h2>
            <p className="dashboard-welcome-subtitle">
              Tableau de bord de {user?.clinicName}
            </p>

            {/* Stats Cards */}
            <div className="stats-grid stats-grid-3">
              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-card-icon blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6M8 11H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2" />
                    </svg>
                  </div>
                  <div className="stat-card-info">
                    <p className="stat-card-label">Commandes en cours</p>
                    <p className="stat-card-value">{loading ? '...' : stats.pendingOrders}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-card-icon green">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-card-info">
                    <p className="stat-card-label">Commandes livrées</p>
                    <p className="stat-card-value">{loading ? '...' : stats.deliveredOrders}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-card-icon purple">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="stat-card-info">
                    <p className="stat-card-label">Montant payé ce mois</p>
                    <p className="stat-card-value">
                      {loading ? '...' : `${stats.totalPaidThisMonth.toFixed(2)} €`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="actions-grid">
              <button
                className="action-button blue"
                onClick={() => navigate('/client-dashboard/catalog')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6M8 11H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2" />
                </svg>
                Catalogue Produits
              </button>

              <button
                className="action-button green"
                onClick={() => navigate('/client-dashboard/new-order')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nouvelle Commande
              </button>

              <button
                className="action-button secondary-blue"
                onClick={() => navigate('/client-dashboard/orders')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Mes Commandes
              </button>

              <button
                className="action-button orange"
                onClick={() => navigate('/client-dashboard/stock')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Stock
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
