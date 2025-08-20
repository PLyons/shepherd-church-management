import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { MobileMenu } from './MobileMenu';
import { useAuth } from '../../hooks/useUnifiedAuth';

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { member } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
        userRole={member?.role || 'member'}
      />

      {/* Mobile menu */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        userRole={member?.role || 'member'}
      />

      {/* Main content */}
      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
