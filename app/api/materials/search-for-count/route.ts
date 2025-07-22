import { NextRequest, NextResponse } from 'next/server';
import { HistoricalStockService } from '@/lib/services/historical-stock-service-v2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const query = searchParams.get('query') || '';
    const categoryIdsParam = searchParams.get('categoryIds');
    const subCategoryIdsParam = searchParams.get('subCategoryIds');
    const excludeIdsParam = searchParams.get('excludeIds');

    // Validate required parameters
    if (!warehouseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Warehouse ID is required',
        },
        { status: 400 }
      );
    }

    // Parse array parameters
    const categoryIds = categoryIdsParam 
      ? categoryIdsParam.split(',').filter(id => id.trim())
      : [];
    
    const subCategoryIds = subCategoryIdsParam 
      ? subCategoryIdsParam.split(',').filter(id => id.trim())
      : [];

    const excludeIds = excludeIdsParam 
      ? excludeIdsParam.split(',').filter(id => id.trim())
      : [];

    // Search materials
    const materials = await HistoricalStockService.searchMaterialsForCount(
      warehouseId,
      query,
      categoryIds,
      subCategoryIds
    );

    // Filter out excluded materials
    const filteredMaterials = materials.filter(
      material => !excludeIds.includes(material.id)
    );

    return NextResponse.json({
      success: true,
      data: {
        materials: filteredMaterials,
        totalResults: filteredMaterials.length,
        searchQuery: query,
        categoryIds,
        subCategoryIds,
      },
    });

  } catch (error) {
    console.error('Error searching materials for count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search materials',
      },
      { status: 500 }
    );
  }
}