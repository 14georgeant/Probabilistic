/*
 * ----------------------------------------------------------------------------
 * OWNERSHIP CLAUSE
 * ----------------------------------------------------------------------------
 * This application, including all source code, intellectual property, and 
 * associated assets, is the sole property of ANTHONY GEORGE KIBUE.
 * 
 * Unauthorized copying, distribution, or modification of this code is 
 * strictly prohibited without the express written permission of the owner.
 * ----------------------------------------------------------------------------
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker for PWA/Play Store support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use absolute path '/service-worker.js' to ensure correct scope resolution
    // regardless of hosting subdirectory or environment.
    navigator.serviceWorker.register('/service-worker.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      },
      (err) => {
        // Log error but do not crash application
        console.warn('ServiceWorker registration failed: ', err);
      }
    );
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);