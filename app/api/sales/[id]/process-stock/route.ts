import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id;
    
    // Satışı getir
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        salesItem: true,
      }
    });
    
    if (!sale) {
      return NextResponse.json({ 
        success: false, 
        error: 'Satış bulunamadı' 
      }, { status: 404 });
    }
    
    // Satış kaleminin varlığını kontrol et
    if (!sale.salesItemId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bu satış için satış kalemi bulunamadı' 
      }, { status: 404 });
    }
    
    // Satış kalemi için reçete eşleştirmelerini getir
    const mappings = await prisma.recipeMapping.findMany({
      where: {
        salesItemId: sale.salesItemId,
        isActive: true,
      },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                material: true,
                unit: true,
              }
            }
          }
        }
      }
    });
    
    if (mappings.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bu satış kalemi için aktif reçete eşleştirmesi bulunamadı' 
      }, { status: 404 });
    }
    
    // İlk eşleştirmeyi kullan
    const mapping = mappings[0];
    const recipe = mapping.recipe;
    
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Reçete veya malzemeler bulunamadı' 
      }, { status: 404 });
    }
    
    // Stok hareketlerini oluştur
    const stockMovements = [];
    
    for (const ingredient of recipe.ingredients) {
      // Malzeme kontrolü
      if (!ingredient.material) {
        continue;
      }
      
      // Stoktan düşülecek miktarı hesapla
      const reduceQuantity = ingredient.quantity * mapping.portionRatio * sale.quantity;
      
      // Malzemenin varsayılan depo stok bilgisini getir
      const warehouseId = ingredient.material.defaultWarehouseId;
      
      if (!warehouseId) {
        continue;
      }
      
      // Mevcut stok bilgisini getir
      const materialStock = await prisma.materialStock.findUnique({
        where: {
          materialId_warehouseId: {
            materialId: ingredient.materialId,
            warehouseId: warehouseId,
          }
        }
      });
      
      if (!materialStock) {
        continue;
      }
      
      // Yeni stok miktarını hesapla
      const newStockQuantity = materialStock.currentStock - reduceQuantity;
      
      // Depo stoğunu güncelle
      await prisma.materialStock.update({
        where: {
          materialId_warehouseId: {
            materialId: ingredient.materialId,
            warehouseId: warehouseId,
          }
        },
        data: {
          currentStock: newStockQuantity,
          lastUpdated: new Date(),
        }
      });
      
      // Malzeme toplam stoğunu güncelle
      await prisma.material.update({
        where: {
          id: ingredient.materialId
        },
        data: {
          currentStock: {
            decrement: reduceQuantity
          }
        }
      });
      
      // Stok hareketi oluştur
      const stockMovement = await prisma.stockMovement.create({
        data: {
          materialId: ingredient.materialId,
          warehouseId: warehouseId,
          quantity: -reduceQuantity,
          unitId: ingredient.unitId,
          type: 'OUT', // Stok çıkışı
          reason: `Satış: ${sale.salesItem?.name || sale.itemName} (ID: ${saleId})`,
          userId: sale.userId,
          date: new Date(sale.date),
          stockBefore: materialStock.currentStock,
          stockAfter: newStockQuantity,
        }
      });
      
      stockMovements.push(stockMovement);
    }
    
    // Satışı güncelle - reçete ID'sini ekle
    await prisma.sale.update({
      where: {
        id: saleId
      },
      data: {
        recipeId: recipe.id
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: {
        sale,
        stockMovements,
        message: 'Stok hareketleri başarıyla işlendi'
      }
    });
    
  } catch (error) {
    console.error('Stok hareketleri işlenirken hata:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Stok hareketleri işlenirken bir hata oluştu' 
    }, { status: 500 });
  }
}
