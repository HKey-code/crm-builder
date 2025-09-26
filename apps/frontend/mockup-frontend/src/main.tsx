// apps/frontend/mockup-frontend/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// IMPORTANT: load RF base CSS first, then your app CSS
import '@xyflow/react/dist/style.css';
import './index.css';

import App from './App.tsx';
import { AuthProvider } from './comm/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);