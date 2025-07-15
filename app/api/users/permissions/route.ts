import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { hasPermission } from '@/lib/auth-utils';

// GET /api/users/permissions - Get all permissions for a user
export async function GET(request: NextRequest) {
  try {
    // Get the user ID from the request (in a real app, this would come from the session)
    const requestUserId = request.headers.get('x-user-id') || '1';
    
    // Get the target user ID from the query params
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the requesting user has permission to manage permissions
    const canManagePermissions = await hasPermission(requestUserId, 'users', 'manage_permissions');
    if (!canManagePermissions) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Get the user's permissions
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: targetUserId },
      include: {
        permission: {
          include: {
            module: true
          }
        }
      }
    });

    return NextResponse.json(userPermissions);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user permissions' },
      { status: 500 }
    );
  }
}

// POST /api/users/permissions - Add permissions to a user
export async function POST(request: NextRequest) {
  try {
    // Get the user ID from the request (in a real app, this would come from the session)
    const requestUserId = request.headers.get('x-user-id') || '1';
    
    // Check if the requesting user has permission to manage permissions
    const canManagePermissions = await hasPermission(requestUserId, 'users', 'manage_permissions');
    if (!canManagePermissions) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.userId || !data.permissionIds || !Array.isArray(data.permissionIds)) {
      return NextResponse.json(
        { error: 'User ID and permission IDs array are required' },
        { status: 400 }
      );
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete existing permissions for this user
    await prisma.userPermission.deleteMany({
      where: { userId: data.userId },
    });

    // Add new permissions
    const userPermissions = await Promise.all(
      data.permissionIds.map(async (permissionId: string) => {
        return prisma.userPermission.create({
          data: {
            userId: data.userId,
            permissionId,
          },
        });
      })
    );

    // Log the activity
    await ActivityLogger.logUpdate(
      requestUserId,
      'user_permissions',
      data.userId,
      {
        action: 'update_permissions',
        permissionIds: data.permissionIds,
      },
      request
    );

    return NextResponse.json(
      { success: true, count: userPermissions.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update user permissions' },
      { status: 500 }
    );
  }
}