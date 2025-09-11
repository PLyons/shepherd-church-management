// src/components/common/Layout.tsx
// Main application layout component providing navigation structure and responsive design
// Wraps all pages with consistent navigation, mobile menu, and role-based UI rendering
// RELEVANT FILES: src/components/common/Navigation.tsx, src/components/common/MobileMenu.tsx, src/hooks/useUnifiedAuth.tsx, src/router/index.tsx

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
        <div className="px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
