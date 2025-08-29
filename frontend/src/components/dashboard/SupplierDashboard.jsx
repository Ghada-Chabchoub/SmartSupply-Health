import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import SupplierNavbar from './SupplierNavbar';

const SupplierDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeClients: 0,
    totalOrders: 0,
    productsInStock: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/supplier/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <SupplierNavbar />

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-welcome-section">
            <h2 className="dashboard-welcome-title">
              Bienvenue, {user?.name} !
            </h2>
            <p className="dashboard-welcome-subtitle">
              Tableau de bord de {user?.companyName}
            </p>

            {/* Stats Cards */}
            <div className="stats-grid stats-grid-4">
              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-card-icon blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="stat-card-info">
                    <p className="stat-card-label">Clients actifs</p>
                    <p className="stat-card-value">{loading ? '...' : stats.activeClients}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-card-icon green">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6M8 11H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2" />
                    </svg>
                  </div>
                  <div className="stat-card-info">
                    <p className="stat-card-label">Commandes totales</p>
                    <p className="stat-card-value">{loading ? '...' : stats.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-card-icon yellow">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="stat-card-info">
                    <p className="stat-card-label">Produits en stock</p>
                    <p className="stat-card-value">{loading ? '...' : stats.productsInStock}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-content">
                  <div className="stat-card-icon secondary-blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-card-info">
                    <p className="stat-card-label">CA ce mois</p>
                    <p className="stat-card-value">{loading ? '...' : `${stats.monthlyRevenue.toFixed(2)} TND`}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="actions-grid">
              <button
                className="action-button blue"
                onClick={() => navigate('/supplier-dashboard/catalogue')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Gérer Catalogue
              </button>

              <button
                className="action-button green"
                onClick={() => navigate('/supplier/orders')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Commandes Reçues
              </button>

              <button
                className="action-button secondary-blue"
                onClick={() => navigate('/supplier/client')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Mes Clients
              </button>

              
                
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupplierDashboard;
