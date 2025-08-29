import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// import ProtectedRoute from './components/common/ProtectedRoute'; // Commenté temporairement
import Register from './components/auth/Register';
import SupplierDashboard from './components/dashboard/SupplierDashboard';
import Login from './components/auth/Login';
import ClientDashboard from './components/dashboard/ClientDashboard';
import ProductsPage from './pages/ProductsPage';
import ClientCatalog from './components/ClientCatalog';
import Orders from './components/Orders ';
import NewOrder from './components/NewOrder';
import SupplierOrders from './components/SupplierOrders';
import SupplierClients from './components/SupplierClients';
import ClientInventory from './components/ClientInventory';
import './App.css'; // Import the new App.css

function App() {
  return (
    <div className="app-container">
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes temporaires sans protection pour debug */}
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/supplier-dashboard" element={<SupplierDashboard />} />

          {/* Protected Routes - commentées temporairement
          <Route
            path="/client-dashboard"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier-dashboard"
            element={
              <ProtectedRoute requiredRole="supplier">
                <SupplierDashboard />
              </ProtectedRoute>
            }
          />
          */}

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/supplier-dashboard/catalogue" element={<ProductsPage />} />
          <Route path="/client-dashboard/catalog" element={<ClientCatalog />} />
          <Route path="/client-dashboard/orders" element={<Orders />} />
          <Route path="/client-dashboard/new-order" element={<NewOrder />} />
          <Route path="/supplier/orders" element={<SupplierOrders />} />
          <Route path="/supplier/client" element={<SupplierClients />} />
          <Route path="/client-dashboard/stock" element={<ClientInventory />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
