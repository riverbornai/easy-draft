import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import './index.css';
import { auth } from './utils/firebase.js';

// Configure Axios via Environment Variables
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Add Axios Request Interceptor to attach the signed-in user's Firebase ID
// token, so the backend knows which account is making the request (and can
// look up that account's saved OpenAI/Anthropic keys).
axios.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    config.headers['X-Firebase-Auth'] = await auth.currentUser.getIdToken();
  }
  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
