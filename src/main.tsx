import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safe circuit-breaker for benign ResizeObserver browser loops
if (typeof window !== 'undefined') {
  const ignoreErrors = [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications.'
  ];

  window.addEventListener('error', (e) => {
    if (e.message && ignoreErrors.some(err => e.message.includes(err))) {
      e.stopImmediatePropagation();
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && e.reason.message && ignoreErrors.some(err => e.reason.message.includes(err))) {
      e.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
