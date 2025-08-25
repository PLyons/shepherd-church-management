import { Sermon, SermonDocument } from '../../types/firestore';
import {
  timestampToString,
  stringToTimestamp,
  getCurrentTimestamp,
} from './converter-utils';

// ============================================================================
// SERMON CONVERTERS
// ============================================================================

export const sermonDocumentToSermon = (
  id: string,
  doc: SermonDocument
): Sermon => {
  return {
    id,
    title: doc.title,
    speakerName: doc.speakerName,
    datePreached: timestampToString(doc.datePreached)!,
    notes: doc.notes,
    scriptureReferences: doc.scriptureReferences,
    mediaFiles: doc.mediaFiles,
    createdBy: doc.createdBy,
    createdByName: doc.createdByName,
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
    searchTerms: doc.searchTerms,
  };
};

export const sermonToSermonDocument = (
  sermon: Partial<Sermon>
): Partial<SermonDocument> => {
  const now = getCurrentTimestamp();

  return {
    title: sermon.title,
    speakerName: sermon.speakerName,
    datePreached: stringToTimestamp(sermon.datePreached),
    notes: sermon.notes,
    scriptureReferences: sermon.scriptureReferences,
    mediaFiles: sermon.mediaFiles || {},
    createdBy: sermon.createdBy,
    createdByName: sermon.createdByName,
    createdAt: sermon.createdAt ? stringToTimestamp(sermon.createdAt) : now,
    updatedAt: now,
    searchTerms: sermon.searchTerms || [],
  };
};