export interface BaseActivity {
  id: string;
  memberId: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  source: 'system' | 'manual' | 'import';
}

export type ActivityType = 
  | 'profile_update'
  | 'status_change'
  | 'event_attendance'
  | 'volunteer_service'
  | 'donation'
  | 'communication'
  | 'note_added'
  | 'household_change'
  | 'login'
  | 'registration';

export interface ProfileUpdateActivity extends BaseActivity {
  type: 'profile_update';
  metadata: {
    field: string;
    oldValue?: unknown;
    newValue: unknown;
    updatedBy: string;
  };
}

export interface StatusChangeActivity extends BaseActivity {
  type: 'status_change';
  metadata: {
    previousStatus: string;
    newStatus: string;
    reason?: string;
    changedBy: string;
  };
}

export interface EventAttendanceActivity extends BaseActivity {
  type: 'event_attendance';
  metadata: {
    eventId: string;
    eventName: string;
    eventDate: Date;
    attendanceStatus: 'attended' | 'absent' | 'late';
    checkedInBy?: string;
  };
}

export interface VolunteerServiceActivity extends BaseActivity {
  type: 'volunteer_service';
  metadata: {
    serviceId: string;
    serviceName: string;
    hours: number;
    role: string;
    department: string;
  };
}

export interface CommunicationActivity extends BaseActivity {
  type: 'communication';
  metadata: {
    method: 'email' | 'phone' | 'text' | 'in_person';
    subject?: string;
    initiatedBy: string;
    direction: 'incoming' | 'outgoing';
  };
}

export type MemberActivity = 
  | ProfileUpdateActivity
  | StatusChangeActivity
  | EventAttendanceActivity
  | VolunteerServiceActivity
  | CommunicationActivity
  | BaseActivity;

export interface ActivityFilter {
  types: ActivityType[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  search: string;
}

export const ACTIVITY_CONFIG: Record<ActivityType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  requiresPermission?: string[];
}> = {
  profile_update: {
    label: 'Profile Update',
    icon: '👤',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Member information was updated'
  },
  status_change: {
    label: 'Status Change',
    icon: '🔄',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Membership status was changed'
  },
  event_attendance: {
    label: 'Event Attendance',
    icon: '📅',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Attended or registered for an event'
  },
  volunteer_service: {
    label: 'Volunteer Service',
    icon: '🤝',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Volunteered for church activities'
  },
  donation: {
    label: 'Donation',
    icon: '💝',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    description: 'Made a financial contribution',
    requiresPermission: ['admin', 'pastor']
  },
  communication: {
    label: 'Communication',
    icon: '💬',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    description: 'Communication or interaction',
    requiresPermission: ['admin', 'pastor']
  },
  note_added: {
    label: 'Note Added',
    icon: '📝',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Pastoral or administrative note added',
    requiresPermission: ['admin', 'pastor']
  },
  household_change: {
    label: 'Household Change',
    icon: '🏠',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    description: 'Household membership changed'
  },
  login: {
    label: 'Login',
    icon: '🔐',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    description: 'Logged into the system'
  },
  registration: {
    label: 'Registration',
    icon: '🎯',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    description: 'Registered or joined the church'
  }
};