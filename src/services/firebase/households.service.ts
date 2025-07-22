import { doc, updateDoc, writeBatch, Timestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BaseFirestoreService } from './base.service';
import { Household, HouseholdDocument, COLLECTIONS, QueryOptions } from '../../types/firestore';
import { householdDocumentToHousehold, householdToHouseholdDocument } from '../../utils/firestore-converters';

// ============================================================================
// HOUSEHOLDS SERVICE
// ============================================================================
// Handles all CRUD operations for household documents

export class HouseholdsService extends BaseFirestoreService<HouseholdDocument, Household> {
  constructor() {
    super(COLLECTIONS.HOUSEHOLDS);
  }

  // ============================================================================
  // ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  protected documentToClient(id: string, document: HouseholdDocument): Household {
    return householdDocumentToHousehold(id, document);
  }

  protected clientToDocument(client: Partial<Household>): Partial<HouseholdDocument> {
    return householdToHouseholdDocument(client);
  }

  // ============================================================================
  // SPECIALIZED HOUSEHOLD OPERATIONS
  // ============================================================================

  /**
   * Get household by family name
   */
  async getByFamilyName(familyName: string): Promise<Household[]> {
    return this.getWhere('familyName', '==', familyName);
  }

  /**
   * Search households by family name or address
   */
  async search(searchTerm: string, options?: QueryOptions): Promise<Household[]> {
    // Get all households first (Firestore doesn't support full-text search natively)
    const allHouseholds = await this.getAll(options);
    
    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    return allHouseholds.filter(household => 
      household.familyName.toLowerCase().includes(searchLower) ||
      (household.address?.line1 && household.address.line1.toLowerCase().includes(searchLower)) ||
      (household.address?.city && household.address.city.toLowerCase().includes(searchLower)) ||
      (household.address?.state && household.address.state.toLowerCase().includes(searchLower)) ||
      (household.primaryContactName && household.primaryContactName.toLowerCase().includes(searchLower))
    );
  }

  /**
   * Get household directory with pagination and filtering
   */
  async getHouseholdDirectory(options?: {
    search?: string;
    city?: string;
    state?: string;
    limit?: number;
    orderBy?: 'name' | 'memberCount' | 'city';
    orderDirection?: 'asc' | 'desc';
  }): Promise<Household[]> {
    const queryOptions: QueryOptions = {
      where: [],
      limit: options?.limit || 50,
      orderBy: {
        field: options?.orderBy === 'name' ? 'familyName' : 
               options?.orderBy === 'memberCount' ? 'memberCount' :
               options?.orderBy === 'city' ? 'address.city' :
               'familyName',
        direction: options?.orderDirection || 'asc'
      }
    };

    // Add filters
    if (options?.city) {
      queryOptions.where!.push({ field: 'address.city', operator: '==', value: options.city });
    }
    
    if (options?.state) {
      queryOptions.where!.push({ field: 'address.state', operator: '==', value: options.state });
    }

    let results = await this.getAll(queryOptions);

    // Apply search filter if provided
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      results = results.filter(household => 
        household.familyName.toLowerCase().includes(searchLower) ||
        (household.address?.line1 && household.address.line1.toLowerCase().includes(searchLower)) ||
        (household.primaryContactName && household.primaryContactName.toLowerCase().includes(searchLower))
      );
    }

    return results;
  }

  // ============================================================================
  // MEMBER RELATIONSHIP MANAGEMENT
  // ============================================================================

  /**
   * Add a member to a household
   */
  async addMemberToHousehold(householdId: string, memberId: string): Promise<void> {
    const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, householdId);
    
    await updateDoc(householdRef, {
      memberIds: arrayUnion(memberId),
      memberCount: await this.getMemberCount(householdId) + 1,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Remove a member from a household
   */
  async removeMemberFromHousehold(householdId: string, memberId: string): Promise<void> {
    const household = await this.getById(householdId);
    if (!household) {
      throw new Error('Household not found');
    }

    const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, householdId);
    const updates: any = {
      memberIds: arrayRemove(memberId),
      memberCount: Math.max(0, household.memberCount - 1),
      updatedAt: Timestamp.now(),
    };

    // If this member was the primary contact, remove primary contact
    if (household.primaryContactId === memberId) {
      updates.primaryContactId = null;
      updates.primaryContactName = null;
    }

    await updateDoc(householdRef, updates);
  }

  /**
   * Set primary contact for a household
   */
  async setPrimaryContact(householdId: string, memberId: string, memberName: string): Promise<void> {
    const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, householdId);
    
    await updateDoc(householdRef, {
      primaryContactId: memberId,
      primaryContactName: memberName,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Remove primary contact from a household
   */
  async removePrimaryContact(householdId: string): Promise<void> {
    const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, householdId);
    
    await updateDoc(householdRef, {
      primaryContactId: null,
      primaryContactName: null,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Get member count for a household (recalculated)
   */
  private async getMemberCount(householdId: string): Promise<number> {
    const household = await this.getById(householdId);
    return household?.memberIds?.length || 0;
  }

  /**
   * Recalculate and update member count for a household
   */
  async updateMemberCount(householdId: string): Promise<void> {
    const memberCount = await this.getMemberCount(householdId);
    const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, householdId);
    
    await updateDoc(householdRef, {
      memberCount,
      updatedAt: Timestamp.now(),
    });
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Import households from CSV or other sources
   */
  async importHouseholds(householdsData: Partial<Household>[]): Promise<{ success: Household[], errors: { data: Partial<Household>, error: string }[] }> {
    const success: Household[] = [];
    const errors: { data: Partial<Household>, error: string }[] = [];

    for (const householdData of householdsData) {
      try {
        // Validate required fields
        if (!householdData.familyName) {
          errors.push({
            data: householdData,
            error: 'Missing required field: familyName'
          });
          continue;
        }

        // Check for duplicate family name (optional - you might allow duplicates)
        const existingHouseholds = await this.getByFamilyName(householdData.familyName);
        if (existingHouseholds.length > 0) {
          errors.push({
            data: householdData,
            error: `Household with family name "${householdData.familyName}" already exists`
          });
          continue;
        }

        // Create household
        const newHousehold = await this.create({
          ...householdData,
          memberIds: [],
          memberCount: 0,
        });
        success.push(newHousehold);
      } catch (error) {
        errors.push({
          data: householdData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { success, errors };
  }

  /**
   * Export households to a format suitable for CSV
   */
  async exportHouseholds(options?: {
    includeMembers?: boolean;
    city?: string;
    state?: string;
  }): Promise<any[]> {
    const households = await this.getHouseholdDirectory(options);
    
    return households.map(household => ({
      id: household.id,
      familyName: household.familyName,
      addressLine1: household.address?.line1 || '',
      addressLine2: household.address?.line2 || '',
      city: household.address?.city || '',
      state: household.address?.state || '',
      postalCode: household.address?.postalCode || '',
      country: household.address?.country || '',
      primaryContactName: household.primaryContactName || '',
      memberCount: household.memberCount,
      createdAt: household.createdAt,
      updatedAt: household.updatedAt,
    }));
  }

  // ============================================================================
  // ADDRESS AND LOCATION OPERATIONS
  // ============================================================================

  /**
   * Get households by city
   */
  async getByCity(city: string): Promise<Household[]> {
    return this.getWhere('address.city', '==', city);
  }

  /**
   * Get households by state
   */
  async getByState(state: string): Promise<Household[]> {
    return this.getWhere('address.state', '==', state);
  }

  /**
   * Get households by postal code
   */
  async getByPostalCode(postalCode: string): Promise<Household[]> {
    return this.getWhere('address.postalCode', '==', postalCode);
  }

  /**
   * Get unique cities from all households
   */
  async getUniqueCities(): Promise<string[]> {
    const households = await this.getAll();
    const cities = new Set<string>();
    
    households.forEach(household => {
      if (household.address?.city) {
        cities.add(household.address.city);
      }
    });
    
    return Array.from(cities).sort();
  }

  /**
   * Get unique states from all households
   */
  async getUniqueStates(): Promise<string[]> {
    const households = await this.getAll();
    const states = new Set<string>();
    
    households.forEach(household => {
      if (household.address?.state) {
        states.add(household.address.state);
      }
    });
    
    return Array.from(states).sort();
  }

  // ============================================================================
  // STATISTICS AND ANALYTICS
  // ============================================================================

  /**
   * Get household statistics
   */
  async getStatistics(): Promise<{
    total: number;
    withPrimaryContact: number;
    withoutPrimaryContact: number;
    averageMemberCount: number;
    totalMembers: number;
    citiesCount: number;
    statesCount: number;
  }> {
    // Use count for better performance for basic stats
    const [total, withPrimaryContact] = await Promise.all([
      this.count(),
      this.count({ where: [{ field: 'primaryContactId', operator: '!=', value: null }] })
    ]);

    const withoutPrimaryContact = total - withPrimaryContact;

    // For detailed stats that require data aggregation, we'll need to fetch household data
    // But we can limit this to essential fields and use a reasonable limit
    const households = await this.getAll({ limit: 1000 }); // Reasonable limit for stats calculation
    
    const totalMembers = households.reduce((sum, h) => sum + (h.memberCount || 0), 0);
    const averageMemberCount = total > 0 ? totalMembers / total : 0;
    
    const uniqueCities = new Set(households.map(h => h.address?.city).filter(Boolean));
    const uniqueStates = new Set(households.map(h => h.address?.state).filter(Boolean));

    return {
      total,
      withPrimaryContact,
      withoutPrimaryContact,
      averageMemberCount: Math.round(averageMemberCount * 100) / 100,
      totalMembers,
      citiesCount: uniqueCities.size,
      statesCount: uniqueStates.size,
    };
  }

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  /**
   * Cleanup households with no members
   */
  async cleanupEmptyHouseholds(): Promise<{ removed: string[], errors: string[] }> {
    const households = await this.getAll();
    const removed: string[] = [];
    const errors: string[] = [];

    for (const household of households) {
      if (!household.memberIds || household.memberIds.length === 0) {
        try {
          await this.delete(household.id);
          removed.push(household.id);
        } catch (error) {
          errors.push(`Failed to remove household ${household.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return { removed, errors };
  }

  /**
   * Recalculate all household member counts
   */
  async recalculateAllMemberCounts(): Promise<{ updated: number, errors: string[] }> {
    const households = await this.getAll();
    let updated = 0;
    const errors: string[] = [];

    for (const household of households) {
      try {
        await this.updateMemberCount(household.id);
        updated++;
      } catch (error) {
        errors.push(`Failed to update household ${household.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { updated, errors };
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to household directory changes
   */
  subscribeToHouseholdDirectory(
    options?: {
      city?: string;
      state?: string;
      limit?: number;
    },
    callback?: (households: Household[]) => void
  ): () => void {
    const queryOptions: QueryOptions = {
      orderBy: { field: 'familyName', direction: 'asc' },
      limit: options?.limit || 100,
      where: [],
    };

    if (options?.city) {
      queryOptions.where!.push({ field: 'address.city', operator: '==', value: options.city });
    }
    
    if (options?.state) {
      queryOptions.where!.push({ field: 'address.state', operator: '==', value: options.state });
    }

    return this.subscribeToCollection(queryOptions, callback);
  }
}

// Create and export singleton instance
export const householdsService = new HouseholdsService();