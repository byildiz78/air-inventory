import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/auth-utils';

// GET /api/activity-logs - Get activity logs with filtering
export async function GET(request: NextRequest) {
  try {
    // Get the user ID from the request (in a real app, this would come from the session)
    const userId = request.headers.get('x-user-id') || '1';
    
    // Check if the user has permission to view logs
    const canViewLogs = await hasPermission(userId, 'users', 'view');
    if (!canViewLogs) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const entityType = url.searchParams.get('entityType');
    const entityId = url.searchParams.get('entityId');
    const userIdFilter = url.searchParams.get('userId');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userIdFilter) where.userId = userIdFilter;
    
    if (fromDate) {
      where.createdAt = {
        ...(where.createdAt || {}),
        gte: new Date(fromDate),
      };
    }
    
    if (toDate) {
      const toDateObj = new Date(toDate);
      toDateObj.setHours(23, 59, 59, 999);
      where.createdAt = {
        ...(where.createdAt || {}),
        lte: toDateObj,
      };
    }

    // Get the logs
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}