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
import Households from '../pages/Households';
import HouseholdProfile from '../pages/HouseholdProfile';
import Events from '../pages/Events';
import EventDetail from '../pages/EventDetail';
import EventForm from '../pages/EventForm';
import Donations from '../pages/Donations';
import Reports from '../pages/Reports';
import Sermons from '../pages/Sermons';
import Volunteers from '../pages/Volunteers';
import MyVolunteering from '../pages/MyVolunteering';
import Settings from '../pages/Settings';
import QRRegistration from '../pages/QRRegistration';
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
          path: 'members/:id',
          element: <MemberProfile />,
        },
        {
          path: 'households',
          element: <Households />,
        },
        {
          path: 'households/:id',
          element: (
            <RoleGuard allowedRoles={['admin', 'pastor']}>
              <HouseholdProfile />
            </RoleGuard>
          ),
        },
        {
          path: 'events',
          element: <Events />,
        },
        {
          path: 'events/new',
          element: (
            <RoleGuard allowedRoles={['admin', 'pastor']}>
              <EventForm />
            </RoleGuard>
          ),
        },
        {
          path: 'events/:id',
          element: <EventDetail />,
        },
        {
          path: 'events/:id/edit',
          element: (
            <RoleGuard allowedRoles={['admin', 'pastor']}>
              <EventForm />
            </RoleGuard>
          ),
        },
        {
          path: 'donations',
          element: (
            <RoleGuard allowedRoles={['admin', 'pastor']}>
              <Donations />
            </RoleGuard>
          ),
        },
        {
          path: 'reports',
          element: (
            <RoleGuard allowedRoles={['admin', 'pastor']}>
              <Reports />
            </RoleGuard>
          ),
        },
        {
          path: 'sermons',
          element: <Sermons />,
        },
        {
          path: 'volunteers',
          element: <Volunteers />,
        },
        {
          path: 'my-volunteering',
          element: <MyVolunteering />,
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
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);
