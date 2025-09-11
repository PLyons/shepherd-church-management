// src/services/firebase/households.service.ts
// Firebase service for household management including CRUD operations, member assignment, and primary contact management
// Handles household lifecycle, member relationships, address management, and household-level data operations
// RELEVANT FILES: src/types/firestore.ts, src/utils/firestore-converters.ts, src/services/firebase/base.service.ts, src/services/firebase/members.service.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BaseFirestoreService } from './base.service';
import { Household, Member, HouseholdDocument } from '../../types/firestore';
import {
  householdToHouseholdDocument,
  householdDocumentToHousehold,
} from '../../utils/firestore-converters';

export class HouseholdsService extends BaseFirestoreService<
  HouseholdDocument,
  Household
> {
  constructor() {
    super(
      db,
      'households',
      (id: string, document: HouseholdDocument) => householdDocumentToHousehold(id, document),
      (client: Partial<Household>) => householdToHouseholdDocument(client)
    );
  }

  // Implement abstract methods
  protected documentToClient(
    id: string,
    document: HouseholdDocument
  ): Household {
    return householdDocumentToHousehold(id, document);
  }

  protected clientToDocument(
    client: Partial<Household>
  ): Partial<HouseholdDocument> {
    return householdToHouseholdDocument(client);
  }

  /**
   * Get household by ID
   */
  async getById(id: string): Promise<Household | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return this.documentToClient(id, docSnap.data() as HouseholdDocument);
      }
      return null;
    } catch (error) {
      console.error('Error getting household:', error);
      throw error;
    }
  }

  /**
   * Get all members of a household
   */
  async getMembers(householdId: string): Promise<Member[]> {
    try {
      const membersCollection = collection(db, 'members');
      const householdQuery = query(
        membersCollection,
        where('householdId', '==', householdId)
      );

      const querySnapshot = await getDocs(householdQuery);
      const members: Member[] = [];

      querySnapshot.forEach((doc) => {
        const memberData = doc.data();
        members.push({
          id: doc.id,
          ...memberData,
        } as Member);
      });

      // Sort by primary contact first, then by first name
      return members.sort((a, b) => {
        if (a.isPrimaryContact && !b.isPrimaryContact) return -1;
        if (!a.isPrimaryContact && b.isPrimaryContact) return 1;
        return a.firstName.localeCompare(b.firstName);
      });
    } catch (error) {
      console.error('Error getting household members:', error);
      throw error;
    }
  }

  /**
   * Get all households
   */
  async getAll(): Promise<Household[]> {
    try {
      const householdsCollection = collection(db, this.collectionName);
      const querySnapshot = await getDocs(householdsCollection);
      const households: Household[] = [];

      querySnapshot.forEach((doc) => {
        households.push(
          this.documentToClient(doc.id, doc.data() as HouseholdDocument)
        );
      });

      return households.sort((a, b) =>
        a.familyName.localeCompare(b.familyName)
      );
    } catch (error) {
      console.error('Error getting all households:', error);
      throw error;
    }
  }

  /**
   * Create a new household
   */
  async create(householdData: Omit<Household, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('Creating household:', householdData);
      
      // Normalize the family name for consistent searching
      const normalizedName = householdData.familyName.toLowerCase().trim();
      
      const householdToCreate: Omit<Household, 'id'> = {
        ...householdData,
        normalizedName,
        memberIds: householdData.memberIds || [],
        memberCount: householdData.memberIds?.length || 0,
        status: householdData.status || 'approved',
      };

      const documentData = this.clientToDocument(householdToCreate);
      const householdsCollection = collection(db, this.collectionName);
      const docRef = await addDoc(householdsCollection, documentData);
      
      console.log('Household created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating household:', error);
      throw new Error('Failed to create household');
    }
  }

  /**
   * Update an existing household
   */
  async update(id: string, updates: Partial<Household>): Promise<void> {
    try {
      console.log('Updating household:', id, updates);
      
      const updateData = this.clientToDocument(updates);
      
      // If family name is being updated, also update the normalized name
      if (updates.familyName) {
        updateData.normalizedName = updates.familyName.toLowerCase().trim();
      }
      
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, updateData);
      
      console.log('Household updated successfully');
    } catch (error) {
      console.error('Error updating household:', error);
      throw new Error('Failed to update household');
    }
  }

  /**
   * Delete a household and update all associated members
   */
  async delete(id: string): Promise<void> {
    try {
      console.log('Deleting household:', id);
      
      // First, get all members in this household
      const members = await this.getMembers(id);
      
      // Create a batch to update all members and delete the household
      const batch = writeBatch(db);
      
      // Update all members to remove household association
      const membersCollection = collection(db, 'members');
      members.forEach(member => {
        const memberRef = doc(membersCollection, member.id);
        batch.update(memberRef, {
          householdId: null,
          isPrimaryContact: false,
          updatedAt: new Date()
        });
      });
      
      // Delete the household
      const householdRef = doc(db, this.collectionName, id);
      batch.delete(householdRef);
      
      // Execute the batch
      await batch.commit();
      
      console.log('Household deleted and members updated successfully');
    } catch (error) {
      console.error('Error deleting household:', error);
      throw new Error('Failed to delete household');
    }
  }

  /**
   * Add a member to a household
   */
  async addMember(householdId: string, memberId: string, isPrimaryContact: boolean = false): Promise<void> {
    try {
      console.log('Adding member to household:', { householdId, memberId, isPrimaryContact });
      
      // Get current household data
      const household = await this.getById(householdId);
      if (!household) {
        throw new Error('Household not found');
      }
      
      // Create batch for atomic updates
      const batch = writeBatch(db);
      
      // If this member is becoming the primary contact, remove primary status from other members
      if (isPrimaryContact) {
        const currentMembers = await this.getMembers(householdId);
        const membersCollection = collection(db, 'members');
        
        currentMembers.forEach(member => {
          if (member.isPrimaryContact) {
            const memberRef = doc(membersCollection, member.id);
            batch.update(memberRef, {
              isPrimaryContact: false,
              updatedAt: new Date()
            });
          }
        });
      }
      
      // Update the member
      const memberRef = doc(collection(db, 'members'), memberId);
      batch.update(memberRef, {
        householdId,
        isPrimaryContact,
        updatedAt: new Date()
      });
      
      // Update household member list and count
      const updatedMemberIds = [...household.memberIds];
      if (!updatedMemberIds.includes(memberId)) {
        updatedMemberIds.push(memberId);
      }
      
      const householdRef = doc(db, this.collectionName, householdId);
      const householdUpdates: Partial<HouseholdDocument> = {
        memberIds: updatedMemberIds,
        memberCount: updatedMemberIds.length,
        updatedAt: new Date()
      };
      
      // If this is the primary contact, update household info
      if (isPrimaryContact) {
        // Get member data to update household primary contact info
        const memberDoc = await getDoc(memberRef);
        if (memberDoc.exists()) {
          const memberData = memberDoc.data();
          householdUpdates.primaryContactId = memberId;
          householdUpdates.primaryContactName = `${memberData.firstName} ${memberData.lastName}`;
        }
      }
      
      batch.update(householdRef, householdUpdates);
      
      await batch.commit();
      console.log('Member added to household successfully');
    } catch (error) {
      console.error('Error adding member to household:', error);
      throw new Error('Failed to add member to household');
    }
  }

  /**
   * Remove a member from a household
   */
  async removeMember(householdId: string, memberId: string): Promise<void> {
    try {
      console.log('Removing member from household:', { householdId, memberId });
      
      // Get current household data
      const household = await this.getById(householdId);
      if (!household) {
        throw new Error('Household not found');
      }
      
      const batch = writeBatch(db);
      
      // Update the member to remove household association
      const memberRef = doc(collection(db, 'members'), memberId);
      batch.update(memberRef, {
        householdId: null,
        isPrimaryContact: false,
        updatedAt: new Date()
      });
      
      // Update household member list and count
      const updatedMemberIds = household.memberIds.filter(id => id !== memberId);
      
      const householdRef = doc(db, this.collectionName, householdId);
      const householdUpdates: Partial<HouseholdDocument> = {
        memberIds: updatedMemberIds,
        memberCount: updatedMemberIds.length,
        updatedAt: new Date()
      };
      
      // If we're removing the primary contact, clear primary contact info
      if (household.primaryContactId === memberId) {
        householdUpdates.primaryContactId = null;
        householdUpdates.primaryContactName = null;
      }
      
      batch.update(householdRef, householdUpdates);
      
      await batch.commit();
      console.log('Member removed from household successfully');
    } catch (error) {
      console.error('Error removing member from household:', error);
      throw new Error('Failed to remove member from household');
    }
  }

  /**
   * Search households by family name
   */
  async searchByName(searchTerm: string): Promise<Household[]> {
    try {
      const allHouseholds = await this.getAll();
      const normalizedSearch = searchTerm.toLowerCase().trim();
      
      return allHouseholds.filter(household => 
        household.normalizedName?.includes(normalizedSearch) ||
        household.familyName.toLowerCase().includes(normalizedSearch)
      );
    } catch (error) {
      console.error('Error searching households:', error);
      throw new Error('Failed to search households');
    }
  }

  /**
   * Get households with populated member data
   */
  async getAllWithMembers(): Promise<Household[]> {
    try {
      const households = await this.getAll();
      const householdsWithMembers = await Promise.all(
        households.map(async household => {
          const members = await this.getMembers(household.id);
          return {
            ...household,
            members
          };
        })
      );
      return householdsWithMembers;
    } catch (error) {
      console.error('Error getting households with members:', error);
      throw error;
    }
  }

  /**
   * Change the primary contact for a household
   */
  async setPrimaryContact(householdId: string, newPrimaryContactId: string): Promise<void> {
    try {
      console.log('Setting primary contact:', { householdId, newPrimaryContactId });
      
      // Get current household data
      const household = await this.getById(householdId);
      if (!household) {
        throw new Error('Household not found');
      }
      
      // Get current members to validate the new primary contact exists in this household
      const currentMembers = await this.getMembers(householdId);
      const newPrimaryMember = currentMembers.find(m => m.id === newPrimaryContactId);
      
      if (!newPrimaryMember) {
        throw new Error('Selected member is not part of this household');
      }
      
      // Create batch for atomic updates
      const batch = writeBatch(db);
      const membersCollection = collection(db, 'members');
      
      // Remove primary contact status from all current members
      currentMembers.forEach(member => {
        if (member.isPrimaryContact && member.id !== newPrimaryContactId) {
          const memberRef = doc(membersCollection, member.id);
          batch.update(memberRef, {
            isPrimaryContact: false,
            updatedAt: new Date()
          });
        }
      });
      
      // Set the new primary contact
      const newPrimaryRef = doc(membersCollection, newPrimaryContactId);
      batch.update(newPrimaryRef, {
        isPrimaryContact: true,
        updatedAt: new Date()
      });
      
      // Update the household document with new primary contact info
      const householdRef = doc(db, this.collectionName, householdId);
      batch.update(householdRef, {
        primaryContactId: newPrimaryContactId,
        primaryContactName: `${newPrimaryMember.firstName} ${newPrimaryMember.lastName}`,
        updatedAt: new Date()
      });
      
      // Execute the batch
      await batch.commit();
      
      console.log('Primary contact updated successfully');
    } catch (error) {
      console.error('Error setting primary contact:', error);
      throw new Error('Failed to update primary contact');
    }
  }
}

export const householdsService = new HouseholdsService();
