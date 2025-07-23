import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('AuthCallback component mounted!');
    console.log('Current URL:', window.location.href);
    console.log('Search params:', window.location.search);
    
    const handleAuthCallback = async () => {
      try {
        // Parse URL search parameters for Firebase auth actions
        const mode = searchParams.get('mode');
        const oobCode = searchParams.get('oobCode');
        const continueUrl = searchParams.get('continueUrl');
        
        console.log('AuthCallback Debug:', {
          mode,
          oobCode: !!oobCode,
          continueUrl
        });
        
        // Handle different Firebase auth modes
        switch (mode) {
          case 'resetPassword':
            console.log('Password reset flow detected, redirecting to /set-password');
            navigate(`/set-password?mode=${mode}&oobCode=${oobCode}`, { replace: true });
            return;
          
          case 'verifyEmail':
            console.log('Email verification flow detected');
            // For now, just redirect to login with a message
            navigate('/login?message=Email verification completed', { replace: true });
            return;
            
          case 'signIn':
            console.log('Sign-in flow detected, redirecting to dashboard');
            navigate('/dashboard', { replace: true });
            return;
            
          default:
            console.log('Unknown or no mode, redirecting to login');
            navigate('/login', { replace: true });
            return;
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An unexpected error occurred during authentication');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Error
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              There was a problem completing your authentication
            </p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">
              {error}
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}