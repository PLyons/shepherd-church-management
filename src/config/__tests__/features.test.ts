// src/config/__tests__/features.test.ts
// Unit tests for Phase 1.1 module feature flag defaults
// RELEVANT FILES: src/config/features.ts, docs/grok-pm/REMEDIATION_PLAN.md

import { describe, expect, it } from 'vitest';
import {
  getFeatureFlagSnapshot,
  isFeatureEnabled,
  moduleFlags,
} from '../features';

describe('Phase 1.1 module feature flags', () => {
  it('enables members and households by default', () => {
    expect(moduleFlags.members).toBe(true);
    expect(moduleFlags.households).toBe(true);
    expect(isFeatureEnabled('members')).toBe(true);
    expect(isFeatureEnabled('households')).toBe(true);
  });

  it('disables events and donations by default', () => {
    expect(moduleFlags.events).toBe(false);
    expect(moduleFlags.donations).toBe(false);
    expect(isFeatureEnabled('events')).toBe(false);
    expect(isFeatureEnabled('donations')).toBe(false);
  });

  it('keeps registration available by default (member onboarding)', () => {
    expect(moduleFlags.registration).toBe(true);
    expect(isFeatureEnabled('registration')).toBe(true);
  });

  it('exposes a full snapshot of all modules', () => {
    const snapshot = getFeatureFlagSnapshot();
    expect(Object.keys(snapshot).sort()).toEqual(
      ['donations', 'events', 'households', 'members', 'registration'].sort()
    );
  });
});
