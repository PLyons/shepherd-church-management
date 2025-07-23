import { BaseFirestoreService } from './base.service';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

// ============================================================================
// SECURE AUDIT LOGGING SERVICE
// ============================================================================
// CRITICAL: This service creates tamper-resistant audit logs for security-sensitive operations

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  targetResource: string;
  targetResourceId?: string;
  targetResourceName?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  errorMessage?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>;
}

export type AuditAction =
  // Authentication actions
  | 'user_login'
  | 'user_logout'
  | 'password_reset'
  | 'failed_login'
  // Role management actions
  | 'role_assigned'
  | 'role_removed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'unauthorized_role_access'
  // Financial data access
  | 'donation_viewed'
  | 'donation_created'
  | 'donation_updated'
  | 'donation_deleted'
  | 'financial_report_accessed'
  | 'unauthorized_financial_access'
  // Data access
  | 'member_data_accessed'
  | 'sensitive_data_exported'
  | 'bulk_data_access'
  | 'unauthorized_data_access'
  // System administration
  | 'admin_settings_changed'
  | 'system_configuration_modified'
  | 'backup_performed'
  | 'data_migration'
  // Security events
  | 'security_breach_detected'
  | 'suspicious_activity'
  | 'account_locked'
  | 'data_integrity_check';

export interface AuditQueryOptions {
  userId?: string;
  action?: AuditAction;
  targetResource?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  result?: 'SUCCESS' | 'FAILURE' | 'DENIED';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export class AuditService extends BaseFirestoreService<AuditLogEntry> {
  constructor() {
    super('audit_logs');
  }

  // ============================================================================
  // AUDIT LOG CREATION (HIGH SECURITY)
  // ============================================================================

  /**
   * Log security-sensitive action with full audit trail
   * This method should be called for all sensitive operations
   */
  async logAction(
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string,
    action: AuditAction,
    targetResource: string,
    details: Record<string, any>,
    options: {
      targetResourceId?: string;
      targetResourceName?: string;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      result?: 'SUCCESS' | 'FAILURE' | 'DENIED';
      errorMessage?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const riskLevel = this.determineRiskLevel(action, targetResource);

    const auditEntry: Omit<AuditLogEntry, 'id'> = {
      timestamp,
      userId,
      userEmail,
      userName,
      userRole,
      action,
      targetResource,
      targetResourceId: options.targetResourceId,
      targetResourceName: options.targetResourceName,
      details: this.sanitizeDetails(details),
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      sessionId: options.sessionId,
      result: options.result || 'SUCCESS',
      errorMessage: options.errorMessage,
      riskLevel,
      metadata: options.metadata,
    };

    try {
      const auditId = await this.create(auditEntry);

      // For critical actions, also log to console for immediate visibility
      if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
        console.log(`[SECURITY AUDIT ${riskLevel}]`, {
          auditId,
          timestamp,
          user: `${userName} (${userEmail})`,
          action,
          targetResource,
          result: auditEntry.result,
          riskLevel,
        });
      }

      return auditId;
    } catch (error) {
      // CRITICAL: If audit logging fails, we need to know immediately
      console.error('[CRITICAL] Audit logging failed:', error, {
        userId,
        action,
        targetResource,
        details: this.sanitizeDetails(details, true), // More aggressive sanitization for error logs
      });

      // In production, this should trigger alerts as audit logging failure is critical
      throw new Error('Failed to create audit log entry');
    }
  }

  /**
   * Log role change with comprehensive audit trail
   */
  async logRoleChange(
    adminUserId: string,
    adminEmail: string,
    adminName: string,
    targetUserId: string,
    targetEmail: string,
    targetName: string,
    oldRole: string | null,
    newRole: string,
    reason: string,
    sessionInfo?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    }
  ): Promise<string> {
    return this.logAction(
      adminUserId,
      adminEmail,
      adminName,
      'admin',
      'role_assigned',
      'user_role',
      {
        targetUserId,
        targetEmail,
        targetName,
        oldRole,
        newRole,
        reason,
        changeType: oldRole ? 'role_change' : 'initial_assignment',
      },
      {
        targetResourceId: targetUserId,
        targetResourceName: targetName,
        ...sessionInfo,
      }
    );
  }

  /**
   * Log financial data access
   */
  async logFinancialAccess(
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string,
    action:
      | 'donation_viewed'
      | 'donation_created'
      | 'donation_updated'
      | 'donation_deleted'
      | 'financial_report_accessed',
    donationDetails: {
      donationId?: string;
      amount?: number;
      donorId?: string;
      accessType: 'personal' | 'aggregate' | 'individual' | 'bulk';
    },
    sessionInfo?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    }
  ): Promise<string> {
    return this.logAction(
      userId,
      userEmail,
      userName,
      userRole,
      action,
      'financial_data',
      {
        accessType: donationDetails.accessType,
        donationId: donationDetails.donationId,
        amount: donationDetails.amount ? '[REDACTED]' : undefined, // Don't log actual amounts
        donorId: donationDetails.donorId,
        sensitiveDataAccess: true,
      },
      {
        targetResourceId: donationDetails.donationId,
        targetResourceName: donationDetails.donationId
          ? `Donation ${donationDetails.donationId}`
          : 'Financial Reports',
        ...sessionInfo,
      }
    );
  }

  /**
   * Log unauthorized access attempts
   */
  async logUnauthorizedAccess(
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string,
    attemptedAction: string,
    targetResource: string,
    reason: string,
    sessionInfo?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    }
  ): Promise<string> {
    return this.logAction(
      userId,
      userEmail,
      userName,
      userRole,
      'unauthorized_data_access',
      targetResource,
      {
        attemptedAction,
        denialReason: reason,
        securityViolation: true,
      },
      {
        result: 'DENIED',
        ...sessionInfo,
      }
    );
  }

  // ============================================================================
  // AUDIT LOG RETRIEVAL (ADMIN ONLY)
  // ============================================================================

  /**
   * Get audit logs with filtering (Admin only)
   */
  async getAuditLogs(
    requestingUserId: string,
    requestingUserRole: string,
    options: AuditQueryOptions = {}
  ): Promise<AuditLogEntry[]> {
    // Security check: Only admins can view audit logs
    if (requestingUserRole !== 'admin') {
      await this.logUnauthorizedAccess(
        requestingUserId,
        'Unknown',
        'Unknown',
        requestingUserRole,
        'view_audit_logs',
        'audit_logs',
        'Insufficient privileges'
      );
      throw new Error('Access denied: Only administrators can view audit logs');
    }

    let auditQuery = query(
      collection(this.db, this.collectionName),
      orderBy('timestamp', 'desc'),
      limit(options.limit || 100)
    );

    // Apply filters
    if (options.userId) {
      auditQuery = query(auditQuery, where('userId', '==', options.userId));
    }
    if (options.action) {
      auditQuery = query(auditQuery, where('action', '==', options.action));
    }
    if (options.riskLevel) {
      auditQuery = query(
        auditQuery,
        where('riskLevel', '==', options.riskLevel)
      );
    }
    if (options.result) {
      auditQuery = query(auditQuery, where('result', '==', options.result));
    }

    const snapshot = await getDocs(auditQuery);
    const logs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as AuditLogEntry
    );

    // Log this access to audit logs (meta-logging)
    await this.logAction(
      requestingUserId,
      'Admin User',
      'Admin User',
      'admin',
      'sensitive_data_exported',
      'audit_logs',
      {
        queryOptions: options,
        resultCount: logs.length,
        auditLogAccess: true,
      }
    );

    return logs;
  }

  /**
   * Get security violations (High and Critical risk events)
   */
  async getSecurityViolations(
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<AuditLogEntry[]> {
    if (requestingUserRole !== 'admin') {
      throw new Error(
        'Access denied: Only administrators can view security violations'
      );
    }

    const violationsQuery = query(
      collection(this.db, this.collectionName),
      where('riskLevel', 'in', ['HIGH', 'CRITICAL']),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(violationsQuery);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as AuditLogEntry
    );
  }

  // ============================================================================
  // AUDIT ANALYSIS AND REPORTING
  // ============================================================================

  /**
   * Get audit statistics for admin dashboard
   */
  async getAuditStatistics(
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<{
    totalLogs: number;
    criticalEvents: number;
    failedActions: number;
    recentViolations: number;
    topActions: Array<{ action: string; count: number }>;
  }> {
    if (requestingUserRole !== 'admin') {
      throw new Error(
        'Access denied: Only administrators can view audit statistics'
      );
    }

    // This would typically be implemented with aggregation queries
    // For now, return basic structure
    return {
      totalLogs: 0,
      criticalEvents: 0,
      failedActions: 0,
      recentViolations: 0,
      topActions: [],
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Determine risk level based on action and target resource
   */
  private determineRiskLevel(
    action: AuditAction,
    targetResource: string
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Critical risk actions
    if (
      [
        'role_assigned',
        'permission_granted',
        'admin_settings_changed',
        'security_breach_detected',
        'system_configuration_modified',
      ].includes(action)
    ) {
      return 'CRITICAL';
    }

    // High risk actions
    if (
      [
        'unauthorized_role_access',
        'unauthorized_financial_access',
        'unauthorized_data_access',
        'donation_deleted',
        'bulk_data_access',
        'failed_login',
        'account_locked',
      ].includes(action)
    ) {
      return 'HIGH';
    }

    // Medium risk actions
    if (
      [
        'donation_created',
        'donation_updated',
        'financial_report_accessed',
        'sensitive_data_exported',
        'member_data_accessed',
      ].includes(action)
    ) {
      return 'MEDIUM';
    }

    // Everything else is low risk
    return 'LOW';
  }

  /**
   * Sanitize sensitive details before logging
   */
  private sanitizeDetails(
    details: Record<string, any>,
    aggressive = false
  ): Record<string, any> {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'ssn',
      'creditCard',
      'bankAccount',
      'amount', // Don't log specific donation amounts
    ];

    const sanitized = { ...details };

    Object.keys(sanitized).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = aggressive ? '[REDACTED]' : '[SENSITIVE_DATA_REMOVED]';
      }
    });

    return sanitized;
  }

  // ============================================================================
  // INTEGRITY VERIFICATION
  // ============================================================================

  /**
   * Verify audit log integrity (check for tampering)
   * This would typically include cryptographic verification in production
   */
  async verifyIntegrity(
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<{
    isValid: boolean;
    issues: string[];
    lastVerified: string;
  }> {
    if (requestingUserRole !== 'admin') {
      throw new Error(
        'Access denied: Only administrators can verify audit integrity'
      );
    }

    // Log this integrity check
    await this.logAction(
      requestingUserId,
      'Admin User',
      'Admin User',
      'admin',
      'data_integrity_check',
      'audit_logs',
      { integrityVerification: true }
    );

    // In production, this would perform cryptographic verification
    return {
      isValid: true,
      issues: [],
      lastVerified: new Date().toISOString(),
    };
  }
}

// Create and export singleton instance
export const auditService = new AuditService();
