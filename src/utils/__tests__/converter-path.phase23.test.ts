/**
 * Phase 2.3 — Single converter path guard
 *
 * PURPOSE: App/services must not import quarantined mappers
 * RELEVANT FILES: src/utils/firestore-converters.ts, src/utils/_quarantine/README.md
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC_ROOT = join(process.cwd(), 'src');
const QUARANTINE_MARKERS = [
  'utils/_quarantine',
  'firestore-field-mapper',
  'legacy-event-converters',
  'content-converters',
  'volunteer-converters',
];

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === '_quarantine' || name === 'node_modules') continue;
      walkTsFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(name) && !name.includes('.test.')) {
      out.push(full);
    }
  }
  return out;
}

describe('Converter path quarantine (Phase 2.3)', () => {
  it('does not import quarantined mappers from active src', () => {
    const files = walkTsFiles(SRC_ROOT);
    const offenders: string[] = [];

    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      // Only flag import/require lines
      const importLines = text
        .split('\n')
        .filter((line) => /^\s*(import|export).*from\s+['"]/.test(line));
      for (const line of importLines) {
        if (QUARANTINE_MARKERS.some((m) => line.includes(m))) {
          offenders.push(`${relative(SRC_ROOT, file)}: ${line.trim()}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('exports active event converters from firestore-converters', async () => {
    const converters = await import('../firestore-converters');
    expect(typeof converters.eventDocumentToEvent).toBe('function');
    expect(typeof converters.eventToEventDocument).toBe('function');
    expect(typeof converters.memberDocumentToMember).toBe('function');
    expect(typeof converters.donationDocumentToDonation).toBe('function');
  });
});
