import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log an audit event
   */
  async logEvent(
    actorId: string,
    action: string,
    targetType: string,
    targetId: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
      },
      include: {
        actor: true,
      },
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(actorId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        actor: true,
      },
    });
  }

  /**
   * Get audit logs for a specific target
   */
  async getTargetAuditLogs(targetType: string, targetId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        targetType,
        targetId,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        actor: true,
      },
    });
  }

  /**
   * Get all audit logs with pagination
   */
  async getAllAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          actor: true,
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit logs by action type
   */
  async getAuditLogsByAction(action: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { action },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        actor: true,
      },
    });
  }

  /**
   * Get audit logs within a date range
   */
  async getAuditLogsByDateRange(
    startDate: Date,
    endDate: Date,
    limit = 50,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        actor: true,
      },
    });
  }

  /**
   * Log user login
   */
  async logUserLogin(userId: string) {
    return this.logEvent(userId, 'LOGIN', 'User', userId);
  }

  /**
   * Log user logout
   */
  async logUserLogout(userId: string) {
    return this.logEvent(userId, 'LOGOUT', 'User', userId);
  }

  /**
   * Log license assignment
   */
  async logLicenseAssignment(
    assignedBy: string,
    userId: string,
    licenseId: string,
  ) {
    return this.logEvent(assignedBy, 'LICENSE_ASSIGNED', 'UserTenantLicense', licenseId);
  }

  /**
   * Log license revocation
   */
  async logLicenseRevocation(
    revokedBy: string,
    licenseId: string,
  ) {
    return this.logEvent(revokedBy, 'LICENSE_REVOKED', 'UserTenantLicense', licenseId);
  }

  /**
   * Log user creation
   */
  async logUserCreation(createdBy: string, userId: string) {
    return this.logEvent(createdBy, 'USER_CREATED', 'User', userId);
  }

  /**
   * Log user update
   */
  async logUserUpdate(updatedBy: string, userId: string) {
    return this.logEvent(updatedBy, 'USER_UPDATED', 'User', userId);
  }

  /**
   * Log user deletion
   */
  async logUserDeletion(deletedBy: string, userId: string) {
    return this.logEvent(deletedBy, 'USER_DELETED', 'User', userId);
  }
}
