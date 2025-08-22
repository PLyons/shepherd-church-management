import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BaseFirestoreService } from './base.service';
import { Household, Member, HouseholdDocument } from '../../types/firestore';
import { householdToHouseholdDocument, householdDocumentToHousehold } from '../../utils/firestore-converters';

export class HouseholdsService extends BaseFirestoreService<HouseholdDocument, Household> {
  constructor() {
    super('households');
  }

  // Implement abstract methods
  protected documentToClient(id: string, document: HouseholdDocument): Household {
    return householdDocumentToHousehold(id, document);
  }

  protected clientToDocument(client: Partial<Household>): Partial<HouseholdDocument> {
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
        households.push(this.documentToClient(doc.id, doc.data() as HouseholdDocument));
      });
      
      return households.sort((a, b) => a.familyName.localeCompare(b.familyName));
    } catch (error) {
      console.error('Error getting all households:', error);
      throw error;
    }
  }
}

export const householdsService = new HouseholdsService();