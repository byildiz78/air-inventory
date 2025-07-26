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
    
    // Satış kalemi için reçete eşleştirmelerini getir
    const mappings = await prisma.recipeMapping.findMany({
      where: {
        salesItemId: sale.salesItemId || undefined,
        isActive: true,
      },
      include: {
        recipe: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
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
    
    // Stok hareketlerini transaction içinde güvenli şekilde gerçekleştir
    const stockMovements = await prisma.$transaction(async (tx) => {
      const movements = [];
      
      for (const ingredient of recipe.ingredients) {
        if (!ingredient.material) {
          continue;
        }
        
        // Stoktan düşülecek miktarı hesapla
        const reduceQuantity = ingredient.quantity * mapping.portionRatio * sale.quantity;
        
        // Reçetenin deposunu kullan, eğer yoksa malzemenin varsayılan deposunu kullan
        const warehouseId = recipe.warehouseId || ingredient.material.defaultWarehouseId;
        
        if (!warehouseId) {
          console.warn(`Warehouse not found for ingredient ${ingredient.material.name} in recipe ${recipe.name}`);
          continue;
        }
        
        // Mevcut stok bilgisini getir
        const warehouseStock = await tx.materialStock.findUnique({
          where: {
            materialId_warehouseId: {
              materialId: ingredient.materialId,
              warehouseId: warehouseId,
            }
          }
        });
        
        if (!warehouseStock) {
          console.warn(`Stock not found for material ${ingredient.material.name} in warehouse ${warehouseId}`);
          continue;
        }
        
        // Yeni stok miktarını hesapla
        const newStockQuantity = warehouseStock.currentStock - reduceQuantity;
        
        // Depo stoğunu güncelle
        await tx.materialStock.update({
          where: {
            materialId_warehouseId: {
              materialId: ingredient.materialId,
              warehouseId: warehouseId,
            }
          },
          data: {
            currentStock: newStockQuantity,
            availableStock: { decrement: reduceQuantity }, // Available stock'u da azalt
            lastUpdated: new Date(),
          }
        });
        
        // Malzeme toplam stoğunu güncelle
        await tx.material.update({
          where: {
            id: ingredient.materialId
          },
          data: {
            currentStock: {
              decrement: reduceQuantity
            }
          }
        });
        
        // Maliyet bilgilerini hesapla
        const unitCost = warehouseStock.averageCost || 0;
        const totalCost = unitCost * reduceQuantity;
        
        // Stok hareketi oluştur
        const stockMovement = await tx.stockMovement.create({
          data: {
            materialId: ingredient.materialId,
            warehouseId: warehouseId,
            quantity: -reduceQuantity,
            unitId: ingredient.unitId,
            type: 'OUT',
            reason: `Satış: ${sale.salesItem?.name || 'Bilinmeyen Ürün'} (Reçete: ${recipe.name}, Depo: ${recipe.warehouse?.name || 'Varsayılan'})`,
            userId: sale.userId,
            date: new Date(sale.date),
            stockBefore: warehouseStock.currentStock,
            stockAfter: newStockQuantity,
            unitCost: unitCost,
            totalCost: -totalCost, // Negative for OUT movement
          }
        });
        
        movements.push(stockMovement);
      }
      
      return movements;
    });
    
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
