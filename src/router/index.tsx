import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '../components/auth/AuthGuard';
import { RoleGuard } from '../components/auth/RoleGuard';
import { Layout } from '../components/common/Layout';

// Pages
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Members from '../pages/Members';
import Households from '../pages/Households';
import Events from '../pages/Events';
import Donations from '../pages/Donations';
import Reports from '../pages/Reports';
import Sermons from '../pages/Sermons';
import Volunteers from '../pages/Volunteers';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

export const router = createBrowserRouter([
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
        path: 'households',
        element: <Households />,
      },
      {
        path: 'events',
        element: <Events />,
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
    path: '*',
    element: <NotFound />,
  },
]);