import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been deprecated. Please use /api/expenses/hierarchy for the new hierarchical expense structure.',
      deprecatedEndpoint: true,
      newEndpoint: '/api/expenses/hierarchy'
    },
    { status: 410 }
  );
});

export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been deprecated. Please use the new hierarchical expense structure.',
      deprecatedEndpoint: true,
      newEndpoint: '/api/expenses/hierarchy'
    },
    { status: 410 }
  );
});