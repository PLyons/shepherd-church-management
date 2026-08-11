// src/router/index.tsx
// Main router configuration defining all application routes with role-based access control
// This file exists to centralize route definitions and enforce authentication and authorization patterns
// RELEVANT FILES: src/components/auth/AuthGuard.tsx, src/components/auth/RoleGuard.tsx, src/components/auth/FeatureGuard.tsx, src/config/features.ts

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactElement } from 'react';
import { AuthGuard } from '../components/auth/AuthGuard';
import { RoleGuard } from '../components/auth/RoleGuard';
import { FeatureGuard } from '../components/auth/FeatureGuard';
import { Layout } from '../components/common/Layout';
import type { FeatureModule } from '../config/features';

// Pages
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Members from '../pages/Members';
import MemberProfile from '../pages/MemberProfile';
import { MemberFormEnhanced } from '../components/members/MemberFormEnhanced';
import Households from '../pages/Households';
import HouseholdProfile from '../pages/HouseholdProfile';
import CreateHousehold from '../pages/CreateHousehold';
import EditHousehold from '../pages/EditHousehold';
import HouseholdMembers from '../pages/HouseholdMembers';
import Events from '../pages/Events';
import { Calendar } from '../pages/Calendar';
import { CreateEvent } from '../pages/CreateEvent';
import { EditEvent } from '../pages/EditEvent';
import Settings from '../pages/Settings';
import QRRegistration from '../pages/QRRegistration';
import RegistrationTokens from '../pages/admin/RegistrationTokens';
import PendingRegistrations from '../pages/admin/PendingRegistrations';
import RegistrationAnalytics from '../pages/admin/RegistrationAnalytics';
import AuthCallback from '../pages/AuthCallback';
import PasswordReset from '../pages/PasswordReset';
import SetPassword from '../pages/SetPassword';
import NotFound from '../pages/NotFound';
import RecordDonation from '../pages/RecordDonation';
import BatchRecordDonations from '../pages/BatchRecordDonations';
import EditDonation from '../pages/EditDonation';

// New donation-related pages
import Donations from '../pages/Donations';
import CreateDonation from '../pages/CreateDonation';
import MyGiving from '../pages/MyGiving';
import GivingOverview from '../pages/GivingOverview';
import DonationDetail from '../pages/DonationDetail';

/** Wrap a route element so it is unreachable when the module flag is off. */
function feature(module: FeatureModule, element: ReactElement): ReactElement {
  return <FeatureGuard module={module}>{element}</FeatureGuard>;
}

// Lazy-loaded tab components
const OverviewTab = lazy(
  () => import('../components/members/profile/tabs/OverviewTab')
);
const ActivityTab = lazy(
  () => import('../components/members/profile/tabs/ActivityTab')
);
const MemberGivingTab = lazy(
  () => import('../components/members/profile/tabs/MemberGivingTab')
);
const CommunicationsTab = lazy(
  () => import('../components/members/profile/tabs/CommunicationsTab')
);
const NotesTab = lazy(
  () => import('../components/members/profile/tabs/NotesTab')
);
const SettingsTab = lazy(
  () => import('../components/members/profile/tabs/SettingsTab')
);

// Tab loading component
function TabLoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

// Route configuration for testing and router creation
export const routes = [
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
        element: feature('members', <Members />),
      },
      {
        path: 'members/new',
        element: feature(
          'members',
          <RoleGuard allowedRoles={['admin', 'pastor']}>
            <MemberFormEnhanced />
          </RoleGuard>
        ),
      },
      {
        path: 'members/edit/:id',
        element: feature(
          'members',
          <RoleGuard allowedRoles={['admin', 'pastor']}>
            <MemberFormEnhanced />
          </RoleGuard>
        ),
      },
      {
        path: 'members/:id',
        element: feature('members', <MemberProfile />),
        children: [
          {
            index: true,
            element: <Navigate to="overview" replace />,
          },
          {
            path: 'overview',
            element: (
              <Suspense fallback={<TabLoadingSpinner />}>
                <OverviewTab />
              </Suspense>
            ),
          },
          {
            path: 'activity',
            element: (
              <Suspense fallback={<TabLoadingSpinner />}>
                <ActivityTab />
              </Suspense>
            ),
          },
          {
            path: 'giving',
            element: feature(
              'donations',
              <Suspense fallback={<TabLoadingSpinner />}>
                <MemberGivingTab />
              </Suspense>
            ),
          },
          {
            path: 'communications',
            element: (
              <Suspense fallback={<TabLoadingSpinner />}>
                <CommunicationsTab />
              </Suspense>
            ),
          },
          {
            path: 'notes',
            element: (
              <RoleGuard allowedRoles={['admin', 'pastor']}>
                <Suspense fallback={<TabLoadingSpinner />}>
                  <NotesTab />
                </Suspense>
              </RoleGuard>
            ),
          },
          {
            path: 'settings',
            element: (
              <RoleGuard allowedRoles={['admin']}>
                <Suspense fallback={<TabLoadingSpinner />}>
                  <SettingsTab />
                </Suspense>
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'households',
        element: feature('households', <Households />),
      },
      {
        path: 'households/new',
        element: feature(
          'households',
          <RoleGuard allowedRoles={['admin', 'pastor']}>
            <CreateHousehold />
          </RoleGuard>
        ),
      },
      {
        path: 'households/:id',
        element: feature('households', <HouseholdProfile />),
      },
      {
        path: 'households/:id/edit',
        element: feature(
          'households',
          <RoleGuard allowedRoles={['admin', 'pastor']}>
            <EditHousehold />
          </RoleGuard>
        ),
      },
      {
        path: 'households/:id/members',
        element: feature(
          'households',
          <RoleGuard allowedRoles={['admin', 'pastor']}>
            <HouseholdMembers />
          </RoleGuard>
        ),
      },
      {
        path: 'events',
        element: feature('events', <Events />),
      },
      {
        path: 'calendar',
        element: feature('events', <Calendar />),
      },
      {
        path: 'events/new',
        element: feature('events', <CreateEvent />),
      },
      {
        path: 'events/:id/edit',
        element: feature('events', <EditEvent />),
      },
      // Donation management — admin only (matches Firestore write rules)
      // Pastor: /giving-overview only. Member: /my-giving only.
      {
        path: 'donations',
        element: feature(
          'donations',
          <RoleGuard allowedRoles={['admin']}>
            <Donations />
          </RoleGuard>
        ),
      },
      {
        path: 'donations/create',
        element: feature(
          'donations',
          <RoleGuard allowedRoles={['admin']}>
            <CreateDonation />
          </RoleGuard>
        ),
      },
      {
        path: 'donations/record',
        element: feature(
          'donations',
          <RoleGuard allowedRoles={['admin']}>
            <RecordDonation />
          </RoleGuard>
        ),
      },
      {
        path: 'donations/batch',
        element: feature(
          'donations',
          <RoleGuard allowedRoles={['admin']}>
            <BatchRecordDonations />
          </RoleGuard>
        ),
      },
      {
        path: 'donations/:id/edit',
        element: feature(
          'donations',
          <RoleGuard allowedRoles={['admin']}>
            <EditDonation />
          </RoleGuard>
        ),
      },
      // Legacy edit path — same policy as donations/:id/edit
      {
        path: 'donations/edit/:id',
        element: feature(
          'donations',
          <RoleGuard allowedRoles={['admin']}>
            <EditDonation />
          </RoleGuard>
        ),
      },
      {
        path: 'donations/:id',
        element: feature(
          'donations',
          <RoleGuard allowedRoles={['admin']}>
            <DonationDetail />
          </RoleGuard>
        ),
      },
      // Pastor Route - Giving Overview (aggregate only)
      {
        path: 'giving-overview',
        element: feature(
          'donations',
          <RoleGuard allowedRoles={['pastor']}>
            <GivingOverview />
          </RoleGuard>
        ),
      },
      // Member Route - My Giving
      {
        path: 'my-giving',
        element: feature(
          'donations',
          <RoleGuard allowedRoles={['member']}>
            <MyGiving />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/registration-tokens',
        element: feature(
          'registration',
          <RoleGuard allowedRoles={['admin', 'pastor']}>
            <RegistrationTokens />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/pending-registrations',
        element: feature(
          'registration',
          <RoleGuard allowedRoles={['admin', 'pastor']}>
            <PendingRegistrations />
          </RoleGuard>
        ),
      },
      {
        path: 'admin/registration-analytics',
        element: feature(
          'registration',
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
        {feature('registration', <QRRegistration />)}
      </AuthGuard>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes, {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});
