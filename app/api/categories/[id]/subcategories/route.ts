import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '@/lib/services/category-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subcategories = await categoryService.getSubcategories(params.id);

    return NextResponse.json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subcategories',
      },
      { status: 500 }
    );
  }
}