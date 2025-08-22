import { Edit, MoreVertical, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Member } from '../../../types';
import Tooltip from '../../common/Tooltip';
import { EnhancedDropdown, DropdownItem } from '../../common/Dropdown';

interface MemberProfileHeaderProps {
  member: Member;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MemberProfileHeader({
  member,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: MemberProfileHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'visitor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'pastor':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        {/* Back button */}
        <Tooltip content="Back to Members">
          <Link
            to="/members"
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Tooltip>
        
        {/* Member name and badges */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {member.firstName} {member.lastName}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status badge */}
            <span 
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.memberStatus || 'active')}`}
            >
              {member.memberStatus || 'active'}
            </span>
            {/* Role badge */}
            <span 
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role || 'member')}`}
            >
              {member.role || 'member'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 sm:flex-shrink-0">
        {/* Edit button */}
        {canEdit && (
          <Tooltip content="Edit Profile">
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Edit className="h-5 w-5" />
            </button>
          </Tooltip>
        )}
        
        {/* Actions dropdown */}
        <EnhancedDropdown
          trigger={
            <Tooltip content="More Actions">
              <div className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer">
                <MoreVertical className="h-5 w-5" />
              </div>
            </Tooltip>
          }
        >
          {canDelete && (
            <DropdownItem onClick={onDelete} className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Member
            </DropdownItem>
          )}
          
          {/* Future actions - disabled for now */}
          <DropdownItem disabled>
            Merge Profiles
          </DropdownItem>
          <DropdownItem disabled>
            Export Data
          </DropdownItem>
          <DropdownItem disabled>
            View History
          </DropdownItem>
        </EnhancedDropdown>
      </div>
    </div>
  );
}