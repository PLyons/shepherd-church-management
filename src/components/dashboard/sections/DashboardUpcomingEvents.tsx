// src/components/dashboard/sections/DashboardUpcomingEvents.tsx
// Shared upcoming events panel for admin, pastor, and member dashboards
// Lists events with date/location and role-specific badges and links
// RELEVANT FILES: src/components/dashboard/AdminDashboard.tsx, src/types/index.ts

import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ChevronRight, Users } from 'lucide-react';
import { formatEventDate } from '../dashboard-utils';
import type { Event } from '../../../types';

type BadgeVariant = 'admin' | 'pastor' | 'member';

interface DashboardUpcomingEventsProps {
  title: string;
  events: Event[];
  manageLink?: string;
  badgeVariant?: BadgeVariant;
  showRsvpInfo?: boolean;
}

function EventBadge({
  event,
  variant,
}: {
  event: Event;
  variant: BadgeVariant;
}) {
  if (variant === 'member') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Public
      </span>
    );
  }

  const isPublic = event.isPublic;
  const adminClasses = isPublic
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';
  const pastorClasses = isPublic
    ? 'bg-green-100 text-green-800'
    : 'bg-blue-100 text-blue-800';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        variant === 'admin' ? adminClasses : pastorClasses
      }`}
    >
      {variant === 'admin'
        ? isPublic
          ? 'Public'
          : 'Private'
        : isPublic
          ? 'Public'
          : 'Ministry'}
    </span>
  );
}

export function DashboardUpcomingEvents({
  title,
  events,
  manageLink = '/events',
  badgeVariant = 'admin',
  showRsvpInfo = false,
}: DashboardUpcomingEventsProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Link
          to={manageLink}
          className="text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
        >
          {badgeVariant === 'member' ? 'View all' : 'Manage all'}{' '}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      <div className="divide-y divide-gray-200">
        {events.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p>No upcoming events</p>
          </div>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {event.title}
                  </h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{formatEventDate(event.startTime)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {showRsvpInfo && (
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <Users className="w-3 h-3 mr-1" />
                      <span>12 RSVPs • 8 confirmed</span>
                    </div>
                  )}
                </div>
                <div className="ml-2">
                  <EventBadge event={event} variant={badgeVariant} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
