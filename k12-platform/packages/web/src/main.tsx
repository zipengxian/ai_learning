import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useAuthStore } from '@/store/authStore';
import './styles/global.css';

useAuthStore.getState().initialize();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);