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