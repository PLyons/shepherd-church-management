import {
  Donation,
  DonationDocument,
  DonationCategory,
  DonationCategoryDocument,
} from '../../types/firestore';
import {
  timestampToString,
  stringToTimestamp,
  getCurrentTimestamp,
} from './converter-utils';

// ============================================================================
// DONATION CONVERTERS
// ============================================================================

export const donationDocumentToDonation = (
  id: string,
  doc: DonationDocument
): Donation => {
  return {
    id,
    memberId: doc.memberId,
    memberName: doc.memberName,
    amount: doc.amount,
    donationDate: timestampToString(doc.donationDate)!,
    method: doc.method,
    sourceLabel: doc.sourceLabel,
    note: doc.note,
    categoryId: doc.categoryId,
    categoryName: doc.categoryName,
    createdAt: timestampToString(doc.createdAt)!,
    createdBy: doc.createdBy,
  };
};

export const donationToDonationDocument = (
  donation: Partial<Donation>
): Partial<DonationDocument> => {
  return {
    memberId: donation.memberId,
    memberName: donation.memberName,
    amount: donation.amount,
    donationDate: stringToTimestamp(donation.donationDate),
    method: donation.method,
    sourceLabel: donation.sourceLabel,
    note: donation.note,
    categoryId: donation.categoryId,
    categoryName: donation.categoryName,
    createdAt: donation.createdAt
      ? stringToTimestamp(donation.createdAt)
      : getCurrentTimestamp(),
    createdBy: donation.createdBy,
  };
};

// ============================================================================
// DONATION CATEGORY CONVERTERS
// ============================================================================

export const donationCategoryDocumentToDonationCategory = (
  id: string,
  doc: DonationCategoryDocument
): DonationCategory => {
  return {
    id,
    name: doc.name,
    description: doc.description,
    isActive: doc.isActive,
    totalAmount: doc.totalAmount,
    donationCount: doc.donationCount,
    lastDonationDate: timestampToString(doc.lastDonationDate),
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
  };
};

export const donationCategoryToDonationCategoryDocument = (
  category: Partial<DonationCategory>
): Partial<DonationCategoryDocument> => {
  const now = getCurrentTimestamp();

  return {
    name: category.name,
    description: category.description,
    isActive: category.isActive !== undefined ? category.isActive : true,
    totalAmount: category.totalAmount || 0,
    donationCount: category.donationCount || 0,
    lastDonationDate: stringToTimestamp(category.lastDonationDate),
    createdAt: category.createdAt ? stringToTimestamp(category.createdAt) : now,
    updatedAt: now,
  };
};