import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useUnifiedAuth';

interface NavigationProps {
  onMobileMenuToggle: () => void;
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
  { name: 'Registration', href: '/admin/registration-tokens', roles: ['admin', 'pastor'] },
  { name: 'Settings', href: '/settings', roles: ['admin', 'pastor'] },
];

export function Navigation({ onMobileMenuToggle, userRole }: NavigationProps) {
  const location = useLocation();
  const { member, signOut } = useAuth();

  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600">
                Shepherd
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center">
            {/* User info */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span>
                  {member?.firstName} {member?.lastName}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
                  {member?.role}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                onClick={onMobileMenuToggle}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
