// src/App.tsx
// Main application component that sets up the global provider context and routing
// This file exists as the root component that wraps the entire application with necessary providers
// RELEVANT FILES: src/main.tsx, src/router/index.tsx, src/contexts/AuthProviderWrapper.tsx, src/contexts/ToastContext.tsx

import { RouterProvider } from 'react-router-dom';
import { AuthProviderWrapper } from './contexts/AuthProviderWrapper';
import { ToastProvider } from './contexts/ToastContext';
import { router } from './router';

function App() {
  return (
    <AuthProviderWrapper>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProviderWrapper>
  );
}

export default App;
