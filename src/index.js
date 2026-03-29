import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';

// Suppress ResizeObserver loop errors (Commonly triggered by Monaco/Framer Motion in Dev mode)
window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' || 
      e.message === 'ResizeObserver loop limit exceeded') {
    e.stopImmediatePropagation();
    const resizeObserverError = document.getElementById('webpack-dev-server-client-overlay');
    if (resizeObserverError) resizeObserverError.style.display = 'none';
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
