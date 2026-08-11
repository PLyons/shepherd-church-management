// src/config/features.ts
// Module feature flags for Shepherd — gate events/donations without deleting code
// Exists so we can run a member+household core and re-enable modules later
// RELEVANT FILES: src/router/index.tsx, src/components/common/Navigation.tsx, docs/grok-pm/REMEDIATION_PLAN.md

/**
 * Module flags (Phase 1.1).
 * Defaults: members + households ON; events + donations OFF.
 * Override with VITE_FEATURE_<NAME>=true|false in .env (e.g. VITE_FEATURE_EVENTS=true).
 */
export type FeatureModule =
  | 'members'
  | 'households'
  | 'events'
  | 'donations'
  | 'registration';

const DEFAULTS: Record<FeatureModule, boolean> = {
  members: true,
  households: true,
  events: false,
  donations: false,
  registration: true,
};

function readEnvFlag(
  envKey: string,
  fallback: boolean
): boolean {
  const raw = import.meta.env[envKey];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'on') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'off') {
    return false;
  }
  return fallback;
}

/** Resolved module flags (defaults + optional env overrides). */
export const moduleFlags: Record<FeatureModule, boolean> = {
  members: readEnvFlag('VITE_FEATURE_MEMBERS', DEFAULTS.members),
  households: readEnvFlag('VITE_FEATURE_HOUSEHOLDS', DEFAULTS.households),
  events: readEnvFlag('VITE_FEATURE_EVENTS', DEFAULTS.events),
  donations: readEnvFlag('VITE_FEATURE_DONATIONS', DEFAULTS.donations),
  registration: readEnvFlag(
    'VITE_FEATURE_REGISTRATION',
    DEFAULTS.registration
  ),
};

export function isFeatureEnabled(module: FeatureModule): boolean {
  return moduleFlags[module] === true;
}

/** Snapshot for debugging / admin display. */
export function getFeatureFlagSnapshot(): Record<FeatureModule, boolean> {
  return { ...moduleFlags };
}

// --- Legacy backend flags (unchanged) ---

export const features = {
  useFirebase: true,
  modules: moduleFlags,
};

export const isFirebaseEnabled = () => true;

/** @deprecated Supabase removed */
export const isSupabaseEnabled = () => false;
