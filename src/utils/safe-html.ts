// src/utils/safe-html.ts
// Converts untrusted HTML/strings into safe plain text for React display
// Exists to prevent XSS from notes and other user-authored HTML fields
// RELEVANT FILES: src/components/members/profile/components/NotesList.tsx, src/types/notes.ts

/**
 * Strip HTML tags and decode common entities for safe text display.
 * Prefer stored plainTextContent when available; use this as a fallback.
 */
export function toSafePlainText(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prefer plain text; fall back to stripping HTML from rich content.
 */
export function noteDisplayText(
  plainTextContent: string | null | undefined,
  htmlContent: string | null | undefined
): string {
  const plain = (plainTextContent || '').trim();
  if (plain) {
    return plain;
  }
  return toSafePlainText(htmlContent);
}
