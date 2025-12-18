import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// ✅ تمام CSS ها در یک جا - برای جلوگیری از فلش
import './globals.css';
import './theme.css';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
