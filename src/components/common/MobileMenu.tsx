import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, LogOut, User, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useUnifiedAuth';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  userRole: 'admin' | 'pastor' | 'member';
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    roles: ['admin', 'pastor', 'member'],
  },
  { name: 'Members', href: '/members', roles: ['admin', 'pastor', 'member'] },
  {
    name: 'Households',
    href: '/households',
    roles: ['admin', 'pastor', 'member'],
  },
  {
    name: 'Registration',
    href: '/admin/registration-tokens',
    roles: ['admin', 'pastor'],
    submenu: [
      { name: 'QR Tokens', href: '/admin/registration-tokens' },
      { name: 'Pending Registrations', href: '/admin/pending-registrations' },
      { name: 'Analytics', href: '/admin/registration-analytics' },
    ],
  },
  { name: 'Settings', href: '/settings', roles: ['admin', 'pastor'] },
];

export function MobileMenu({ open, onClose, userRole }: MobileMenuProps) {
  const location = useLocation();
  const { member, signOut } = useAuth();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const isSubMenuActive = (submenu?: { name: string; href: string }[]) => {
    return (
      submenu?.some((subItem) => location.pathname === subItem.href) || false
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />

      {/* Menu panel */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link
              to="/dashboard"
              className="text-xl font-bold text-blue-600"
              onClick={onClose}
            >
              Shepherd
            </Link>
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member?.firstName} {member?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {member?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {visibleItems.map((item) => {
              const isActive =
                location.pathname === item.href ||
                isSubMenuActive(item.submenu);
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedItem === item.name;

              if (hasSubmenu) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() =>
                        setExpandedItem(isExpanded ? null : item.name)
                      }
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span>{item.name}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu!.map((subItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            onClick={onClose}
                            className={`block px-3 py-2 rounded-md text-sm font-medium ${
                              location.pathname === subItem.href
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              }
            })}
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 w-full px-3 py-2 text-left text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
