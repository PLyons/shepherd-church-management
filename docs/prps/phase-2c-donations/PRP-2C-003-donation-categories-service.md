# PRP-2C-003: Donation Categories Service

> **Phase**: 2C - Donation Management  
> **Category**: Backend Service  
> **Priority**: High  
> **Estimated Time**: 3-4 hours  
> **Created**: 2025-01-09  
> **Status**: Ready for Implementation

## Purpose

Create a comprehensive Firebase service for managing donation categories with CRUD operations, statistics tracking, and default category initialization. This service will support category-based donation reporting and provide usage analytics for financial insights.

## Requirements

### Dependencies
- ✅ PRP-2C-001: Donation Data Model & Types - Required for DonationCategory interface
- ✅ PRP-2C-002: Donations Firebase Service - Required for donation aggregation queries

### Technical Requirements
- TypeScript service extending BaseFirestoreService pattern
- Category CRUD operations with validation
- Statistics computation and real-time updates
- Default categories initialization
- Category usage tracking and reporting
- Role-based access control (admin/pastor read/write, member read-only)

## Procedure

### Step 1: Create Donation Categories Service
Create `src/services/firebase/donation-categories.service.ts`:

```typescript
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DonationCategory, DonationCategoryDocument } from '../../types/donations';
import { BaseFirestoreService } from './base.service';

export class DonationCategoriesService extends BaseFirestoreService {
  private collectionName = 'donation-categories';

  // Default categories to initialize on first setup
  private defaultCategories: Omit<DonationCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Tithes',
      description: 'Regular tithe giving (10% of income)',
      isActive: true,
      color: '#10B981', // Green
      displayOrder: 1,
      totalAmount: 0,
      donationCount: 0,
      lastDonationDate: null
    },
    {
      name: 'Offerings',
      description: 'General offerings and freewill gifts',
      isActive: true,
      color: '#3B82F6', // Blue
      displayOrder: 2,
      totalAmount: 0,
      donationCount: 0,
      lastDonationDate: null
    },
    {
      name: 'Building Fund',
      description: 'Contributions toward church building and facilities',
      isActive: true,
      color: '#F59E0B', // Amber
      displayOrder: 3,
      totalAmount: 0,
      donationCount: 0,
      lastDonationDate: null
    },
    {
      name: 'Special Events',
      description: 'Event-specific fundraising and special collections',
      isActive: true,
      color: '#EF4444', // Red
      displayOrder: 4,
      totalAmount: 0,
      donationCount: 0,
      lastDonationDate: null
    },
    {
      name: 'Missions',
      description: 'Missionary support and outreach programs',
      isActive: true,
      color: '#8B5CF6', // Purple
      displayOrder: 5,
      totalAmount: 0,
      donationCount: 0,
      lastDonationDate: null
    }
  ];

  /**
   * Get all donation categories
   */
  async getCategories(): Promise<DonationCategory[]> {
    try {
      const categoriesQuery = query(
        collection(db, this.collectionName),
        orderBy('displayOrder', 'asc')
      );
      
      const querySnapshot = await getDocs(categoriesQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DonationCategory));
    } catch (error) {
      this.handleError('Failed to fetch donation categories', error);
      throw error;
    }
  }

  /**
   * Get active donation categories only
   */
  async getActiveCategories(): Promise<DonationCategory[]> {
    try {
      const categoriesQuery = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('displayOrder', 'asc')
      );
      
      const querySnapshot = await getDocs(categoriesQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DonationCategory));
    } catch (error) {
      this.handleError('Failed to fetch active donation categories', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string): Promise<DonationCategory | null> {
    try {
      const docRef = doc(db, this.collectionName, categoryId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as DonationCategory;
      }
      
      return null;
    } catch (error) {
      this.handleError('Failed to fetch donation category', error);
      throw error;
    }
  }

  /**
   * Create a new donation category
   */
  async createCategory(
    categoryData: Omit<DonationCategory, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount' | 'donationCount' | 'lastDonationDate'>
  ): Promise<DonationCategory> {
    try {
      const now = Timestamp.now();
      
      const newCategory: DonationCategoryDocument = {
        ...categoryData,
        totalAmount: 0,
        donationCount: 0,
        lastDonationDate: null,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.collectionName), newCategory);
      
      return {
        id: docRef.id,
        ...newCategory
      } as DonationCategory;
    } catch (error) {
      this.handleError('Failed to create donation category', error);
      throw error;
    }
  }

  /**
   * Update donation category
   */
  async updateCategory(
    categoryId: string,
    updates: Partial<Omit<DonationCategory, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount' | 'donationCount' | 'lastDonationDate'>>
  ): Promise<DonationCategory> {
    try {
      const docRef = doc(db, this.collectionName, categoryId);
      
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      
      if (!updatedDoc.exists()) {
        throw new Error('Category not found after update');
      }
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as DonationCategory;
    } catch (error) {
      this.handleError('Failed to update donation category', error);
      throw error;
    }
  }

  /**
   * Delete donation category (soft delete by setting isActive to false)
   */
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      // Check if category has associated donations
      const hasAssociatedDonations = await this.categoryHasDonations(categoryId);
      
      if (hasAssociatedDonations) {
        // Soft delete - mark as inactive instead of hard delete
        await this.updateCategory(categoryId, { isActive: false });
      } else {
        // Hard delete if no associated donations
        const docRef = doc(db, this.collectionName, categoryId);
        await deleteDoc(docRef);
      }
    } catch (error) {
      this.handleError('Failed to delete donation category', error);
      throw error;
    }
  }

  /**
   * Update category statistics when donations are added/modified
   */
  async updateCategoryStatistics(categoryId: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        // Get all donations for this category
        const donationsQuery = query(
          collection(db, 'donations'),
          where('categoryId', '==', categoryId)
        );
        
        const donationsSnapshot = await getDocs(donationsQuery);
        
        let totalAmount = 0;
        let donationCount = 0;
        let lastDonationDate: Timestamp | null = null;
        
        donationsSnapshot.docs.forEach(donationDoc => {
          const donation = donationDoc.data();
          totalAmount += donation.amount;
          donationCount++;
          
          if (!lastDonationDate || donation.date > lastDonationDate) {
            lastDonationDate = donation.date;
          }
        });
        
        // Update category statistics
        const categoryRef = doc(db, this.collectionName, categoryId);
        transaction.update(categoryRef, {
          totalAmount,
          donationCount,
          lastDonationDate,
          updatedAt: Timestamp.now()
        });
      });
    } catch (error) {
      this.handleError('Failed to update category statistics', error);
      throw error;
    }
  }

  /**
   * Initialize default categories if none exist
   */
  async initializeDefaultCategories(): Promise<void> {
    try {
      // Check if categories already exist
      const existingCategories = await this.getCategories();
      
      if (existingCategories.length === 0) {
        const batch = writeBatch(db);
        
        this.defaultCategories.forEach(category => {
          const categoryRef = doc(collection(db, this.collectionName));
          const categoryDocument: DonationCategoryDocument = {
            ...category,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };
          
          batch.set(categoryRef, categoryDocument);
        });
        
        await batch.commit();
        console.log('Default donation categories initialized');
      }
    } catch (error) {
      this.handleError('Failed to initialize default categories', error);
      throw error;
    }
  }

  /**
   * Get category usage statistics
   */
  async getCategoryStatistics(): Promise<{
    totalCategories: number;
    activeCategories: number;
    totalDonationsAcrossCategories: number;
    totalAmountAcrossCategories: number;
    mostUsedCategory: { name: string; donationCount: number } | null;
    highestEarningCategory: { name: string; totalAmount: number } | null;
  }> {
    try {
      const categories = await this.getCategories();
      
      const totalCategories = categories.length;
      const activeCategories = categories.filter(cat => cat.isActive).length;
      
      const totalDonationsAcrossCategories = categories.reduce(
        (sum, cat) => sum + cat.donationCount,
        0
      );
      
      const totalAmountAcrossCategories = categories.reduce(
        (sum, cat) => sum + cat.totalAmount,
        0
      );
      
      const mostUsedCategory = categories.reduce((prev, current) =>
        (current.donationCount > (prev?.donationCount || 0)) ? current : prev
      , null as DonationCategory | null);
      
      const highestEarningCategory = categories.reduce((prev, current) =>
        (current.totalAmount > (prev?.totalAmount || 0)) ? current : prev
      , null as DonationCategory | null);
      
      return {
        totalCategories,
        activeCategories,
        totalDonationsAcrossCategories,
        totalAmountAcrossCategories,
        mostUsedCategory: mostUsedCategory ? {
          name: mostUsedCategory.name,
          donationCount: mostUsedCategory.donationCount
        } : null,
        highestEarningCategory: highestEarningCategory ? {
          name: highestEarningCategory.name,
          totalAmount: highestEarningCategory.totalAmount
        } : null
      };
    } catch (error) {
      this.handleError('Failed to get category statistics', error);
      throw error;
    }
  }

  /**
   * Reorder categories by updating display order
   */
  async reorderCategories(categoryOrders: { id: string; displayOrder: number }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      categoryOrders.forEach(({ id, displayOrder }) => {
        const categoryRef = doc(db, this.collectionName, id);
        batch.update(categoryRef, {
          displayOrder,
          updatedAt: Timestamp.now()
        });
      });
      
      await batch.commit();
    } catch (error) {
      this.handleError('Failed to reorder categories', error);
      throw error;
    }
  }

  /**
   * Check if category has associated donations
   */
  private async categoryHasDonations(categoryId: string): Promise<boolean> {
    try {
      const donationsQuery = query(
        collection(db, 'donations'),
        where('categoryId', '==', categoryId)
      );
      
      const querySnapshot = await getDocs(donationsQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking category donations:', error);
      return false;
    }
  }
}

export const donationCategoriesService = new DonationCategoriesService();
```

### Step 2: Update Service Index
Add to `src/services/index.ts`:

```typescript
export { donationCategoriesService } from './firebase/donation-categories.service';
export type { DonationCategoriesService } from './firebase/donation-categories.service';
```

### Step 3: Create Category Initialization Hook
Create `src/hooks/useInitializeCategories.ts`:

```typescript
import { useEffect, useState } from 'react';
import { donationCategoriesService } from '../services';

export const useInitializeCategories = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeCategories = async () => {
      try {
        setIsLoading(true);
        await donationCategoriesService.initializeDefaultCategories();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize categories');
      } finally {
        setIsLoading(false);
      }
    };

    initializeCategories();
  }, []);

  return { isInitialized, isLoading, error };
};
```

### Step 4: Update Firebase Security Rules
Add to `firestore.rules`:

```javascript
// Donation Categories Rules
match /donation-categories/{categoryId} {
  // Admin and pastor can read/write all categories
  allow read, write: if hasRole(['admin', 'pastor']);
  
  // Members can only read active categories
  allow read: if hasRole(['member']) && resource.data.isActive == true;
}
```

### Step 5: Integration with Donations Service
Update donations service to trigger category statistics updates:

```typescript
// In donations.service.ts, add after creating/updating donations:
await donationCategoriesService.updateCategoryStatistics(donation.categoryId);
```

### Step 6: Test Service Implementation
Create test scenarios:
1. Initialize default categories
2. Create/update/delete custom categories
3. Verify statistics updates with sample donations
4. Test role-based access control
5. Verify category reordering functionality

## Validation Criteria

### Core Functionality
- ✅ Service extends BaseFirestoreService with proper error handling
- ✅ CRUD operations for donation categories work correctly
- ✅ Default categories initialize on first setup
- ✅ Statistics update automatically when donations change
- ✅ Category usage tracking and reporting functions properly

### Data Integrity
- ✅ Soft delete prevents data loss when categories have associated donations
- ✅ Transaction-based statistics updates ensure consistency
- ✅ Category reordering maintains proper display order
- ✅ Color and display properties support UI requirements

### Security & Access Control
- ✅ Role-based access: admin/pastor full access, member read-only active categories
- ✅ Firebase security rules properly restrict access
- ✅ Service methods validate user permissions appropriately

### Performance & Scalability
- ✅ Efficient queries with proper indexing
- ✅ Batch operations for multiple category updates
- ✅ Statistics computed efficiently without excessive reads

## Technical Implementation Notes

### Key Patterns
- **Statistics Updates**: Use Firestore transactions for consistent statistics computation
- **Soft Delete**: Mark categories inactive rather than deleting when they have associated donations
- **Default Initialization**: Church-appropriate default categories with proper color coding
- **Display Ordering**: Sortable categories for administrative control

### Error Handling
- Comprehensive error handling with user-friendly messages
- Graceful degradation when category statistics fail to update
- Validation of category data before database operations

### Performance Considerations
- Index on `isActive` and `displayOrder` fields
- Efficient aggregation queries for statistics
- Minimal database reads for common operations

## Dependencies Integration

This PRP integrates with:
- **PRP-2C-001**: Uses DonationCategory TypeScript interfaces
- **PRP-2C-002**: Integrates with donations service for statistics updates
- **Firebase Security Rules**: Extends existing role-based access patterns
- **Base Service**: Follows established service architecture patterns

## Future Enhancements

- Category-based donation goal tracking
- Historical statistics and trend analysis  
- Category merging and migration tools
- Advanced reporting with category breakdowns
- Category-specific tax reporting features