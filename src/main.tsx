// src/main.tsx
// Application entry point that renders the root React component into the DOM
// This file exists as the standard Vite/React entry point for the entire application
// RELEVANT FILES: src/App.tsx, src/index.css, index.html, vite.config.ts

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
