import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { hasPermission } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user ID from the request (in a real app, this would come from the session)
    const userId = request.headers.get('x-user-id') || '1';
    
    // Check if the user has permission to view users
    const canViewUsers = await hasPermission(userId, 'users', 'view');
    if (!canViewUsers) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuperAdmin: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user ID from the request (in a real app, this would come from the session)
    const userId = request.headers.get('x-user-id') || '1';
    
    // Check if the user has permission to edit users
    const canEditUsers = await hasPermission(userId, 'users', 'edit');
    if (!canEditUsers) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Get the current user data for logging changes
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isSuperAdmin !== undefined) updateData.isSuperAdmin = data.isSuperAdmin;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    // Only update password if provided
    if (data.password) {
      // Hash the password before storing it
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    // Log the activity
    await ActivityLogger.logUpdate(
      userId,
      'user',
      updatedUser.id,
      {
        before: {
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          isSuperAdmin: currentUser.isSuperAdmin,
          isActive: currentUser.isActive,
        },
        after: {
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          isSuperAdmin: updatedUser.isSuperAdmin,
          isActive: updatedUser.isActive,
        },
      },
      request
    );

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isSuperAdmin: updatedUser.isSuperAdmin,
      isActive: updatedUser.isActive,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user ID from the request (in a real app, this would come from the session)
    const userId = request.headers.get('x-user-id') || '1';
    
    // Check if the user has permission to delete users
    const canDeleteUsers = await hasPermission(userId, 'users', 'delete');
    if (!canDeleteUsers) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Get the user before deletion for logging
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: params.id },
    });

    // Log the activity
    await ActivityLogger.logDelete(
      userId,
      'user',
      params.id,
      { name: user.name, email: user.email },
      request
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}