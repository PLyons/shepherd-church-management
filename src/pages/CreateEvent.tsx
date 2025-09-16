// src/pages/CreateEvent.tsx
// Event creation page with role-based access control for admins and pastors
// This file exists to provide a dedicated interface for creating new church events
// RELEVANT FILES: src/components/events/EventForm.tsx, src/pages/Events.tsx, src/pages/EditEvent.tsx, src/components/auth/RoleGuard.tsx

import React from 'react';
import { EventForm } from '../components/events/EventForm';
import { RoleGuard } from '../components/auth/RoleGuard';

export const CreateEvent: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin', 'pastor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <EventForm />
        </div>
      </div>
    </RoleGuard>
  );
};
