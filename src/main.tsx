import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { instalarSelecaoAoFocar } from './utils/selecaoAoFocar';
import { Dica } from './components/Dica';
import { ThemeProvider } from './context/ThemeContext';

instalarSelecaoAoFocar();

// PWA: o service worker só entra no ar depois do build, para não atrapalhar o dev
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker não registrado:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
    <Dica />
  </React.StrictMode>,
);
