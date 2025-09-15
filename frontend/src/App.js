import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext'; // Importer
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
import ManagePaymentMethods from './components/ManagePaymentMethods'; // <-- IMPORT
import Chatbot from './components/chatbot/Chatbot'; // <-- AJOUTER CETTE LIGNE
import Profile from './components/Profile';
import ForgotPassword from './components/auth/ForgotPassword';
import './App.css';

function App() {
  return (
    <NotificationProvider> {/* Envelopper avec le NotificationProvider */}
      <CartProvider>
        <div className="app-container">
          <main className="main-content">
            <Routes>
              {/* ... routes ... */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/client-dashboard" element={<ClientDashboard />} />
              <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/supplier-dashboard/catalogue" element={<ProductsPage />} />
              <Route path="/client-dashboard/catalog" element={<ClientCatalog />} />
              <Route path="/client-dashboard/orders" element={<Orders />} />
              <Route path="/client-dashboard/new-order" element={<NewOrder />} />
              <Route path="/supplier/orders" element={<SupplierOrders />} />
              <Route path="/supplier/client" element={<SupplierClients />} />
              <Route path="/client-dashboard/stock" element={<ClientInventory />} />
              <Route path="/client-dashboard/payment-methods" element={<ManagePaymentMethods />} />
            </Routes>
          </main>
          <Chatbot /> {/* <-- AJOUTER CETTE LIGNE */}
        </div>
      </CartProvider>
    </NotificationProvider>
  );
}

export default App;
