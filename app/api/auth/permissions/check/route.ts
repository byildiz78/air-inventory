import { NextRequest, NextResponse } from 'next/server';
import { hasPermission } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, moduleCode, permissionCode } = body;

    if (!userId || !moduleCode || !permissionCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
        },
        { status: 400 }
      );
    }

    const hasAccess = await hasPermission(userId, moduleCode, permissionCode);

    return NextResponse.json({
      success: true,
      hasAccess,
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check permission',
      },
      { status: 500 }
    );
  }
}