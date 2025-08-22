import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useUnifiedAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('Attempting password reset for:', email);

      await resetPassword(email);

      // Store a flag to indicate password reset was requested
      localStorage.setItem('password_reset_requested', 'true');
      setMessage(
        'Password reset email sent! Check your inbox for instructions.'
      );
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error('Password reset error:', err);

      // Handle specific Firebase error codes
      if (
        err instanceof Error &&
        'code' in err &&
        err.code === 'auth/user-not-found'
      ) {
        setMessage('No account found with this email address.');
      } else if ((err as any).code === 'auth/invalid-email') {
        setMessage('Please enter a valid email address.');
      } else {
        setMessage(
          (err as any).message || 'An error occurred. Please try again.'
        );
      }
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        {!isSuccess ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            {message && (
              <div
                className={`text-sm ${isSuccess ? 'text-green-600' : 'text-red-600'}`}
              >
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Sending...</span>
                  </div>
                ) : (
                  'Send reset email'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link to="/login" className="text-blue-600 hover:text-blue-500">
                Back to sign in
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-sm text-green-700">{message}</div>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
