import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useUnifiedAuth';
import { 
  User, 
  Activity, 
  MessageSquare, 
  FileText, 
  Settings,
  type LucideIcon 
} from 'lucide-react';

interface TabConfig {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  requiresRole?: string[];
}

const tabs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: 'overview',
    icon: User
  },
  {
    id: 'activity',
    label: 'Activity',
    path: 'activity',
    icon: Activity
  },
  {
    id: 'communications',
    label: 'Communications',
    path: 'communications',
    icon: MessageSquare
  },
  {
    id: 'notes',
    label: 'Notes',
    path: 'notes',
    icon: FileText,
    requiresRole: ['admin', 'pastor']
  },
  {
    id: 'settings',
    label: 'Settings',
    path: 'settings',
    icon: Settings,
    requiresRole: ['admin']
  }
];

interface MemberProfileTabsProps {
  memberId: string;
}

export default function MemberProfileTabs({ memberId }: MemberProfileTabsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { member: currentMember } = useAuth();

  const visibleTabs = tabs.filter(tab => {
    if (!tab.requiresRole) return true;
    return tab.requiresRole.includes(currentMember?.role || '');
  });

  const activeTab = location.pathname.split('/').pop() || 'overview';

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const currentIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
      const newIndex = event.key === 'ArrowLeft' 
        ? Math.max(0, currentIndex - 1)
        : Math.min(visibleTabs.length - 1, currentIndex + 1);
      
      navigate(`/members/${memberId}/${visibleTabs[newIndex].path}`);
    }
  };

  return (
    <div className="border-b border-gray-200 overflow-hidden">
      <nav 
        className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide min-w-full"
        onKeyDown={handleKeyDown}
        role="tablist"
        aria-label="Member profile sections"
      >
        {visibleTabs.map(tab => {
          const TabIcon = tab.icon;
          return (
            <NavLink
              key={tab.id}
              to={`/members/${memberId}/${tab.path}`}
              className={({ isActive }) => 
                `group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
              role="tab"
            >
              <TabIcon className="w-4 h-4 mr-2" />
              {tab.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}