import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '../components/auth/AuthGuard';
import { RoleGuard } from '../components/auth/RoleGuard';
import { Layout } from '../components/common/Layout';

// Pages
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Members from '../pages/Members';
import MemberProfile from '../pages/MemberProfile';
import { MemberForm } from '../components/members/MemberForm';
import Settings from '../pages/Settings';
import QRRegistration from '../pages/QRRegistration';
import RegistrationTokens from '../pages/admin/RegistrationTokens';
import PendingRegistrations from '../pages/admin/PendingRegistrations';
import RegistrationAnalytics from '../pages/admin/RegistrationAnalytics';
import AuthCallback from '../pages/AuthCallback';
import PasswordReset from '../pages/PasswordReset';
import SetPassword from '../pages/SetPassword';
import NotFound from '../pages/NotFound';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Navigate to="/dashboard" replace />,
    },
    {
      path: '/login',
      element: (
        <AuthGuard requireAuth={false}>
          <Login />
        </AuthGuard>
      ),
    },
    {
      path: '/register',
      element: (
        <AuthGuard requireAuth={false}>
          <Register />
        </AuthGuard>
      ),
    },
    {
      path: '/',
      element: (
        <AuthGuard>
          <Layout />
        </AuthGuard>
      ),
      children: [
        {
          path: 'dashboard',
          element: <Dashboard />,
        },
        {
          path: 'members',
          element: <Members />,
        },
        {
          path: 'members/new',
          element: (
            <RoleGuard allowedRoles={['admin', 'pastor']}>
              <div className="max-w-2xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Add New Member</h1>
                <MemberForm />
              </div>
            </RoleGuard>
          ),
        },
        {
          path: 'members/:id',
          element: <MemberProfile />,
        },
        {
          path: 'admin/registration-tokens',
          element: (
            <RoleGuard allowedRoles={['admin', 'pastor']}>
              <RegistrationTokens />
            </RoleGuard>
          ),
        },
        {
          path: 'admin/pending-registrations',
          element: (
            <RoleGuard allowedRoles={['admin', 'pastor']}>
              <PendingRegistrations />
            </RoleGuard>
          ),
        },
        {
          path: 'admin/registration-analytics',
          element: (
            <RoleGuard allowedRoles={['admin', 'pastor']}>
              <RegistrationAnalytics />
            </RoleGuard>
          ),
        },
        {
          path: 'settings',
          element: (
            <RoleGuard allowedRoles={['admin', 'pastor']}>
              <Settings />
            </RoleGuard>
          ),
        },
      ],
    },
    {
      path: '/auth/callback',
      element: (
        <AuthGuard requireAuth={false}>
          <AuthCallback />
        </AuthGuard>
      ),
    },
    {
      path: '/reset-password',
      element: (
        <AuthGuard requireAuth={false}>
          <PasswordReset />
        </AuthGuard>
      ),
    },
    {
      path: '/set-password',
      element: <SetPassword />,
    },
    {
      path: '/register/qr',
      element: (
        <AuthGuard requireAuth={false}>
          <QRRegistration />
        </AuthGuard>
      ),
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);
