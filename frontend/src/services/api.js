import axios from 'axios';

// Crée une instance d'axios avec une configuration de base
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // L'URL de base de votre backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Ou où que vous stockiez le token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
