// src/components/dashboard/QuickActions.tsx
// Quick action link grid for dashboard role-based shortcuts
// Renders filtered quick actions with icon mapping and optional admin donation links
// RELEVANT FILES: src/components/dashboard/AdminDashboard.tsx, src/services/firebase/dashboard.service.ts

import { Link } from 'react-router-dom';
import {
  Plus,
  UserPlus,
  DollarSign,
  Shield,
  Users,
  Calendar,
  Heart,
  User,
  BarChart3,
  Settings,
} from 'lucide-react';
import type { QuickAction } from '../../services/firebase/dashboard.service';

interface QuickActionsProps {
  title: string;
  actions: QuickAction[];
  gridCols?: 3 | 4;
  testId?: string;
  showDonationExtras?: boolean;
}

function QuickActionIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'plus':
      return <Plus className="w-5 h-5" />;
    case 'user-plus':
      return <UserPlus className="w-5 h-5" />;
    case 'dollar-sign':
      return <DollarSign className="w-5 h-5" />;
    case 'shield':
      return <Shield className="w-5 h-5" />;
    case 'user':
      return <User className="w-5 h-5" />;
    case 'calendar':
      return <Calendar className="w-5 h-5" />;
    case 'heart':
      return <Heart className="w-5 h-5" />;
    default:
      return <Plus className="w-5 h-5" />;
  }
}

export function QuickActions({
  title,
  actions,
  gridCols = 4,
  testId,
  showDonationExtras = false,
}: QuickActionsProps) {
  const colsClass = gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div
      data-testid={testId}
      className="bg-white rounded-lg shadow p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className={`grid ${colsClass} gap-4`}>
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.route}
            className={`flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
              action.id === 'manage-roles' ? 'border-red-200 bg-red-50' : ''
            }`}
          >
            <div className={`w-5 h-5 mr-3 text-${action.color}-600`}>
              <QuickActionIcon icon={action.icon} />
            </div>
            <div>
              <span className="font-medium text-gray-900 block">
                {action.title}
              </span>
              <span className="text-sm text-gray-500">{action.description}</span>
            </div>
          </Link>
        ))}

        {showDonationExtras && (
          <>
            <Link
              to="/donations/record"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-5 h-5 mr-3 text-green-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="font-medium text-gray-900 block">
                  Record Donation
                </span>
                <span className="text-sm text-gray-500">Add new donation</span>
              </div>
            </Link>
            <Link
              to="/donations"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-5 h-5 mr-3 text-blue-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-medium text-gray-900 block">
                  Financial Reports
                </span>
                <span className="text-sm text-gray-500">View analytics</span>
              </div>
            </Link>
            <Link
              to="/donations"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-5 h-5 mr-3 text-purple-600">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <span className="font-medium text-gray-900 block">
                  Donations Hub
                </span>
                <span className="text-sm text-gray-500">
                  Manage donations &amp; statements
                </span>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
