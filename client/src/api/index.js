// Plik: client/src/api/index.js
// Konfiguracja instancji Axios do komunikacji z API

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Upewnij się, że port jest zgodny z serwerem
});

// Interceptor do dodawania tokena JWT do każdego zapytania
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default api;
