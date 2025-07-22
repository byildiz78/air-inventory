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
      console.log('HistoricalStockService: Starting calculation', { warehouseId, cutoffDateTime });
      const materials = await prisma.$queryRaw<HistoricalStockMaterial[]>`
        SELECT 
          m.id,
          m.name,
          NULL as code,
          NULL as barcode,
          m."categoryId",
          c.name as "categoryName",
          c."parentId" as "mainCategoryId",
          COALESCE(parent.name, c.name) as "mainCategoryName",
          m."consumptionUnitId" as "unitId",
          cu.name as "unitName",
          cu.abbreviation as "unitAbbreviation",
          COALESCE(
            SUM(
              CASE 
                WHEN sm.type IN ('PURCHASE', 'TRANSFER_IN', 'PRODUCTION', 'ADJUSTMENT_IN') 
                THEN sm.quantity
                WHEN sm.type IN ('CONSUMPTION', 'TRANSFER_OUT', 'ADJUSTMENT_OUT')
                THEN -sm.quantity
                ELSE 0 
              END
            ), 
            0
          ) as "historicalStock",
          MAX(sm.date) as "lastMovementDate"
        FROM materials m
        LEFT JOIN stock_movements sm ON m.id = sm."materialId" 
          AND sm."warehouseId" = ${warehouseId}
          AND sm.date <= ${cutoffDateTime}
        JOIN categories c ON m."categoryId" = c.id
        LEFT JOIN categories parent ON c."parentId" = parent.id
        JOIN units cu ON m."consumptionUnitId" = cu.id
        GROUP BY 
          m.id, m.name, m.code, m.barcode, m."categoryId", 
          c.name, c."parentId", parent.name,
          m."consumptionUnitId", cu.name, cu.abbreviation
        HAVING 
          COALESCE(
            SUM(
              CASE 
                WHEN sm.type IN ('PURCHASE', 'TRANSFER_IN', 'PRODUCTION', 'ADJUSTMENT_IN') 
                THEN sm.quantity
                WHEN sm.type IN ('CONSUMPTION', 'TRANSFER_OUT', 'ADJUSTMENT_OUT')
                THEN -sm.quantity
                ELSE 0 
              END
            ), 
            0
          ) > 0
        ORDER BY m.name ASC
      `;

      // Convert Decimal values to numbers
      return materials.map(material => ({
        ...material,
        historicalStock: Number(material.historicalStock),
      }));
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