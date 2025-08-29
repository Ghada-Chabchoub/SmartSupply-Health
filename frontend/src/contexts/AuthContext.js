import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'REGISTER_SUCCESS':
      // Pour le register, on ne stocke pas le token immédiatement
      return {
        ...state,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'LOAD_USER':
      return {
        ...state,
        user: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate(); 

  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/me');
          dispatch({ type: 'LOAD_USER', payload: response.data.data.user });
        } catch (error) {
          console.error('Load user error:', error);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    };

    loadUser();
  }, [state.token]);

  const login = async (email, password, role) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
        role
      });
      console.log('Response complète:', res.data); // Debug log
      const { user, token } = res.data.data;
      console.log('User data:', user); // Debug log
      console.log('Token:', token); // Debug log
      localStorage.setItem('token', token);

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });

      // Décoder le token pour obtenir le rôle
      const decoded = jwt_decode(token);
      console.log('Token décodé:', decoded); // Debug log
      
      // Redirection basée sur le rôle du token
      if (decoded.role === 'client') {
        console.log('Redirection vers client dashboard'); // Debug log
        navigate('/client-dashboard');
      } else if (decoded.role === 'supplier') {
        console.log('Redirection vers supplier dashboard'); // Debug log
        navigate('/supplier-dashboard');
      } else {
        console.error('Rôle inconnu:', decoded.role);
        navigate('/'); // Fallback vers la page d'accueil
      }

    } catch (err) {
      console.error('Erreur de connexion:', err); // Debug log
      const errorMessage = err.response?.data?.message || 'Email ou mot de passe incorrect';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'REGISTER_START' });
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      dispatch({ type: 'REGISTER_SUCCESS', payload: response.data.data });
      
      // Redirection vers la page de login après inscription réussie
      navigate('/login');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'REGISTER_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};