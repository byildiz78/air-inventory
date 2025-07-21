import { prisma } from './prisma';

/**
 * Activity logger utility for tracking user actions
 */
export class ActivityLogger {
  /**
   * Log a create action
   */
  static async logCreate(
    userId: string,
    entityType: string,
    entityId: string,
    details?: any,
    request?: any
  ) {
    return this.logActivity(userId, 'create', entityType, entityId, details, request);
  }

  /**
   * Log an update action
   */
  static async logUpdate(
    userId: string,
    entityType: string,
    entityId: string,
    details?: { before: any; after: any },
    request?: any
  ) {
    return this.logActivity(userId, 'update', entityType, entityId, details, request);
  }

  /**
   * Log a delete action
   */
  static async logDelete(
    userId: string,
    entityType: string,
    entityId: string,
    details?: any,
    request?: any
  ) {
    return this.logActivity(userId, 'delete', entityType, entityId, details, request);
  }

  /**
   * Log any activity
   */
  static async logActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: any,
    request?: any
  ) {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          details: details ? JSON.stringify(details) : null,
          ipAddress: request?.headers?.['x-forwarded-for'] || request?.socket?.remoteAddress,
          userAgent: request?.headers?.['user-agent']
        }
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Get recent activity logs
   */
  static async getRecentLogs(limit: number = 100) {
    return prisma.activityLog.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Get logs for a specific entity
   */
  static async getLogsForEntity(entityType: string, entityId: string, limit: number = 50) {
    return prisma.activityLog.findMany({
      where: {
        entityType,
        entityId
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Get logs for a specific user
   */
  static async getLogsForUser(userId: string, limit: number = 50) {
    return prisma.activityLog.findMany({
      where: {
        userId
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

/**
 * Simple helper function for logging activities
 */
export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  details,
  request
}: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  request?: any;
}) {
  return ActivityLogger.logActivity(userId, action, entityType, entityId, details, request);
}