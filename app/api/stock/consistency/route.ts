import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    // Get all materials with their stock information
    const materials = await prisma.material.findMany({
      include: {
        materialStocks: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Calculate stock consistency for each material
    const consistencyData = materials.map(material => {
      // Calculate total stock from all warehouses
      const totalWarehouseStock = material.materialStocks.reduce(
        (sum, stock) => sum + (stock.currentStock || 0), 
        0
      );
      
      // Get system stock (assuming it's stored in Material table)
      const systemStock = material.currentStock || 0;
      
      // Calculate difference
      const difference = totalWarehouseStock - systemStock;
      const isConsistent = Math.abs(difference) < 0.01; // Allow for small rounding differences
      
      return {
        materialId: material.id,
        materialName: material.name,
        materialCode: material.code,
        systemStock: systemStock,
        totalStock: totalWarehouseStock,
        difference: difference,
        isConsistent: isConsistent,
        warehouseStocks: material.materialStocks.map(stock => ({
          warehouseId: stock.warehouseId,
          warehouseName: stock.warehouse.name,
          currentStock: stock.currentStock || 0,
          availableStock: stock.availableStock || 0,
          reservedStock: stock.reservedStock || 0
        }))
      };
    });

    return NextResponse.json({
      success: true,
      data: consistencyData
    });

  } catch (error: any) {
    console.error('Error checking stock consistency:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok tutarlılığı kontrol edilirken bir hata oluştu'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { materialId, fixAll } = body;

    if (fixAll) {
      // Fix all inconsistencies
      const materials = await prisma.material.findMany({
        include: {
          materialStocks: true
        }
      });

      let fixedCount = 0;
      const totalCount = materials.length;

      for (const material of materials) {
        const totalWarehouseStock = material.materialStocks.reduce(
          (sum, stock) => sum + (stock.currentStock || 0), 
          0
        );
        
        const systemStock = material.currentStock || 0;
        const difference = Math.abs(totalWarehouseStock - systemStock);
        
        if (difference >= 0.01) {
          // Update system stock to match warehouse total
          await prisma.material.update({
            where: { id: material.id },
            data: { currentStock: totalWarehouseStock }
          });
          fixedCount++;
        }
      }

      // Log the activity
      const userId = request.headers.get('x-user-id') || '1';
      await ActivityLogger.logCreate(
        userId,
        'stock_operation',
        'fix_all_consistency',
        {
          fixedCount: fixedCount,
          totalCount: totalCount,
          operation: 'fix_all_stock_consistency'
        },
        request
      );

      return NextResponse.json({
        success: true,
        data: {
          fixed: fixedCount,
          total: totalCount,
          message: `${fixedCount}/${totalCount} tutarsızlık düzeltildi`
        }
      });
    }

    if (materialId) {
      // Fix single material inconsistency
      const material = await prisma.material.findUnique({
        where: { id: materialId },
        include: {
          materialStocks: true
        }
      });

      if (!material) {
        return NextResponse.json(
          {
            success: false,
            error: 'Malzeme bulunamadı'
          },
          { status: 404 }
        );
      }

      const totalWarehouseStock = material.materialStocks.reduce(
        (sum, stock) => sum + (stock.currentStock || 0), 
        0
      );

      await prisma.material.update({
        where: { id: materialId },
        data: { currentStock: totalWarehouseStock }
      });

      // Log the activity
      const userId = request.headers.get('x-user-id') || '1';
      await ActivityLogger.logUpdate(
        userId,
        'stock_operation',
        materialId,
        {
          before: { currentStock: material.currentStock },
          after: { currentStock: totalWarehouseStock },
          operation: 'fix_stock_consistency'
        },
        request
      );

      return NextResponse.json({
        success: true,
        data: {
          materialId,
          oldStock: material.currentStock,
          newStock: totalWarehouseStock,
          message: 'Malzeme stoku düzeltildi'
        }
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'materialId veya fixAll parametresi gerekli'
      },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error fixing stock consistency:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stok tutarlılığı düzeltilirken bir hata oluştu'
      },
      { status: 500 }
    );
  }
}