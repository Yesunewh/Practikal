import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';
import { I18nProvider } from './i18n/I18nContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
);
