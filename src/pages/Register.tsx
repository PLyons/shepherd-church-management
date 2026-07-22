// src/pages/Register.tsx
// Public self-registration is disabled — invite-only accounts (security lockdown)
// Exists so /register no longer creates Firebase Auth users from the open internet
// RELEVANT FILES: src/pages/Login.tsx, src/router/index.tsx, src/contexts/FirebaseAuthContext.tsx

import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

/**
 * Open registration is closed.
 * New accounts must be created by an admin (Firebase Console / Admin SDK).
 */
export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
          <ShieldOff className="h-6 w-6 text-gray-600" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Registration is invite-only
        </h1>
        <p className="text-gray-600">
          Self-serve account creation is disabled. Contact your church
          administrator if you need access.
        </p>
        <Link
          to="/login"
          className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
