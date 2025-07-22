import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HistoricalStockService } from '@/lib/services/historical-stock-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const status = searchParams.get('status') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    // Build filter conditions
    const whereConditions: any = {
      OR: [
        { countNumber: { contains: search } },
        { notes: { contains: search } }
      ]
    };

    if (warehouseId && warehouseId !== 'all') {
      whereConditions.warehouseId = warehouseId;
    }

    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    if (dateFrom) {
      whereConditions.countDate = {
        ...(whereConditions.countDate || {}),
        gte: new Date(dateFrom)
      };
    }

    if (dateTo) {
      whereConditions.countDate = {
        ...(whereConditions.countDate || {}),
        lte: new Date(dateTo)
      };
    }

    // Get stock counts from the database
    const stockCounts = await prisma.stockCount.findMany({
      where: whereConditions,
      include: {
        warehouse: true,
        countedUser: {
          select: {
            id: true,
            name: true
          }
        },
        approvedUser: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            material: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the expected format in the frontend
    const formattedStockCounts = stockCounts.map((count: any) => ({
      id: count.id,
      countNumber: count.countNumber,
      warehouseId: count.warehouseId,
      warehouseName: count.warehouse.name,
      status: count.status,
      countDate: count.countDate,
      countTime: count.countTime,
      countedBy: count.countedBy,
      countedByName: count.countedUser.name,
      approvedBy: count.approvedBy,
      approvedByName: count.approvedUser?.name,
      notes: count.notes,
      createdAt: count.createdAt,
      updatedAt: count.updatedAt,
      itemCount: count.items.length,
      completedItemCount: count.items.filter((item: any) => item.isCompleted).length
    }));

    return NextResponse.json({
      success: true,
      data: formattedStockCounts,
    });
  } catch (error: any) {
    console.error('Error fetching stock counts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok sayımları alınırken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.warehouseId || !body.countedBy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Depo ve sayım yapan kişi bilgileri gereklidir',
        },
        { status: 400 }
      );
    }

    // Generate count number (YYYY-MM-DD-XXX format)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Get count of today's stock counts to generate sequence
    const todaysCounts = await prisma.stockCount.count({
      where: {
        countNumber: {
          startsWith: dateStr
        }
      }
    });
    
    const countNumber = `${dateStr}-${(todaysCounts + 1).toString().padStart(3, '0')}`;

    // Create stock count
    const stockCount = await prisma.stockCount.create({
      data: {
        countNumber,
        warehouseId: body.warehouseId,
        status: 'PLANNING',
        countDate: new Date(),
        countTime: body.countTime || new Date().toTimeString().split(' ')[0].substring(0, 5),
        countedBy: body.countedBy,
        notes: body.notes || null
      },
      include: {
        warehouse: true,
        countedUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get all materials that have stock in this warehouse
    const materialStocks = await prisma.materialStock.findMany({
      where: {
        warehouseId: body.warehouseId,
        currentStock: {
          gt: 0  // Only include materials with positive stock
        }
      },
      include: {
        material: {
          include: {
            consumptionUnit: true
          }
        }
      }
    });

    // Create stock count items for all materials in the warehouse
    if (materialStocks.length > 0) {
      const stockCountItems = await Promise.all(
        materialStocks.map(async (materialStock) => {
          const item = await prisma.stockCountItem.create({
            data: {
              stockCountId: stockCount.id,
              materialId: materialStock.materialId,
              systemStock: materialStock.currentStock,
              countedStock: 0,
              difference: -materialStock.currentStock, // Initially, difference is negative of system stock
              isCompleted: false
            },
            include: {
              material: {
                include: {
                  consumptionUnit: true
                }
              }
            }
          });
          
          // Format the item for response
          return {
            id: item.id,
            stockCountId: item.stockCountId,
            materialId: item.materialId,
            materialName: item.material.name,
            systemStock: item.systemStock,
            countedStock: item.countedStock,
            difference: item.difference,
            reason: item.reason,
            countedAt: item.countedAt,
            isCompleted: item.isCompleted,
            unit: item.material.consumptionUnit?.abbreviation || 'Adet',
            expectedStock: item.systemStock // Expected stock is the same as system stock
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          ...stockCount,
          items: stockCountItems
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: stockCount
    });
  } catch (error: any) {
    console.error('Error creating stock count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok sayımı oluşturulurken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}
