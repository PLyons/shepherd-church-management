import { MemberActivity, ActivityType } from '../types/activity';

export function generateMockActivities(memberId: string, count: number = 20): Omit<MemberActivity, 'id'>[] {
  const activities: Omit<MemberActivity, 'id'>[] = [];
  const now = new Date();

  const mockEvents = [
    'Sunday Morning Service',
    'Youth Group Meeting',
    'Bible Study',
    'Church Potluck',
    'Volunteer Training',
    'Prayer Meeting',
    'Community Outreach',
    'Choir Practice'
  ];

  const mockDepartments = ['Children\'s Ministry', 'Music', 'Food Service', 'Ushers', 'Technical'];
  const mockRoles = ['Volunteer', 'Team Leader', 'Assistant', 'Coordinator'];

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    const activityTypes: ActivityType[] = ['profile_update', 'status_change', 'event_attendance', 'volunteer_service', 'registration', 'login'];
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];

    let activity: Omit<MemberActivity, 'id'>;

    switch (type) {
      case 'profile_update':
        const fields = ['phone', 'email', 'address', 'emergency_contact'];
        const field = fields[Math.floor(Math.random() * fields.length)];
        activity = {
          memberId,
          type,
          title: 'Profile Updated',
          description: 'Member information was updated',
          timestamp,
          metadata: {
            field,
            oldValue: field === 'phone' ? '(555) 123-4567' : 'old@example.com',
            newValue: field === 'phone' ? '(555) 987-6543' : 'new@example.com',
            updatedBy: 'self'
          },
          source: 'system'
        };
        break;

      case 'status_change':
        const statuses = [
          { from: 'visitor', to: 'regular_attender', reason: 'Consistent attendance' },
          { from: 'regular_attender', to: 'active', reason: 'Completed membership class' },
          { from: 'participant', to: 'active', reason: 'Baptism completed' }
        ];
        const statusChange = statuses[Math.floor(Math.random() * statuses.length)];
        activity = {
          memberId,
          type,
          title: 'Membership Status Changed',
          description: `Status changed from ${statusChange.from} to ${statusChange.to}`,
          timestamp,
          metadata: {
            previousStatus: statusChange.from,
            newStatus: statusChange.to,
            reason: statusChange.reason,
            changedBy: 'admin'
          },
          source: 'system'
        };
        break;

      case 'event_attendance':
        const eventName = mockEvents[Math.floor(Math.random() * mockEvents.length)];
        activity = {
          memberId,
          type,
          title: 'Event Attendance',
          description: `Attended ${eventName}`,
          timestamp,
          metadata: {
            eventId: `event-${Math.random().toString(36).substr(2, 9)}`,
            eventName,
            eventDate: timestamp,
            attendanceStatus: 'attended' as const
          },
          source: 'system'
        };
        break;

      case 'volunteer_service':
        const department = mockDepartments[Math.floor(Math.random() * mockDepartments.length)];
        const role = mockRoles[Math.floor(Math.random() * mockRoles.length)];
        const hours = Math.floor(Math.random() * 8) + 1;
        activity = {
          memberId,
          type,
          title: 'Volunteer Service',
          description: `Served as ${role} in ${department}`,
          timestamp,
          metadata: {
            serviceId: `service-${Math.random().toString(36).substr(2, 9)}`,
            serviceName: `${department} Service`,
            hours,
            role,
            department
          },
          source: 'system'
        };
        break;

      case 'registration':
        activity = {
          memberId,
          type,
          title: 'Member Registration',
          description: 'Registered as a new member',
          timestamp,
          metadata: {
            registrationMethod: 'qr_code',
            registrationSource: 'welcome_center'
          },
          source: 'system'
        };
        break;

      case 'login':
        activity = {
          memberId,
          type,
          title: 'System Login',
          description: 'Logged into member portal',
          timestamp,
          metadata: {
            loginMethod: 'magic_link',
            deviceType: 'desktop'
          },
          source: 'system'
        };
        break;

      default:
        activity = {
          memberId,
          type,
          title: 'General Activity',
          description: 'Activity recorded',
          timestamp,
          source: 'system'
        };
    }

    activities.push(activity);
  }

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}