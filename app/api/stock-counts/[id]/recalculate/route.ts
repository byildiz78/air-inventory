import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HistoricalStockService } from '@/lib/services/historical-stock-service-v2';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stockCountId = params.id;
    const body = await request.json();

    // Check if stock count exists and is in valid status
    const stockCount = await prisma.stockCount.findUnique({
      where: { id: stockCountId },
      include: { 
        warehouse: true,
        items: {
          where: { isManuallyAdded: false }, // Only get auto-generated items
          select: { id: true, materialId: true }
        }
      }
    });

    if (!stockCount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stok sayımı bulunamadı',
        },
        { status: 404 }
      );
    }

    if (!['PLANNING', 'IN_PROGRESS'].includes(stockCount.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bu durumda sayım yeniden hesaplanamaz',
        },
        { status: 400 }
      );
    }

    // Update cutoff datetime if provided
    let cutoffDateTime = stockCount.cutoffDateTime;
    
    if (body.countDate && body.countTime) {
      const countDate = new Date(body.countDate);
      const countTime = body.countTime;
      
      if (isNaN(countDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Geçerli bir sayım tarihi giriniz',
          },
          { status: 400 }
        );
      }
      
      // Extract just the date part if it's a full ISO string
      const dateOnly = body.countDate.split('T')[0];
      cutoffDateTime = new Date(`${dateOnly}T${countTime}:00`);
      
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
      
      // Update stock count with new datetime
      await prisma.stockCount.update({
        where: { id: stockCountId },
        data: {
          countDate: countDate,
          countTime: countTime,
          cutoffDateTime: cutoffDateTime
        }
      });
    }

    if (!cutoffDateTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sayım tarihi ve saati belirtilmelidir',
        },
        { status: 400 }
      );
    }

    // Recalculate historical stock
    console.log('Recalculating historical stock for:', {
      warehouseId: stockCount.warehouseId,
      cutoffDateTime: cutoffDateTime.toISOString(),
      originalCutoff: stockCount.cutoffDateTime?.toISOString()
    });
    
    const result = await prisma.$transaction(async (tx) => {
      // Calculate new historical stock
      const historicalMaterials = await HistoricalStockService.calculateStockAtDateTime(
        stockCount.warehouseId,
        cutoffDateTime
      );
      
      console.log('Historical materials calculated:', historicalMaterials.length, 'materials with positive stock');

      // First, get existing user entries to preserve them BEFORE deletion
      // Include items where user has made changes (countedStock > 0 OR (countedStock = 0 AND difference != 0))
      const existingItems = await tx.stockCountItem.findMany({
        where: {
          stockCountId: stockCountId,
          isManuallyAdded: false,
          OR: [
            { countedStock: { gt: 0 } }, // User entered positive value
            { 
              AND: [
                { countedStock: 0 },
                { difference: { not: 0 } }, // User intentionally counted as zero (difference should be negative)
                { isCompleted: true } // Only if user actually completed the count
              ]
            }
          ]
        },
        select: {
          id: true,
          materialId: true,
          countedStock: true,
          systemStock: true,
          difference: true,
          reason: true,
          isCompleted: true
        }
      });

      console.log('Found existing items BEFORE deletion:', existingItems.length);
      console.log('Sample existing items:', existingItems.slice(0, 3));
      
      // Debug zero counts
      const zeroCounts = existingItems.filter(item => item.countedStock === 0 && item.difference !== 0);
      console.log(`Preserving ${zeroCounts.length} zero-counted items:`, zeroCounts.slice(0, 3).map(item => ({
        materialId: item.materialId,
        countedStock: item.countedStock,
        systemStock: item.systemStock,
        difference: item.difference,
        isCompleted: item.isCompleted
      })));

      const existingEntries = new Map(
        existingItems.map(item => [
          item.materialId, 
          {
            countedStock: item.countedStock,
            reason: item.reason,
            isCompleted: item.isCompleted
          }
        ])
      );

      // Now delete existing auto-generated items (keep manually added ones)
      await tx.stockCountItem.deleteMany({
        where: {
          stockCountId: stockCountId,
          isManuallyAdded: false
        }
      });

      console.log('Existing entries count:', existingEntries.size);
      console.log('Historical materials count:', historicalMaterials.length);
      console.log('Sample existing entry:', Array.from(existingEntries.entries())[0]);
      
      // Debug key types and matching
      const sampleHistorical = historicalMaterials[0];
      const sampleExisting = existingItems[0];
      if (sampleHistorical && sampleExisting) {
        console.log(`Key type check: historical="${sampleHistorical.id}"(${typeof sampleHistorical.id}) vs existing="${sampleExisting.materialId}"(${typeof sampleExisting.materialId})`);
        console.log('Keys match:', sampleHistorical.id === sampleExisting.materialId);
      }

      // Create new items with updated historical stock but preserve user entries
      const newItems = await Promise.all(
        historicalMaterials.map(async (material) => {
          const existingEntry = existingEntries.get(material.id);
          const countedStock = existingEntry ? existingEntry.countedStock : 0;
          const isCompleted = existingEntry ? existingEntry.isCompleted : false;
          
          // Debug for first few materials only
          if (historicalMaterials.indexOf(material) < 2) {
            console.log(`Debug Material ${material.id}: has_key=${existingEntries.has(material.id)} entry=${!!existingEntry}`);
          }
          
          if (existingEntry) {
            console.log(`✓ Preserving entry for material ${material.id}: countedStock=${countedStock}, isCompleted=${isCompleted}, reason=${existingEntry.reason}`);
          } else {
            console.log(`✗ No existing entry found for material ${material.id}, creating new with countedStock=0`);
          }
          
          return tx.stockCountItem.create({
            data: {
              stockCountId: stockCountId,
              materialId: material.id,
              systemStock: material.historicalStock,
              countedStock: countedStock,
              difference: countedStock - material.historicalStock,
              reason: existingEntry?.reason || null,
              isCompleted: isCompleted,
              isManuallyAdded: false
            }
          });
        })
      );

      // Update manually added items' historical stock
      const manualItems = await tx.stockCountItem.findMany({
        where: {
          stockCountId: stockCountId,
          isManuallyAdded: true
        }
      });

      for (const manualItem of manualItems) {
        // Find the material's historical stock
        const materialHistorical = historicalMaterials.find(
          m => m.id === manualItem.materialId
        );
        
        const newSystemStock = materialHistorical?.historicalStock || 0;
        const newDifference = manualItem.countedStock - newSystemStock;
        
        await tx.stockCountItem.update({
          where: { id: manualItem.id },
          data: {
            systemStock: newSystemStock,
            difference: newDifference
          }
        });
      }

      console.log(`Transaction completed - created ${newItems.length} items, updated ${manualItems.length} manual items`);
      
      // Verify what was actually created
      const finalItems = await tx.stockCountItem.findMany({
        where: { stockCountId: stockCountId },
        select: {
          id: true,
          materialId: true,
          countedStock: true,
          isCompleted: true,
          isManuallyAdded: true
        }
      });
      
      console.log(`Final verification: ${finalItems.length} total items in database`);
      console.log('Completed items:', finalItems.filter(item => item.isCompleted).length);

      return {
        newItemsCount: newItems.length,
        manualItemsUpdated: manualItems.length,
        totalHistoricalMaterials: historicalMaterials.length,
        finalItemsCount: finalItems.length
      };
    });

    console.log(`Recalculate result:`, result);

    return NextResponse.json({
      success: true,
      data: {
        stockCountId: stockCountId,
        cutoffDateTime: cutoffDateTime.toISOString(),
        newItemsCreated: result.newItemsCount,
        manualItemsUpdated: result.manualItemsUpdated,
        totalHistoricalMaterials: result.totalHistoricalMaterials
      },
      message: 'Sayım başarıyla yeniden hesaplandı'
    });

  } catch (error: any) {
    console.error('Error recalculating stock count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Sayım yeniden hesaplanırken hata oluştu: ' + error.message,
      },
      { status: 500 }
    );
  }
}