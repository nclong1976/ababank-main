import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {inject} from '@vercel/analytics';
import App from './App.tsx';
import './index.css';

// Initialize Vercel Web Analytics
inject();

// Fix for BarcodeDetector errors in some environments
// If BarcodeDetector is available but the service is missing, it can cause crashes.
// We "disable" it here to force libraries to use stable fallbacks like jsqr.
if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
  try {
    Object.defineProperty(window, 'BarcodeDetector', {
      value: undefined,
      configurable: true,
      writable: true
    });
  } catch (e) {
    // Fallback if defineProperty fails
    (window as any).BarcodeDetector = undefined;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
