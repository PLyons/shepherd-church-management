import React from 'react';
import { useParams } from 'react-router-dom';
import { EventForm } from '../components/events/EventForm';
import { RoleGuard } from '../components/auth/RoleGuard';

export const EditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <RoleGuard allowedRoles={['admin', 'pastor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <EventForm eventId={id} />
        </div>
      </div>
    </RoleGuard>
  );
};