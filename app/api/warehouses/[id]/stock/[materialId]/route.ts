import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; materialId: string } }
) {
  try {
    const { id: warehouseId, materialId } = params;

    // Get material stock for specific warehouse
    const materialStock = await prisma.materialStock.findUnique({
      where: {
        materialId_warehouseId: {
          materialId,
          warehouseId,
        },
      },
      include: {
        material: {
          include: {
            consumptionUnit: true,
            purchaseUnit: true,
          },
        },
        warehouse: true,
      },
    });

    if (!materialStock) {
      return NextResponse.json({
        success: true,
        data: {
          materialId,
          warehouseId,
          currentStock: 0,
          availableStock: 0,
          reservedStock: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: materialStock,
    });
  } catch (error) {
    console.error('Error fetching material stock:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch material stock',
      },
      { status: 500 }
    );
  }
}