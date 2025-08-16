// import { Timestamp } from 'firebase/firestore'; // Not used in this service
import { BaseFirestoreService } from './base.service';
import { RegistrationTokenDocument } from '../../types/firestore';
import {
  RegistrationToken,
  RegistrationStats,
  TokenValidationResult,
} from '../../types/registration';
import {
  generateUniqueToken,
  createRegistrationUrl,
} from '../../utils/token-generator';
import {
  timestampToString,
  stringToTimestamp,
  removeUndefined,
} from '../../utils/firestore-converters';

class RegistrationTokensService extends BaseFirestoreService<
  RegistrationTokenDocument,
  RegistrationToken
> {
  constructor() {
    super('registration_tokens');
  }

  // ============================================================================
  // DOCUMENT CONVERSION METHODS
  // ============================================================================

  protected documentToClient(
    id: string,
    document: RegistrationTokenDocument
  ): RegistrationToken {
    return {
      id,
      token: document.token,
      createdBy: document.createdBy,
      createdAt: timestampToString(document.createdAt) || '',
      expiresAt: timestampToString(document.expiresAt),
      maxUses: document.maxUses,
      currentUses: document.currentUses,
      isActive: document.isActive,
      metadata: {
        purpose: document.metadata.purpose,
        notes: document.metadata.notes,
        eventDate: timestampToString(document.metadata.eventDate),
        location: document.metadata.location,
      },
    };
  }

  protected clientToDocument(
    client: Partial<RegistrationToken>
  ): Partial<RegistrationTokenDocument> {
    const document: Partial<RegistrationTokenDocument> = {};

    if (client.token !== undefined) document.token = client.token;
    if (client.createdBy !== undefined) document.createdBy = client.createdBy;
    if (client.createdAt !== undefined)
      document.createdAt = stringToTimestamp(client.createdAt);
    if (client.expiresAt !== undefined)
      document.expiresAt = stringToTimestamp(client.expiresAt);
    if (client.maxUses !== undefined) document.maxUses = client.maxUses;
    if (client.currentUses !== undefined)
      document.currentUses = client.currentUses;
    if (client.isActive !== undefined) document.isActive = client.isActive;

    if (client.metadata) {
      document.metadata = {};
      if (client.metadata.purpose !== undefined)
        document.metadata.purpose = client.metadata.purpose;
      if (client.metadata.notes !== undefined)
        document.metadata.notes = client.metadata.notes;
      if (client.metadata.eventDate !== undefined)
        document.metadata.eventDate = stringToTimestamp(
          client.metadata.eventDate
        );
      if (client.metadata.location !== undefined)
        document.metadata.location = client.metadata.location;
    }

    return document;
  }

  // ============================================================================
  // TOKEN MANAGEMENT METHODS
  // ============================================================================

  /**
   * Generate a unique token string
   */
  private async generateToken(): Promise<string> {
    const checkUniqueness = async (token: string): Promise<boolean> => {
      const existing = await this.getWhere('token', '==', token);
      return existing.length === 0;
    };

    return generateUniqueToken(checkUniqueness);
  }

  /**
   * Create a new registration token
   */
  async createRegistrationToken(tokenData: {
    createdBy: string;
    expiresAt?: string; // ISO string
    maxUses?: number;
    metadata: {
      purpose: string;
      notes?: string;
      eventDate?: string; // ISO string
      location?: string;
    };
  }): Promise<RegistrationToken> {
    try {
      const token = await this.generateToken();

      const registrationToken: Partial<RegistrationToken> = {
        token,
        createdBy: tokenData.createdBy,
        maxUses: tokenData.maxUses || -1, // -1 means unlimited
        currentUses: 0,
        isActive: true,
        metadata: {
          purpose: tokenData.metadata.purpose,
        },
      };

      // Only add optional fields if they have values
      if (tokenData.expiresAt) {
        registrationToken.expiresAt = tokenData.expiresAt;
      }

      if (tokenData.metadata.notes) {
        registrationToken.metadata!.notes = tokenData.metadata.notes;
      }

      if (tokenData.metadata.eventDate) {
        registrationToken.metadata!.eventDate = tokenData.metadata.eventDate;
      }

      if (tokenData.metadata.location) {
        registrationToken.metadata!.location = tokenData.metadata.location;
      }

      const created = await this.create(registrationToken);
      console.log('Registration token created:', created);
      return created;
    } catch (error) {
      console.error('Error creating registration token:', error);
      throw error;
    }
  }

  /**
   * Validate a token and return its data
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const tokens = await this.getWhere('token', '==', token);

      if (tokens.length === 0) {
        return {
          isValid: false,
          error: 'Token not found',
        };
      }

      const registrationToken = tokens[0];

      // Check if token is active
      if (!registrationToken.isActive) {
        return {
          isValid: false,
          error: 'Token is inactive',
        };
      }

      // Check if token is expired
      if (
        registrationToken.expiresAt &&
        new Date(registrationToken.expiresAt) < new Date()
      ) {
        return {
          isValid: false,
          error: 'Token has expired',
        };
      }

      // Check if token has reached max uses
      if (
        registrationToken.maxUses > 0 &&
        registrationToken.currentUses >= registrationToken.maxUses
      ) {
        return {
          isValid: false,
          error: 'Token has reached maximum uses',
        };
      }

      return {
        isValid: true,
        token: registrationToken,
      };
    } catch (error) {
      console.error('Error validating token:', error);
      return {
        isValid: false,
        error: 'Error validating token',
      };
    }
  }

  /**
   * Increment the usage count for a token
   */
  async incrementUsage(tokenId: string): Promise<void> {
    try {
      const token = await this.getById(tokenId);
      if (!token) {
        throw new Error('Token not found');
      }

      await this.update(tokenId, {
        currentUses: token.currentUses + 1,
      });

      console.log(
        `Token usage incremented: ${tokenId} (${token.currentUses + 1})`
      );
    } catch (error) {
      console.error('Error incrementing token usage:', error);
      throw error;
    }
  }

  /**
   * Deactivate a token
   */
  async deactivateToken(tokenId: string): Promise<void> {
    try {
      await this.update(tokenId, {
        isActive: false,
      });
      console.log(`Token deactivated: ${tokenId}`);
    } catch (error) {
      console.error('Error deactivating token:', error);
      throw error;
    }
  }

  /**
   * Get all active tokens
   */
  async getActiveTokens(): Promise<RegistrationToken[]> {
    return this.getWhere('isActive', '==', true);
  }

  /**
   * Get tokens by creator
   */
  async getTokensByCreator(createdBy: string): Promise<RegistrationToken[]> {
    return this.getWhere('createdBy', '==', createdBy);
  }

  /**
   * Get registration statistics
   */
  async getRegistrationStats(): Promise<RegistrationStats> {
    try {
      // Get all tokens
      const allTokens = await this.getAll();
      const activeTokens = allTokens.filter((token) => token.isActive);

      // Note: In a real implementation, you would also query pending_registrations
      // For now, we'll return basic token statistics
      const registrationsByToken = allTokens.map((token) => ({
        tokenId: token.id,
        purpose: token.metadata.purpose,
        registrationCount: token.currentUses,
      }));

      return {
        totalTokens: allTokens.length,
        activeTokens: activeTokens.length,
        totalRegistrations: allTokens.reduce(
          (sum, token) => sum + token.currentUses,
          0
        ),
        pendingApprovals: 0, // Will be implemented when we add pending registrations service
        approvedRegistrations: 0, // Will be implemented when we add pending registrations service
        rejectedRegistrations: 0, // Will be implemented when we add pending registrations service
        registrationsByToken,
      };
    } catch (error) {
      console.error('Error getting registration stats:', error);
      throw error;
    }
  }

  /**
   * Create registration URL for a token
   */
  createRegistrationUrl(token: string, baseUrl?: string): string {
    return createRegistrationUrl(token, baseUrl);
  }

  /**
   * Get expired tokens
   */
  async getExpiredTokens(): Promise<RegistrationToken[]> {
    try {
      const allTokens = await this.getAll();
      const now = new Date();

      return allTokens.filter(
        (token) => token.expiresAt && new Date(token.expiresAt) < now
      );
    } catch (error) {
      console.error('Error getting expired tokens:', error);
      throw error;
    }
  }

  /**
   * Clean up expired tokens (deactivate them)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const expiredTokens = await this.getExpiredTokens();
      let cleanedCount = 0;

      for (const token of expiredTokens) {
        if (token.isActive) {
          await this.deactivateToken(token.id);
          cleanedCount++;
        }
      }

      console.log(`Cleaned up ${cleanedCount} expired tokens`);
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const registrationTokensService = new RegistrationTokensService();
