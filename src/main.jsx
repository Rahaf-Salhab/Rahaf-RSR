import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
 import { ToastContainer } from 'react-toastify';
import './index.css';

import ThemeContextProvider from './context/ThemeContext.jsx';
 createRoot(document.getElementById('root')).render(
  <>
    <ThemeContextProvider>
      <App />
      <ToastContainer />
    </ThemeContextProvider>
  </>
);