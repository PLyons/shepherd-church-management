export interface MemberNote {
  id: string;
  memberId: string;
  title: string;
  content: string; // Rich text HTML
  plainTextContent: string; // For search
  category: NoteCategory;
  priority: NotePriority;
  tags: string[];
  isPrivate: boolean;
  
  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: Date;
  
  // Access tracking
  lastAccessedBy?: string;
  lastAccessedAt?: Date;
  accessCount: number;
}

export type NoteCategory = 
  | 'pastoral_care'
  | 'prayer_request'
  | 'counseling'
  | 'family_situation'
  | 'health_concern'
  | 'administrative'
  | 'follow_up'
  | 'spiritual_growth'
  | 'general';

export type NotePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Communication {
  id: string;
  memberId: string;
  type: CommunicationType;
  direction: 'incoming' | 'outgoing';
  subject?: string;
  summary: string;
  fullContent?: string;
  
  // Contact details
  method: 'email' | 'phone' | 'text' | 'in_person' | 'video_call';
  contactInfo?: string; // phone number, email address
  
  // Metadata
  timestamp: Date;
  duration?: number; // in minutes
  recordedBy: string;
  recordedByName: string;
  
  // Follow-up
  requiresFollowUp: boolean;
  followUpDate?: Date;
  followUpCompleted: boolean;
}

export type CommunicationType = 
  | 'pastoral_call'
  | 'counseling_session'
  | 'prayer_support'
  | 'administrative'
  | 'emergency'
  | 'routine_check_in'
  | 'event_coordination'
  | 'volunteer_coordination';

export interface NoteFilter {
  categories: NoteCategory[];
  priorities: NotePriority[];
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  search: string;
  createdBy: string[];
}

export const NOTE_CONFIG: Record<NoteCategory, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  pastoral_care: {
    label: 'Pastoral Care',
    icon: '❤️',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'General pastoral care and support'
  },
  prayer_request: {
    label: 'Prayer Request',
    icon: '🙏',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Prayer requests and spiritual support'
  },
  counseling: {
    label: 'Counseling',
    icon: '💬',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Counseling sessions and guidance'
  },
  family_situation: {
    label: 'Family Situation',
    icon: '👨‍👩‍👧‍👦',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Family dynamics and situations'
  },
  health_concern: {
    label: 'Health Concern',
    icon: '🏥',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    description: 'Health issues and medical support'
  },
  administrative: {
    label: 'Administrative',
    icon: '📋',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Administrative notes and records'
  },
  follow_up: {
    label: 'Follow-up',
    icon: '📅',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Follow-up actions and reminders'
  },
  spiritual_growth: {
    label: 'Spiritual Growth',
    icon: '✨',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    description: 'Spiritual development and growth'
  },
  general: {
    label: 'General',
    icon: '📝',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    description: 'General notes and observations'
  }
};

export const PRIORITY_CONFIG: Record<NotePriority, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  low: {
    label: 'Low',
    icon: '🔵',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  normal: {
    label: 'Normal',
    icon: '⚪',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  high: {
    label: 'High',
    icon: '🟡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  urgent: {
    label: 'Urgent',
    icon: '🔴',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
};