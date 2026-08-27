// Protective shim for iframe/sandbox environments with strict window properties
(function ensureFetchSetter() {
  try {
    if (typeof window !== 'undefined') {
      const origFetch = window.fetch;
      const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
      if (desc && !desc.writable && !desc.set) {
        let currentFetch = origFetch ? origFetch.bind(window) : undefined;
        try {
          Object.defineProperty(window, 'fetch', {
            get() {
              return currentFetch;
            },
            set(v) {
              currentFetch = v;
            },
            configurable: true,
            enumerable: true,
          });
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

