import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import logo from './assets/logo.png'

const setFavicon = (src) => {
  const link = document.getElementById('app-favicon');
  if (link) link.href = src;
};

setFavicon(logo);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
