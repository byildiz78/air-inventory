import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger/config';

export async function GET() {
  try {
    return NextResponse.json(swaggerSpec);
  } catch (error) {
    console.error('Error generating API documentation:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}