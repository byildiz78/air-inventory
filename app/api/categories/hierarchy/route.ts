import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '@/lib/services/category-service';

export async function GET(request: NextRequest) {
  try {
    const hierarchy = await categoryService.getCategoryHierarchy();

    return NextResponse.json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    console.error('Error fetching category hierarchy:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category hierarchy',
      },
      { status: 500 }
    );
  }
}