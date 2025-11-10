import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; 
import './index.css'; 

//  elemen 'root' dari index.html
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    // React.StrictMode digunakan untuk pemeriksaan tambahan selama pengembangan
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  console.error("Elemen dengan ID 'root' tidak ditemukan di dokumen HTML.");
}