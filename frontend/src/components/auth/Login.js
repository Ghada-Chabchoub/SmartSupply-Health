import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '' 
  });

  const { login, loading, error, clearError } = useAuth();

  const handleChange = (e) => {
    if (error) clearError();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.role) {
      return;
    }

    await login(formData.email, formData.password, formData.role);
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-background-shape shape-1"></div>
        <div className="auth-background-shape shape-2"></div>
        <div className="auth-background-shape shape-3"></div>
      </div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <span>SS</span>
            </div>
            <h1 className="auth-logo-text">SmartSupply Health</h1>
          </div>
          <h2 className="auth-title">Connexion</h2>
          <p className="auth-subtitle">Accédez à votre espace personnel</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="auth-form-group">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrapper">
              <svg className="auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="votre@email.com"
                className="auth-input"
                disabled={loading}
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Mot de passe</label>
            <div className="auth-input-wrapper">
              <svg className="auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="auth-input"
                disabled={loading}
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Vous êtes :</label>
            <div className="auth-radio-group">
              <label className="auth-radio-label">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={formData.role === 'client'}
                  onChange={handleChange}
                  disabled={loading}
                  className="auth-radio"
                />
                <span className="auth-radio-custom"></span>
                <span className="auth-radio-text">Client</span>
              </label>

              <label className="auth-radio-label">
                <input
                  type="radio"
                  name="role"
                  value="supplier"
                  checked={formData.role === 'supplier'}
                  onChange={handleChange}
                  disabled={loading}
                  className="auth-radio"
                />
                <span className="auth-radio-custom"></span>
                <span className="auth-radio-text">Fournisseur</span>
              </label>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || !formData.role}
            className="auth-button auth-button-primary"
          >
            {loading ? (
              <>
                <div className="auth-spinner"></div>
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Pas encore de compte ?{' '}
            <Link to="/register" className="auth-link">
              Créez-en un ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;