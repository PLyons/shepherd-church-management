/**
 * Utility functions to convert between camelCase (TypeScript) and snake_case (Firestore)
 */

/**
 * Converts camelCase object to snake_case for Firestore
 */
export function toFirestoreFields<T extends Record<string, unknown>>(
  data: T
): Record<string, unknown> {
  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values
    if (value === undefined) continue;

    // Convert camelCase to snake_case
    const snakeKey = key.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`
    );

    // Recursively convert nested objects (except Dates and Timestamps)
    if (
      value &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      !value._seconds
    ) {
      if (Array.isArray(value)) {
        converted[snakeKey] = value.map((item) =>
          typeof item === 'object' ? toFirestoreFields(item) : item
        );
      } else {
        converted[snakeKey] = toFirestoreFields(value);
      }
    } else {
      converted[snakeKey] = value;
    }
  }

  return converted;
}

/**
 * Converts snake_case Firestore document to camelCase for TypeScript
 */
export function fromFirestoreFields<T = Record<string, unknown>>(data: Record<string, unknown>): T {
  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );

    // Recursively convert nested objects
    if (
      value &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      !(value as Record<string, unknown>)._seconds
    ) {
      if (Array.isArray(value)) {
        converted[camelKey] = value.map((item) =>
          typeof item === 'object' ? fromFirestoreFields(item) : item
        );
      } else {
        converted[camelKey] = fromFirestoreFields(value as Record<string, unknown>);
      }
    } else {
      converted[camelKey] = value;
    }
  }

  return converted as T;
}

/**
 * Explicit field mappings for special cases
 */
export const fieldMappings = {
  // TypeScript -> Firestore
  toFirestore: {
    id: 'id', // Keep as is
    memberStatus: 'member_status',
    familyName: 'family_name',
    addressLine1: 'address_line1',
    addressLine2: 'address_line2',
    postalCode: 'postal_code',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    birthDate: 'birth_date',
    anniversaryDate: 'anniversary_date',
    maritalStatus: 'marital_status',
    smsOptIn: 'sms_opt_in',

    // Array fields (these stay as is)
    emails: 'emails',
    phones: 'phones',
    addresses: 'addresses',
  },
  // Firestore -> TypeScript
  fromFirestore: {
    id: 'id', // Keep as is
    member_status: 'memberStatus',
    family_name: 'familyName',
    address_line1: 'addressLine1',
    address_line2: 'addressLine2',
    postal_code: 'postalCode',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    birth_date: 'birthDate',
    anniversary_date: 'anniversaryDate',
    marital_status: 'maritalStatus',
    sms_opt_in: 'smsOptIn',

    // Array fields
    emails: 'emails',
    phones: 'phones',
    addresses: 'addresses',
  },
};

/**
 * Enhanced deep field mapper that uses explicit mappings with fallback
 * Handles nested arrays of objects (emails, phones, addresses)
 */
export function toFirestoreFieldsDeep<T extends Record<string, unknown>>(
  data: T
): Record<string, unknown> {
  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    // Use explicit mapping or fallback to automatic snake_case conversion
    const snakeKey =
      fieldMappings.toFirestore[
        key as keyof typeof fieldMappings.toFirestore
      ] || key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

    if (Array.isArray(value)) {
      // Handle arrays of objects (emails, phones, addresses)
      converted[snakeKey] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? toFirestoreFieldsDeep(item as Record<string, unknown>)
          : item
      );
    } else if (
      value &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      !(value as Record<string, unknown>)._seconds
    ) {
      // Recursively convert nested objects
      converted[snakeKey] = toFirestoreFieldsDeep(value as Record<string, unknown>);
    } else {
      converted[snakeKey] = value;
    }
  }

  return converted;
}

/**
 * Enhanced deep field mapper from Firestore that uses explicit mappings with fallback
 * Handles nested arrays of objects (emails, phones, addresses)
 */
export function fromFirestoreFieldsDeep<T = Record<string, unknown>>(data: Record<string, unknown>): T {
  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Use explicit mapping or fallback to automatic camelCase conversion
    const camelKey =
      fieldMappings.fromFirestore[
        key as keyof typeof fieldMappings.fromFirestore
      ] || key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    if (Array.isArray(value)) {
      // Handle arrays of objects
      converted[camelKey] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? fromFirestoreFieldsDeep(item as Record<string, unknown>)
          : item
      );
    } else if (
      value &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      !(value as Record<string, unknown>)._seconds
    ) {
      // Recursively convert nested objects
      converted[camelKey] = fromFirestoreFieldsDeep(value as Record<string, unknown>);
    } else {
      converted[camelKey] = value;
    }
  }

  return converted as T;
}
