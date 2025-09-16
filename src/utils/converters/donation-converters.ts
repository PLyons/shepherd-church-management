// src/utils/converters/donation-converters.ts
// Type-safe converters for Donation and DonationCategory models to/from Firestore document format
// Handles bidirectional transformation for financial data with decimal precision and Form 990 compliance fields
// RELEVANT FILES: src/types/donations.ts, src/utils/converters/converter-utils.ts, src/services/firebase/donations.service.ts, src/services/firebase/donation-categories.service.ts

import {
  Donation,
  DonationDocument,
  DonationCategory,
  DonationCategoryDocument,
} from '../../types/donations';
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
    form990Fields: doc.form990Fields,
    receiptNumber: doc.receiptNumber,
    isReceiptSent: doc.isReceiptSent,
    receiptSentAt: timestampToString(doc.receiptSentAt),
    isTaxDeductible: doc.isTaxDeductible,
    taxYear: doc.taxYear,
    createdAt: timestampToString(doc.createdAt)!,
    createdBy: doc.createdBy,
    updatedAt: timestampToString(doc.updatedAt)!,
    updatedBy: doc.updatedBy,
    status: doc.status,
    verifiedBy: doc.verifiedBy,
    verifiedAt: timestampToString(doc.verifiedAt),
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
    form990Fields: donation.form990Fields,
    receiptNumber: donation.receiptNumber,
    isReceiptSent: donation.isReceiptSent,
    receiptSentAt: stringToTimestamp(donation.receiptSentAt),
    isTaxDeductible: donation.isTaxDeductible,
    taxYear: donation.taxYear,
    createdAt: donation.createdAt
      ? stringToTimestamp(donation.createdAt)
      : getCurrentTimestamp(),
    createdBy: donation.createdBy,
    updatedAt: donation.updatedAt
      ? stringToTimestamp(donation.updatedAt)
      : getCurrentTimestamp(),
    updatedBy: donation.updatedBy,
    status: donation.status,
    verifiedBy: donation.verifiedBy,
    verifiedAt: stringToTimestamp(donation.verifiedAt),
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
    defaultForm990LineItem: doc.defaultForm990LineItem,
    isTaxDeductible: doc.isTaxDeductible,
    annualGoal: doc.annualGoal,
    currentYearTotal: doc.currentYearTotal,
    lastYearTotal: doc.lastYearTotal,
    totalAmount: doc.totalAmount,
    donationCount: doc.donationCount,
    lastDonationDate: timestampToString(doc.lastDonationDate),
    averageDonation: doc.averageDonation,
    includeInReports: doc.includeInReports,
    reportingCategory: doc.reportingCategory,
    displayOrder: doc.displayOrder,
    createdAt: timestampToString(doc.createdAt)!,
    updatedAt: timestampToString(doc.updatedAt)!,
    createdBy: doc.createdBy,
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
    defaultForm990LineItem: category.defaultForm990LineItem,
    isTaxDeductible: category.isTaxDeductible,
    annualGoal: category.annualGoal,
    currentYearTotal: category.currentYearTotal || 0,
    lastYearTotal: category.lastYearTotal || 0,
    totalAmount: category.totalAmount || 0,
    donationCount: category.donationCount || 0,
    lastDonationDate: stringToTimestamp(category.lastDonationDate),
    averageDonation: category.averageDonation || 0,
    includeInReports:
      category.includeInReports !== undefined
        ? category.includeInReports
        : true,
    reportingCategory: category.reportingCategory,
    displayOrder: category.displayOrder || 0,
    createdAt: category.createdAt ? stringToTimestamp(category.createdAt) : now,
    updatedAt: now,
    createdBy: category.createdBy,
  };
};
