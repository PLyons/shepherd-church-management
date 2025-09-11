// src/utils/converters/household-converters.ts
// Type-safe converters for transforming between Household TypeScript types and Firestore document schemas
// This file exists to handle Timestamp conversions and field mapping for household data persistence
// RELEVANT FILES: src/types/firestore.ts, src/types/index.ts, src/utils/converters/converter-utils.ts, src/services/firebase/households.service.ts

import { Household, HouseholdDocument } from '../../types/firestore';
import {
  timestampToString,
  stringToTimestamp,
  getCurrentTimestamp,
  removeUndefined,
} from './converter-utils';

export const householdDocumentToHousehold = (
  id: string,
  doc: HouseholdDocument
): Household => {
  console.log('Converting document to household:', id, doc);

  const createdAtString = timestampToString(doc.createdAt);
  const updatedAtString = timestampToString(doc.updatedAt);

  if (!createdAtString || !updatedAtString) {
    console.error('Missing required timestamps in household document:', {
      id,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  const result = {
    id,
    familyName: doc.familyName,
    normalizedName: doc.normalizedName,
    status: doc.status,
    createdBy: doc.createdBy,
    address: doc.address,
    primaryContactId: doc.primaryContactId,
    primaryContactName: doc.primaryContactName,
    memberIds: doc.memberIds,
    memberCount: doc.memberCount,
    createdAt: createdAtString || new Date().toISOString(),
    updatedAt: updatedAtString || new Date().toISOString(),
  };
  console.log('Converted to household:', result);
  return result;
};

export const householdToHouseholdDocument = (
  household: Partial<Household>
): Partial<HouseholdDocument> => {
  console.log('Converting household to document:', household);
  const now = getCurrentTimestamp();

  const result = removeUndefined({
    familyName: household.familyName,
    normalizedName: household.normalizedName,
    status: household.status,
    createdBy: household.createdBy,
    address: household.address || {},
    primaryContactId: household.primaryContactId,
    primaryContactName: household.primaryContactName,
    memberIds: household.memberIds || [],
    memberCount: household.memberCount || 0,
    createdAt: household.createdAt
      ? stringToTimestamp(household.createdAt)
      : now,
    updatedAt: now,
  });
  console.log('Converted household document:', result);
  return result;
};