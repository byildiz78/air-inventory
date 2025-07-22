import { prisma } from '@/lib/prisma';

export interface HistoricalStockMaterial {
  id: string;
  name: string;
  code: string | null;
  barcode: string | null;
  historicalStock: number;
  categoryId: string;
  categoryName: string;
  mainCategoryId: string | null;
  mainCategoryName: string | null;
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
  lastMovementDate: Date | null;
}

export interface MaterialSearchResult {
  id: string;
  name: string;
  code: string | null;
  barcode: string | null;
  categoryId: string;
  categoryName: string;
  mainCategoryId: string | null;
  mainCategoryName: string | null;
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
  currentStock?: number;
}

export class HistoricalStockService {
  /**
   * Belirli bir tarih ve saatte depo için stok durumunu hesaplar
   */
  static async calculateStockAtDateTime(
    warehouseId: string,
    cutoffDateTime: Date
  ): Promise<HistoricalStockMaterial[]> {
    try {
      // Get all materials first
      const materials = await prisma.material.findMany({
        include: {
          category: {
            include: { parent: true }
          },
          consumptionUnit: true,
        },
        orderBy: { name: 'asc' }
      });

      // Calculate historical stock for each material
      const result: HistoricalStockMaterial[] = [];
      
      for (const material of materials) {
        // Get stock movements for this material at this warehouse up to cutoff date
        const movements = await prisma.stockMovement.findMany({
          where: {
            materialId: material.id,
            warehouseId: warehouseId,
            date: {
              lte: cutoffDateTime
            }
          },
          orderBy: { date: 'asc' }
        });

        // Calculate historical stock using a simple approach
        let historicalStock = 0;
        let lastMovementDate: Date | null = null;

        // Calculate stock from movements
        movements.forEach((movement) => {
          const qty = Number(movement.quantity);
          
          if (movement.type === 'IN') {
            historicalStock += qty;
          } else if (movement.type === 'OUT') {
            historicalStock -= Math.abs(qty);
          } else if (movement.type === 'TRANSFER') {
            historicalStock += qty;
          }
          
          lastMovementDate = movement.date;
        });

        // Only include materials with positive historical stock
        if (historicalStock > 0) {
          result.push({
            id: material.id,
            name: material.name,
            code: null,
            barcode: null,
            historicalStock: historicalStock,
            categoryId: material.categoryId,
            categoryName: material.category.name,
            mainCategoryId: material.category.parentId,
            mainCategoryName: material.category.parent?.name || material.category.name,
            unitId: material.consumptionUnitId,
            unitName: material.consumptionUnit.name,
            unitAbbreviation: material.consumptionUnit.abbreviation,
            lastMovementDate: lastMovementDate
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Error calculating historical stock:', error);
      throw new Error('Failed to calculate historical stock');
    }
  }

  /**
   * Sayım için ürün arama - kategori filtreleme ve metin arama
   */
  static async searchMaterialsForCount(
    warehouseId: string,
    searchQuery: string = '',
    categoryIds: string[] = [],
    subCategoryIds: string[] = []
  ): Promise<MaterialSearchResult[]> {
    try {
      const whereConditions: any = {};

      // Metin arama
      if (searchQuery.trim()) {
        whereConditions.name = { contains: searchQuery.trim(), mode: 'insensitive' };
      }

      // Kategori filtreleme
      if (categoryIds.length > 0 || subCategoryIds.length > 0) {
        const allCategoryIds = [...categoryIds, ...subCategoryIds];
        whereConditions.categoryId = { in: allCategoryIds };
      }

      const materials = await prisma.material.findMany({
        where: whereConditions,
        include: {
          category: {
            include: { parent: true }
          },
          consumptionUnit: true,
        },
        orderBy: { name: 'asc' },
        take: 100, // Limit results for performance
      });

      return materials.map(material => ({
        id: material.id,
        name: material.name,
        code: null,
        barcode: null,
        categoryId: material.categoryId,
        categoryName: material.category.name,
        mainCategoryId: material.category.parentId,
        mainCategoryName: material.category.parent?.name || material.category.name,
        unitId: material.consumptionUnitId,
        unitName: material.consumptionUnit.name,
        unitAbbreviation: material.consumptionUnit.abbreviation,
      }));
    } catch (error) {
      console.error('Error searching materials for count:', error);
      throw new Error('Failed to search materials');
    }
  }

  /**
   * Mevcut stok sayımında olan malzemelerin ID'lerini getir
   */
  static async getExistingCountMaterialIds(stockCountId: string): Promise<string[]> {
    try {
      const items = await prisma.stockCountItem.findMany({
        where: { stockCountId },
        select: { materialId: true }
      });

      return items.map(item => item.materialId);
    } catch (error) {
      console.error('Error getting existing count material IDs:', error);
      throw new Error('Failed to get existing materials');
    }
  }
}