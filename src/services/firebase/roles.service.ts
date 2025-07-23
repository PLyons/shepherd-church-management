import { BaseFirestoreService } from './base.service';
import { MembersService } from './members.service';
import { auditService } from './audit.service';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';

// ============================================================================
// ROLE ASSIGNMENT SERVICE WITH SECURITY AUDIT TRAIL
// ============================================================================
// CRITICAL: Only admins can assign roles, all changes are audited

export interface RoleAssignment {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  currentRole: 'admin' | 'pastor' | 'member';
  previousRole?: 'admin' | 'pastor' | 'member';
  assignedBy: string;
  assignedByName: string;
  assignedAt: string;
  reason: string;
  isActive: boolean;
}

export interface RoleChangeAuditLog {
  id: string;
  targetMemberId: string;
  targetMemberName: string;
  targetMemberEmail: string;
  oldRole: 'admin' | 'pastor' | 'member' | null;
  newRole: 'admin' | 'pastor' | 'member';
  changedBy: string;
  changedByName: string;
  changedAt: string;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface RoleSummary {
  adminCount: number;
  pastorCount: number;
  memberCount: number;
  unassignedCount: number;
  totalUsers: number;
}

export class RolesService {
  private membersService: MembersService;
  private auditCollection = 'role_audit_logs';

  constructor() {
    this.membersService = new MembersService();
  }

  // ============================================================================
  // ROLE ASSIGNMENT (ADMIN ONLY)
  // ============================================================================

  /**
   * Assign role to a member (Admin only)
   * SECURITY: Only admins can assign roles, all changes audited
   */
  async assignRole(
    targetMemberId: string,
    newRole: 'admin' | 'pastor' | 'member',
    reason: string,
    requestingUserId: string,
    requestingUserRole: 'admin' | 'pastor' | 'member',
    sessionInfo?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    }
  ): Promise<void> {
    // SECURITY: Only admins can assign roles
    if (requestingUserRole !== 'admin') {
      await this.logUnauthorizedAccess(
        requestingUserId,
        'assign_role',
        targetMemberId
      );
      throw new Error('Access denied: Only administrators can assign roles');
    }

    // Validate the new role
    if (!['admin', 'pastor', 'member'].includes(newRole)) {
      throw new Error('Invalid role specified');
    }

    if (!reason || reason.trim().length < 10) {
      throw new Error(
        'A detailed reason is required for role changes (minimum 10 characters)'
      );
    }

    // Get target member and requesting user info
    const [targetMember, requestingUser] = await Promise.all([
      this.membersService.getById(targetMemberId),
      this.membersService.getById(requestingUserId),
    ]);

    if (!targetMember) {
      throw new Error('Target member not found');
    }

    if (!requestingUser) {
      throw new Error('Requesting user not found');
    }

    const oldRole = targetMember.role || null;

    // Don't allow changing your own admin role (prevents lockout)
    if (
      targetMemberId === requestingUserId &&
      oldRole === 'admin' &&
      newRole !== 'admin'
    ) {
      throw new Error(
        'Administrators cannot remove their own admin role to prevent system lockout'
      );
    }

    // Update the member's role
    await this.updateMemberRole(targetMemberId, newRole);

    // Create comprehensive audit log using audit service
    await auditService.logRoleChange(
      requestingUserId,
      requestingUser.email,
      `${requestingUser.firstName} ${requestingUser.lastName}`,
      targetMemberId,
      targetMember.email,
      `${targetMember.firstName} ${targetMember.lastName}`,
      oldRole,
      newRole,
      reason.trim(),
      sessionInfo
    );

    console.log(
      `[SECURITY] Role changed: ${targetMember.email} from ${oldRole || 'none'} to ${newRole} by ${requestingUser.email}`
    );
  }

  /**
   * Bulk role assignment (Admin only)
   */
  async bulkAssignRoles(
    assignments: Array<{
      memberId: string;
      newRole: 'admin' | 'pastor' | 'member';
      reason: string;
    }>,
    requestingUserId: string,
    requestingUserRole: 'admin' | 'pastor' | 'member',
    sessionInfo?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    }
  ): Promise<void> {
    // SECURITY: Only admins can bulk assign roles
    if (requestingUserRole !== 'admin') {
      await this.logUnauthorizedAccess(requestingUserId, 'bulk_assign_roles');
      throw new Error(
        'Access denied: Only administrators can perform bulk role assignments'
      );
    }

    if (!assignments || assignments.length === 0) {
      throw new Error('No role assignments provided');
    }

    if (assignments.length > 50) {
      throw new Error(
        'Bulk assignment limited to 50 users at a time for security'
      );
    }

    // Process each assignment individually to maintain audit trail
    const results: Array<{
      memberId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const assignment of assignments) {
      try {
        await this.assignRole(
          assignment.memberId,
          assignment.newRole,
          assignment.reason,
          requestingUserId,
          requestingUserRole,
          sessionInfo
        );
        results.push({ memberId: assignment.memberId, success: true });
      } catch (error) {
        results.push({
          memberId: assignment.memberId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log bulk operation completion
    console.log(
      `[SECURITY] Bulk role assignment completed: ${results.filter((r) => r.success).length}/${results.length} successful`
    );
  }

  // ============================================================================
  // ROLE QUERIES AND REPORTING
  // ============================================================================

  /**
   * Get role summary statistics
   */
  async getRoleSummary(): Promise<RoleSummary> {
    const allMembers = await this.membersService.getAll();

    const roleCounts = allMembers.reduce(
      (counts, member) => {
        const role = member.role || 'unassigned';
        switch (role) {
          case 'admin':
            counts.adminCount++;
            break;
          case 'pastor':
            counts.pastorCount++;
            break;
          case 'member':
            counts.memberCount++;
            break;
          default:
            counts.unassignedCount++;
        }
        return counts;
      },
      {
        adminCount: 0,
        pastorCount: 0,
        memberCount: 0,
        unassignedCount: 0,
      }
    );

    return {
      ...roleCounts,
      totalUsers: allMembers.length,
    };
  }

  /**
   * Get members without assigned roles
   */
  async getUnassignedMembers(): Promise<any[]> {
    const allMembers = await this.membersService.getAll();
    return allMembers.filter((member) => !member.role || member.role === '');
  }

  /**
   * Get members by role
   */
  async getMembersByRole(role: 'admin' | 'pastor' | 'member'): Promise<any[]> {
    const allMembers = await this.membersService.getAll();
    return allMembers.filter((member) => member.role === role);
  }

  /**
   * Get role change audit log (Admin only)
   */
  async getRoleAuditLog(
    requestingUserId: string,
    requestingUserRole: 'admin' | 'pastor' | 'member',
    limit: number = 50
  ): Promise<RoleChangeAuditLog[]> {
    // SECURITY: Only admins can view audit logs
    if (requestingUserRole !== 'admin') {
      await this.logUnauthorizedAccess(requestingUserId, 'view_audit_log');
      throw new Error('Access denied: Only administrators can view audit logs');
    }

    // TODO: Implement proper audit log retrieval from Firestore
    // For now, return empty array as audit logs need separate collection setup
    console.log(`[AUDIT] Admin ${requestingUserId} accessed role audit logs`);
    return [];
  }

  // ============================================================================
  // ROLE VALIDATION AND SECURITY
  // ============================================================================

  /**
   * Validate role assignment request
   */
  private async validateRoleAssignment(
    targetMemberId: string,
    newRole: string,
    requestingUserId: string
  ): Promise<void> {
    // Ensure at least one admin remains
    if (newRole !== 'admin') {
      const adminCount = (await this.getMembersByRole('admin')).length;
      const targetMember = await this.membersService.getById(targetMemberId);

      if (targetMember?.role === 'admin' && adminCount <= 1) {
        throw new Error(
          'Cannot remove the last administrator. At least one admin must remain.'
        );
      }
    }

    // Prevent privilege escalation attempts
    const requestingUser = await this.membersService.getById(requestingUserId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      throw new Error('Insufficient privileges for role assignment');
    }
  }

  /**
   * Update member role in database
   */
  private async updateMemberRole(
    memberId: string,
    newRole: 'admin' | 'pastor' | 'member'
  ): Promise<void> {
    await this.membersService.update(memberId, {
      role: newRole,
      roleUpdatedAt: new Date().toISOString(),
    });
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  /**
   * Log role change to secure audit trail
   */
  private async logRoleChange(
    auditData: Omit<RoleChangeAuditLog, 'id'>
  ): Promise<void> {
    try {
      // TODO: Implement secure audit log collection
      // This should write to a separate, admin-only collection that cannot be modified
      console.log('[ROLE AUDIT]', {
        timestamp: auditData.changedAt,
        action: 'role_change',
        target: auditData.targetMemberEmail,
        oldRole: auditData.oldRole,
        newRole: auditData.newRole,
        changedBy: auditData.changedByName,
        reason: auditData.reason,
        securityLevel: 'HIGH',
      });

      // In production, this would write to Firestore audit collection
      // const auditDoc = await addDoc(collection(this.db, this.auditCollection), auditData);
    } catch (error) {
      console.error('[CRITICAL] Failed to log role change audit:', error);
      // In production, this should trigger alerts as audit logging is critical
    }
  }

  /**
   * Log unauthorized access attempts
   */
  private async logUnauthorizedAccess(
    userId: string,
    attemptedAction: string,
    targetResource?: string
  ): Promise<void> {
    try {
      await auditService.logUnauthorizedAccess(
        userId,
        'Unknown User',
        'Unknown User',
        'unknown',
        attemptedAction,
        targetResource || 'role_management',
        'Insufficient privileges for role management'
      );
    } catch (error) {
      console.error('Failed to log unauthorized access attempt:', error);
    }

    console.warn('[SECURITY VIOLATION]', {
      timestamp: new Date().toISOString(),
      userId,
      attemptedAction,
      targetResource,
      result: 'DENIED',
    });
  }

  // ============================================================================
  // ROLE MANAGEMENT UTILITIES
  // ============================================================================

  /**
   * Initialize default admin if none exists (setup utility)
   */
  async initializeDefaultAdmin(adminEmail: string): Promise<void> {
    const adminCount = (await this.getMembersByRole('admin')).length;

    if (adminCount === 0) {
      // Find the member by email and make them admin
      const allMembers = await this.membersService.getAll();
      const targetMember = allMembers.find(
        (member) => member.email.toLowerCase() === adminEmail.toLowerCase()
      );

      if (!targetMember) {
        throw new Error(`No member found with email: ${adminEmail}`);
      }

      await this.updateMemberRole(targetMember.id, 'admin');

      // Log this critical system setup action
      await this.logRoleChange({
        targetMemberId: targetMember.id,
        targetMemberName: `${targetMember.firstName} ${targetMember.lastName}`,
        targetMemberEmail: targetMember.email,
        oldRole: targetMember.role || null,
        newRole: 'admin',
        changedBy: 'SYSTEM',
        changedByName: 'System Setup',
        changedAt: new Date().toISOString(),
        reason: 'Initial admin setup - no existing administrators found',
      });

      console.log(`[SYSTEM] Initial admin created: ${adminEmail}`);
    }
  }

  /**
   * Check if user has specific role
   */
  async userHasRole(
    userId: string,
    requiredRole: 'admin' | 'pastor' | 'member'
  ): Promise<boolean> {
    const user = await this.membersService.getById(userId);
    return user?.role === requiredRole;
  }

  /**
   * Check if user has any of the specified roles
   */
  async userHasAnyRole(
    userId: string,
    allowedRoles: ('admin' | 'pastor' | 'member')[]
  ): Promise<boolean> {
    const user = await this.membersService.getById(userId);
    return allowedRoles.includes(user?.role as any);
  }
}

// Create and export singleton instance
export const rolesService = new RolesService();
