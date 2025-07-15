import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const materialId = searchParams.get('materialId');
    const warehouseId = searchParams.get('warehouseId');
    const movementType = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where conditions
    const where: any = {};
    
    if (materialId && materialId !== 'all') {
      where.materialId = materialId;
    }
    
    if (warehouseId && warehouseId !== 'all') {
      where.warehouseId = warehouseId;
    }
    
    if (movementType && movementType !== 'all') {
      where.type = movementType;
    }
    
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo + 'T23:59:59');
      }
    }
    
    // Add search condition
    if (search) {
      where.OR = [
        {
          material: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          reason: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Get stock movements with related data
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        material: {
          select: {
            id: true,
            name: true
          }
        },
        unit: {
          select: {
            id: true,
            name: true,
            abbreviation: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            type: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await prisma.stockMovement.count({ where });

    // Calculate summary statistics
    const stats = await prisma.stockMovement.aggregate({
      where,
      _sum: {
        quantity: true,
        unitCost: true,
        totalCost: true
      },
      _count: {
        id: true
      }
    });

    // Get movement type breakdown
    const movementTypeBreakdown = await prisma.stockMovement.groupBy({
      by: ['type'],
      where,
      _sum: {
        quantity: true,
        totalCost: true
      },
      _count: {
        id: true
      }
    });

    // Transform movement data
    const movementData = movements.map(movement => ({
      id: movement.id,
      materialId: movement.materialId,
      materialName: movement.material?.name,
      materialCode: undefined, // Material model doesn't have code field
      unitId: movement.unitId,
      unitName: movement.unit?.name,
      unitAbbreviation: movement.unit?.abbreviation,
      warehouseId: movement.warehouseId,
      warehouseName: movement.warehouse?.name,
      userId: movement.userId,
      userName: movement.user?.name,
      invoiceId: movement.invoiceId,
      invoiceNumber: movement.invoice?.invoiceNumber,
      invoiceType: movement.invoice?.type,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      unitCost: movement.unitCost,
      totalCost: movement.totalCost,
      stockBefore: movement.stockBefore,
      stockAfter: movement.stockAfter,
      date: movement.date,
      createdAt: movement.createdAt
    }));

    // Calculate summary stats by type
    const inMovements = movementTypeBreakdown.find(m => m.type === 'IN');
    const outMovements = movementTypeBreakdown.find(m => m.type === 'OUT');
    const wasteMovements = movementTypeBreakdown.find(m => m.type === 'WASTE');
    const adjustmentMovements = movementTypeBreakdown.find(m => m.type === 'ADJUSTMENT');
    const transferMovements = movementTypeBreakdown.find(m => m.type === 'TRANSFER');

    const summary = {
      totalMovements: stats._count.id,
      totalIn: inMovements?._sum.quantity || 0,
      totalOut: Math.abs(outMovements?._sum.quantity || 0),
      totalWaste: Math.abs(wasteMovements?._sum.quantity || 0),
      totalAdjustment: adjustmentMovements?._sum.quantity || 0,
      totalTransfer: transferMovements?._sum.quantity || 0,
      totalValue: stats._sum.totalCost || 0,
      movementTypeBreakdown: movementTypeBreakdown.map(breakdown => ({
        type: breakdown.type,
        count: breakdown._count.id,
        totalQuantity: breakdown._sum.quantity || 0,
        totalValue: breakdown._sum.totalCost || 0
      }))
    };

    return NextResponse.json({
      success: true,
      data: movementData,
      summary,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      }
    });
  } catch (error) {
    console.error('Stock movements report error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock movements data' },
      { status: 500 }
    );
  }
}