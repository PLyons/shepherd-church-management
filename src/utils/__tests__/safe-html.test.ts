// src/utils/__tests__/safe-html.test.ts
// Unit tests for XSS-safe plain text conversion used by member notes
// RELEVANT FILES: src/utils/safe-html.ts, src/components/members/profile/components/NotesList.tsx

import { describe, expect, it } from 'vitest';
import { noteDisplayText, toSafePlainText } from '../safe-html';

describe('toSafePlainText', () => {
  it('returns empty string for nullish input', () => {
    expect(toSafePlainText(null)).toBe('');
    expect(toSafePlainText(undefined)).toBe('');
  });

  it('strips script tags and leaves surrounding text', () => {
    const raw = 'Hello <script>alert("xss")</script> world';
    expect(toSafePlainText(raw)).toBe('Hello world');
  });

  it('strips event-handler HTML to plain text only', () => {
    const raw = '<img src=x onerror="alert(1)"><b>Care note</b>';
    expect(toSafePlainText(raw)).toBe('Care note');
  });

  it('decodes common HTML entities', () => {
    expect(toSafePlainText('Tom &amp; Jerry &lt;3')).toBe('Tom & Jerry <3');
  });
});

describe('noteDisplayText', () => {
  it('prefers plainTextContent when present', () => {
    expect(
      noteDisplayText('Safe plain', '<script>alert(1)</script>ignored')
    ).toBe('Safe plain');
  });

  it('falls back to stripped HTML when plain text is empty', () => {
    expect(noteDisplayText('  ', '<p>Pastoral visit</p>')).toBe(
      'Pastoral visit'
    );
  });
});
