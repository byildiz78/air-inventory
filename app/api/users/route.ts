import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { hasPermission } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
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

    const users = await prisma.user.findMany({
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

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Get the user ID from the request (in a real app, this would come from the session)
    const userId = request.headers.get('x-user-id') || '1';
    
    // Check if the user has permission to create users
    const canCreateUsers = await hasPermission(userId, 'users', 'create');
    if (!canCreateUsers) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'STAFF',
        isSuperAdmin: data.isSuperAdmin || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    // Log the activity
    await ActivityLogger.logCreate(
      userId,
      'user',
      newUser.id,
      { name: newUser.name, email: newUser.email, role: newUser.role },
      request
    );

    return NextResponse.json(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isSuperAdmin: newUser.isSuperAdmin,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}