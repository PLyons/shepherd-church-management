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
