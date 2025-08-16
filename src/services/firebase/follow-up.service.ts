import { BaseFirestoreService } from './base.service';
import { PendingRegistration, Member } from '../../types';

export interface FollowUpAction {
  id: string;
  memberId: string;
  actionType:
    | 'welcome_packet'
    | 'pastoral_followup'
    | 'new_member_orientation'
    | 'mailing_list';
  status: 'pending' | 'completed' | 'failed';
  scheduledAt: string;
  completedAt?: string;
  metadata: {
    email?: string;
    phone?: string;
    notes?: string;
    templateId?: string;
    recipientName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpActionDocument {
  memberId: string;
  actionType: string;
  status: string;
  scheduledAt: Date;
  completedAt?: Date;
  metadata: {
    email?: string;
    phone?: string;
    notes?: string;
    templateId?: string;
    recipientName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WelcomePacketTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpSettings {
  id: string;
  welcomePacketEnabled: boolean;
  welcomePacketDelay: number; // hours after approval
  welcomePacketTemplateId?: string;
  pastoralFollowUpEnabled: boolean;
  pastoralFollowUpDelay: number; // hours after approval
  newMemberOrientationEnabled: boolean;
  newMemberOrientationDelay: number; // hours after approval
  mailingListEnabled: boolean;
  mailingListAutoSubscribe: boolean;
  createdAt: string;
  updatedAt: string;
}

class FollowUpService extends BaseFirestoreService<
  FollowUpActionDocument,
  FollowUpAction
> {
  constructor() {
    super('follow_up_actions');
  }

  protected documentToClient(
    id: string,
    document: FollowUpActionDocument
  ): FollowUpAction {
    return {
      id,
      memberId: document.memberId,
      actionType: document.actionType as FollowUpAction['actionType'],
      status: document.status as FollowUpAction['status'],
      scheduledAt:
        document.scheduledAt instanceof Date
          ? document.scheduledAt.toISOString()
          : document.scheduledAt,
      completedAt:
        document.completedAt instanceof Date
          ? document.completedAt.toISOString()
          : undefined,
      metadata: document.metadata,
      createdAt:
        document.createdAt instanceof Date
          ? document.createdAt.toISOString()
          : new Date().toISOString(),
      updatedAt:
        document.updatedAt instanceof Date
          ? document.updatedAt.toISOString()
          : new Date().toISOString(),
    };
  }

  protected clientToDocument(
    client: Partial<FollowUpAction>
  ): Partial<FollowUpActionDocument> {
    const document: Partial<FollowUpActionDocument> = {
      memberId: client.memberId,
      actionType: client.actionType,
      status: client.status,
      scheduledAt: client.scheduledAt
        ? new Date(client.scheduledAt)
        : undefined,
      completedAt: client.completedAt
        ? new Date(client.completedAt)
        : undefined,
      metadata: client.metadata || {},
      createdAt: client.createdAt ? new Date(client.createdAt) : new Date(),
      updatedAt: new Date(),
    };

    return document;
  }

  /**
   * Process approved registration and create follow-up actions
   */
  async processApprovedRegistration(
    registration: PendingRegistration,
    member: Member,
    settings?: FollowUpSettings
  ): Promise<void> {
    try {
      // Get default settings if not provided
      const followUpSettings = settings || (await this.getFollowUpSettings());

      const now = new Date();
      const followUpActions: Partial<FollowUpAction>[] = [];

      // Schedule welcome packet
      if (followUpSettings.welcomePacketEnabled && registration.email) {
        const scheduledAt = new Date(
          now.getTime() + followUpSettings.welcomePacketDelay * 60 * 60 * 1000
        );
        followUpActions.push({
          memberId: member.id,
          actionType: 'welcome_packet',
          status: 'pending',
          scheduledAt: scheduledAt.toISOString(),
          metadata: {
            email: registration.email,
            recipientName: `${registration.firstName} ${registration.lastName}`,
            templateId: followUpSettings.welcomePacketTemplateId,
          },
        });
      }

      // Schedule pastoral follow-up
      if (followUpSettings.pastoralFollowUpEnabled) {
        const scheduledAt = new Date(
          now.getTime() +
            followUpSettings.pastoralFollowUpDelay * 60 * 60 * 1000
        );
        followUpActions.push({
          memberId: member.id,
          actionType: 'pastoral_followup',
          status: 'pending',
          scheduledAt: scheduledAt.toISOString(),
          metadata: {
            email: registration.email,
            phone: registration.phone,
            recipientName: `${registration.firstName} ${registration.lastName}`,
            notes: `New ${registration.memberStatus} registration. Submitted via QR code.`,
          },
        });
      }

      // Schedule new member orientation (only for new members)
      if (
        followUpSettings.newMemberOrientationEnabled &&
        registration.memberStatus === 'member'
      ) {
        const scheduledAt = new Date(
          now.getTime() +
            followUpSettings.newMemberOrientationDelay * 60 * 60 * 1000
        );
        followUpActions.push({
          memberId: member.id,
          actionType: 'new_member_orientation',
          status: 'pending',
          scheduledAt: scheduledAt.toISOString(),
          metadata: {
            email: registration.email,
            recipientName: `${registration.firstName} ${registration.lastName}`,
          },
        });
      }

      // Schedule mailing list subscription
      if (
        followUpSettings.mailingListEnabled &&
        followUpSettings.mailingListAutoSubscribe &&
        registration.email
      ) {
        followUpActions.push({
          memberId: member.id,
          actionType: 'mailing_list',
          status: 'pending',
          scheduledAt: now.toISOString(),
          metadata: {
            email: registration.email,
            recipientName: `${registration.firstName} ${registration.lastName}`,
          },
        });
      }

      // Create all follow-up actions
      for (const action of followUpActions) {
        await this.create(action);
      }

      console.log(
        `Created ${followUpActions.length} follow-up actions for member ${member.id}`
      );
    } catch (error) {
      console.error(
        'Error processing approved registration for follow-up:',
        error
      );
      throw error;
    }
  }

  /**
   * Get pending follow-up actions that are due for processing
   */
  async getPendingActions(): Promise<FollowUpAction[]> {
    try {
      const now = new Date();
      const actions = await this.getAll({
        where: [
          { field: 'status', operator: '==', value: 'pending' },
          { field: 'scheduledAt', operator: '<=', value: now },
        ],
        orderBy: { field: 'scheduledAt', direction: 'asc' },
      });

      return actions;
    } catch (error) {
      console.error('Error getting pending actions:', error);
      throw error;
    }
  }

  /**
   * Mark follow-up action as completed
   */
  async completeAction(actionId: string, notes?: string): Promise<void> {
    try {
      const updateData: Partial<FollowUpAction> = {
        status: 'completed',
        completedAt: new Date().toISOString(),
      };

      if (notes) {
        updateData.metadata = { notes };
      }

      await this.update(actionId, updateData);
      console.log(`Follow-up action ${actionId} marked as completed`);
    } catch (error) {
      console.error('Error completing follow-up action:', error);
      throw error;
    }
  }

  /**
   * Mark follow-up action as failed
   */
  async failAction(actionId: string, reason: string): Promise<void> {
    try {
      await this.update(actionId, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        metadata: { notes: `Failed: ${reason}` },
      });
      console.log(`Follow-up action ${actionId} marked as failed: ${reason}`);
    } catch (error) {
      console.error('Error failing follow-up action:', error);
      throw error;
    }
  }

  /**
   * Get follow-up actions for a specific member
   */
  async getActionsByMember(memberId: string): Promise<FollowUpAction[]> {
    try {
      return await this.getWhere('memberId', '==', memberId);
    } catch (error) {
      console.error('Error getting actions by member:', error);
      throw error;
    }
  }

  /**
   * Get follow-up actions by type
   */
  async getActionsByType(
    actionType: FollowUpAction['actionType']
  ): Promise<FollowUpAction[]> {
    try {
      return await this.getWhere('actionType', '==', actionType);
    } catch (error) {
      console.error('Error getting actions by type:', error);
      throw error;
    }
  }

  /**
   * Get follow-up statistics
   */
  async getFollowUpStatistics(): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
    byType: Record<
      string,
      { pending: number; completed: number; failed: number }
    >;
  }> {
    try {
      const allActions = await this.getAll();

      const stats = {
        total: allActions.length,
        pending: 0,
        completed: 0,
        failed: 0,
        byType: {} as Record<
          string,
          { pending: number; completed: number; failed: number }
        >,
      };

      allActions.forEach((action) => {
        // Count by status
        if (action.status === 'pending') stats.pending++;
        else if (action.status === 'completed') stats.completed++;
        else if (action.status === 'failed') stats.failed++;

        // Count by type
        if (!stats.byType[action.actionType]) {
          stats.byType[action.actionType] = {
            pending: 0,
            completed: 0,
            failed: 0,
          };
        }
        stats.byType[action.actionType][action.status]++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting follow-up statistics:', error);
      throw error;
    }
  }

  /**
   * Get or create default follow-up settings
   */
  private async getFollowUpSettings(): Promise<FollowUpSettings> {
    // In a real implementation, this would fetch from a settings collection
    // For now, return default settings
    return {
      id: 'default',
      welcomePacketEnabled: true,
      welcomePacketDelay: 1, // 1 hour after approval
      welcomePacketTemplateId: 'default-welcome',
      pastoralFollowUpEnabled: true,
      pastoralFollowUpDelay: 24, // 24 hours after approval
      newMemberOrientationEnabled: true,
      newMemberOrientationDelay: 48, // 48 hours after approval
      mailingListEnabled: true,
      mailingListAutoSubscribe: false, // Require consent
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Process welcome packet action
   */
  async processWelcomePacket(action: FollowUpAction): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Get the welcome packet template
      // 2. Generate personalized content
      // 3. Send via email service
      // 4. Log the action

      console.log(
        `Processing welcome packet for ${action.metadata.recipientName} (${action.metadata.email})`
      );

      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      console.error('Error processing welcome packet:', error);
      return false;
    }
  }

  /**
   * Process pastoral follow-up action
   */
  async processPastoralFollowUp(action: FollowUpAction): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Create a task for pastoral staff
      // 2. Send notification to pastors
      // 3. Add to pastoral care system
      // 4. Schedule reminder

      console.log(
        `Creating pastoral follow-up task for ${action.metadata.recipientName}`
      );

      // Simulate task creation
      await new Promise((resolve) => setTimeout(resolve, 500));

      return true;
    } catch (error) {
      console.error('Error processing pastoral follow-up:', error);
      return false;
    }
  }

  /**
   * Process new member orientation invitation
   */
  async processNewMemberOrientation(action: FollowUpAction): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Check upcoming orientation sessions
      // 2. Send invitation email with dates
      // 3. Add to orientation mailing list
      // 4. Create calendar events

      console.log(
        `Sending new member orientation invitation to ${action.metadata.recipientName}`
      );

      // Simulate invitation sending
      await new Promise((resolve) => setTimeout(resolve, 800));

      return true;
    } catch (error) {
      console.error('Error processing new member orientation:', error);
      return false;
    }
  }

  /**
   * Process mailing list subscription
   */
  async processMailingList(action: FollowUpAction): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Add to email marketing service
      // 2. Subscribe to church newsletter
      // 3. Add to relevant lists based on interests
      // 4. Send confirmation email

      console.log(`Adding ${action.metadata.recipientName} to mailing lists`);

      // Simulate mailing list subscription
      await new Promise((resolve) => setTimeout(resolve, 600));

      return true;
    } catch (error) {
      console.error('Error processing mailing list subscription:', error);
      return false;
    }
  }

  /**
   * Process all pending actions (to be called by a scheduled job)
   */
  async processPendingActions(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    try {
      const pendingActions = await this.getPendingActions();

      let successful = 0;
      let failed = 0;

      for (const action of pendingActions) {
        let result = false;

        try {
          switch (action.actionType) {
            case 'welcome_packet':
              result = await this.processWelcomePacket(action);
              break;
            case 'pastoral_followup':
              result = await this.processPastoralFollowUp(action);
              break;
            case 'new_member_orientation':
              result = await this.processNewMemberOrientation(action);
              break;
            case 'mailing_list':
              result = await this.processMailingList(action);
              break;
            default:
              console.warn(`Unknown action type: ${action.actionType}`);
              result = false;
          }

          if (result) {
            await this.completeAction(action.id);
            successful++;
          } else {
            await this.failAction(action.id, 'Processing failed');
            failed++;
          }
        } catch (error) {
          console.error(`Error processing action ${action.id}:`, error);
          await this.failAction(
            action.id,
            error instanceof Error ? error.message : 'Unknown error'
          );
          failed++;
        }
      }

      console.log(
        `Processed ${pendingActions.length} actions: ${successful} successful, ${failed} failed`
      );

      return {
        processed: pendingActions.length,
        successful,
        failed,
      };
    } catch (error) {
      console.error('Error processing pending actions:', error);
      throw error;
    }
  }
}

export const followUpService = new FollowUpService();
