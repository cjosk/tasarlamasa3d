import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { FirebaseProvider } from './providers/FirebaseProvider';
import { DesignProvider } from './providers/DesignProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <FirebaseProvider>
        <DesignProvider>
          <App />
        </DesignProvider>
      </FirebaseProvider>
    </BrowserRouter>
  </React.StrictMode>
);
