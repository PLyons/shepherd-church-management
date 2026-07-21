/**
 * __tests__/security/member-role-lock.rules.test.ts
 * Phase 0.1 — verifies members cannot escalate role via self-update.
 * Pastors cannot assign roles; only admins can.
 * RELEVANT FILES: firestore.rules, docs/grok-pm/REMEDIATION_PLAN.md
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const PROJECT_ID = 'test-member-role-lock';

const IDS = {
  admin: 'uid-admin',
  pastor: 'uid-pastor',
  member: 'uid-member',
} as const;

function memberDoc(
  id: string,
  role: 'admin' | 'pastor' | 'member',
  overrides: Record<string, unknown> = {}
) {
  return {
    id,
    firstName: 'Test',
    lastName: 'User',
    role,
    memberStatus: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

describe('Phase 0.1 — member role privilege lock', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
        host: 'localhost',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();

    // Seed with admin privileges so setup is not blocked by rules
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'members', IDS.admin), memberDoc(IDS.admin, 'admin'));
      await setDoc(doc(db, 'members', IDS.pastor), memberDoc(IDS.pastor, 'pastor'));
      await setDoc(doc(db, 'members', IDS.member), memberDoc(IDS.member, 'member'));
    });
  });

  it('denies a member escalating their own role to admin', async () => {
    const db = testEnv.authenticatedContext(IDS.member).firestore();
    await assertFails(
      updateDoc(doc(db, 'members', IDS.member), { role: 'admin' })
    );
  });

  it('denies a member escalating their own role to pastor', async () => {
    const db = testEnv.authenticatedContext(IDS.member).firestore();
    await assertFails(
      updateDoc(doc(db, 'members', IDS.member), { role: 'pastor' })
    );
  });

  it('denies a member changing their own memberStatus', async () => {
    const db = testEnv.authenticatedContext(IDS.member).firestore();
    await assertFails(
      updateDoc(doc(db, 'members', IDS.member), {
        memberStatus: 'inactive',
      })
    );
  });

  it('allows a member to update safe profile fields', async () => {
    const db = testEnv.authenticatedContext(IDS.member).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'members', IDS.member), {
        firstName: 'Updated',
        lastName: 'Name',
      })
    );
  });

  it('denies a pastor changing another member role', async () => {
    const db = testEnv.authenticatedContext(IDS.pastor).firestore();
    await assertFails(
      updateDoc(doc(db, 'members', IDS.member), { role: 'admin' })
    );
  });

  it('allows a pastor to update another member status (role unchanged)', async () => {
    const db = testEnv.authenticatedContext(IDS.pastor).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'members', IDS.member), {
        memberStatus: 'visitor',
      })
    );
  });

  it('allows an admin to assign a member role', async () => {
    const db = testEnv.authenticatedContext(IDS.admin).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'members', IDS.member), { role: 'pastor' })
    );
  });
});
