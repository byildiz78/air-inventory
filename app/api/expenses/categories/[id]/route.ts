import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

export const GET = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been deprecated. Please use the new hierarchical expense structure.'
    },
    { status: 410 } // 410 Gone - resource is no longer available
  );
});

export const PUT = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been deprecated. Please use the new hierarchical expense structure.'
    },
    { status: 410 }
  );
});

export const DELETE = AuthMiddleware.withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been deprecated. Please use the new hierarchical expense structure.'
    },
    { status: 410 }
  );
});