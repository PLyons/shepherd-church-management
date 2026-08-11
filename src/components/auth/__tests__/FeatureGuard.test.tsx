// src/components/auth/__tests__/FeatureGuard.test.tsx
// Tests FeatureGuard redirects when a module flag is off
// RELEVANT FILES: src/components/auth/FeatureGuard.tsx, src/config/features.ts

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FeatureGuard } from '../FeatureGuard';

vi.mock('../../../config/features', () => ({
  isFeatureEnabled: vi.fn(),
}));

import { isFeatureEnabled } from '../../../config/features';

const mockIsFeatureEnabled = vi.mocked(isFeatureEnabled);

function renderWithGuard(enabled: boolean) {
  mockIsFeatureEnabled.mockReturnValue(enabled);

  return render(
    <MemoryRouter initialEntries={['/events']}>
      <Routes>
        <Route
          path="/events"
          element={
            <FeatureGuard module="events">
              <div data-testid="events-page">Events</div>
            </FeatureGuard>
          }
        />
        <Route
          path="/dashboard"
          element={<div data-testid="dashboard-page">Dashboard</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('FeatureGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when the feature is enabled', () => {
    renderWithGuard(true);
    expect(screen.getByTestId('events-page')).toBeInTheDocument();
  });

  it('redirects to dashboard when the feature is disabled', () => {
    renderWithGuard(false);
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.queryByTestId('events-page')).not.toBeInTheDocument();
  });
});
