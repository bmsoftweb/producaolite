import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { instalarSelecaoAoFocar } from './utils/selecaoAoFocar';

instalarSelecaoAoFocar();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
