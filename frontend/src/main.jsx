import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import './index.css';
import { decrypt } from './utils/crypto.js';

// Configure Axios via Environment Variables
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Add Axios Request Interceptor to attach the decrypted API key
axios.interceptors.request.use((config) => {
  const encryptedKey = localStorage.getItem('openai_api_key');
  if (encryptedKey) {
    const decryptedKey = decrypt(encryptedKey);
    if (decryptedKey) {
      config.headers['X-API-Key'] = decryptedKey;
      config.headers['Authorization'] = `Bearer ${decryptedKey}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
