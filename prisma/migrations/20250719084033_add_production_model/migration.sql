-- CreateTable
CREATE TABLE "productions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "recipeId" TEXT NOT NULL,
    "recipeName" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "producedQuantity" REAL NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "notes" TEXT,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "productions_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "productions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "productions_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "productions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "purchaseUnitId" TEXT NOT NULL,
    "consumptionUnitId" TEXT NOT NULL,
    "supplierId" TEXT,
    "defaultTaxId" TEXT,
    "defaultWarehouseId" TEXT,
    "currentStock" REAL NOT NULL DEFAULT 0,
    "minStockLevel" REAL NOT NULL DEFAULT 0,
    "maxStockLevel" REAL,
    "lastPurchasePrice" REAL,
    "averageCost" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFinishedProduct" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "materials_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "materials_purchaseUnitId_fkey" FOREIGN KEY ("purchaseUnitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "materials_consumptionUnitId_fkey" FOREIGN KEY ("consumptionUnitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "materials_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "materials_defaultTaxId_fkey" FOREIGN KEY ("defaultTaxId") REFERENCES "taxes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "materials_defaultWarehouseId_fkey" FOREIGN KEY ("defaultWarehouseId") REFERENCES "warehouses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_materials" ("averageCost", "categoryId", "consumptionUnitId", "createdAt", "currentStock", "defaultTaxId", "defaultWarehouseId", "description", "id", "isActive", "lastPurchasePrice", "maxStockLevel", "minStockLevel", "name", "purchaseUnitId", "supplierId", "updatedAt") SELECT "averageCost", "categoryId", "consumptionUnitId", "createdAt", "currentStock", "defaultTaxId", "defaultWarehouseId", "description", "id", "isActive", "lastPurchasePrice", "maxStockLevel", "minStockLevel", "name", "purchaseUnitId", "supplierId", "updatedAt" FROM "materials";
DROP TABLE "materials";
ALTER TABLE "new_materials" RENAME TO "materials";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
