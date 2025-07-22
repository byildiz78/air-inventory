import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HistoricalStockService } from '@/lib/services/historical-stock-service-v2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.warehouseId || !body.countedBy || !body.countDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Depo, sayım yapan kişi ve sayım tarihi bilgileri gereklidir',
        },
        { status: 400 }
      );
    }

    // Validate date format
    const countDate = new Date(body.countDate);
    if (isNaN(countDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçerli bir sayım tarihi giriniz',
        },
        { status: 400 }
      );
    }

    // Check if date is not in the future
    const now = new Date();
    if (countDate > now) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sayım tarihi gelecek tarih olamaz',
        },
        { status: 400 }
      );
    }

    // Create cutoff datetime
    const countTime = body.countTime || '23:59';
    const cutoffDateTime = new Date(`${body.countDate}T${countTime}:00`);
    
    // Validate cutoff datetime
    if (isNaN(cutoffDateTime.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçerli bir sayım tarihi ve saati giriniz',
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

    // Create stock count with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock count
      const stockCount = await tx.stockCount.create({
        data: {
          countNumber,
          warehouseId: body.warehouseId,
          status: 'PLANNING',
          countDate: countDate,
          countTime: countTime,
          cutoffDateTime: cutoffDateTime,
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

      // Calculate historical stock for the specified date/time
      const historicalMaterials = await HistoricalStockService.calculateStockAtDateTime(
        body.warehouseId,
        cutoffDateTime
      );

      // Create stock count items
      const stockCountItems = await Promise.all(
        historicalMaterials.map(async (material) => {
          return tx.stockCountItem.create({
            data: {
              stockCountId: stockCount.id,
              materialId: material.id,
              systemStock: material.historicalStock,
              countedStock: 0,
              difference: -material.historicalStock,
              isCompleted: false,
              isManuallyAdded: false
            }
          });
        })
      );

      return {
        stockCount,
        itemsCreated: stockCountItems.length,
        totalHistoricalMaterials: historicalMaterials.length
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.stockCount.id,
        countNumber: result.stockCount.countNumber,
        warehouseId: result.stockCount.warehouseId,
        warehouseName: result.stockCount.warehouse.name,
        status: result.stockCount.status,
        countDate: result.stockCount.countDate,
        countTime: result.stockCount.countTime,
        cutoffDateTime: result.stockCount.cutoffDateTime,
        countedBy: result.stockCount.countedBy,
        countedByName: result.stockCount.countedUser.name,
        notes: result.stockCount.notes,
        createdAt: result.stockCount.createdAt,
        updatedAt: result.stockCount.updatedAt,
        itemsCreated: result.itemsCreated
      },
    });

  } catch (error: any) {
    console.error('Error creating stock count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Stok sayımı oluşturulurken hata oluştu: ' + error.message,
      },
      { status: 500 }
    );
  }
}