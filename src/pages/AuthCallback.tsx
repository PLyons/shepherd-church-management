import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('AuthCallback component mounted!');
    console.log('Current URL:', window.location.href);
    console.log('Hash:', window.location.hash);
    console.log('Search params:', window.location.search);
    
    // Don't do quick redirect for password reset - we need to establish session first
    // The full handleAuthCallback will handle the redirect after session is set
    
    const handleAuthCallback = async () => {
      try {
        // Parse the URL hash for tokens (Supabase returns them in the fragment)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        const error_description = hashParams.get('error_description');
        
        // Check if Supabase already handled the session
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('Checking for existing session:', { 
          hasSession: !!session,
          type,
          user: session?.user?.email 
        });
        
        // Debug logging
        console.log('AuthCallback Debug:', {
          hash: window.location.hash,
          hashParams: Object.fromEntries(hashParams),
          searchParams: Object.fromEntries(searchParams),
          type,
          session: session ? 'present' : 'missing'
        });
        
        if (error_description) {
          setError(decodeURIComponent(error_description.replace(/\+/g, ' ')));
          setLoading(false);
          return;
        }

        // If we have a session and it's a password reset, redirect to set-password
        if (session && type === 'recovery') {
          console.log('Password reset flow detected with session, redirecting to /set-password');
          localStorage.removeItem('password_reset_requested');
          navigate('/set-password', { replace: true });
          return;
        }

        // If we have a session but no recovery type, go to dashboard
        if (session && !type) {
          console.log('Regular auth flow, redirecting to /dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }
        
        // If no session was found, show error
        if (!session) {
          console.log('No session found after Supabase processing');
          setError('Authentication failed - no session created');
          setLoading(false);
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