-- CreateTable: OpenProduction
CREATE TABLE "OpenProduction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productionDate" DATETIME NOT NULL,
    "producedMaterialId" TEXT NOT NULL,
    "producedQuantity" REAL NOT NULL,
    "productionWarehouseId" TEXT NOT NULL,
    "consumptionWarehouseId" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalCost" REAL NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpenProduction_producedMaterialId_fkey" FOREIGN KEY ("producedMaterialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpenProduction_productionWarehouseId_fkey" FOREIGN KEY ("productionWarehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpenProduction_consumptionWarehouseId_fkey" FOREIGN KEY ("consumptionWarehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpenProduction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: OpenProductionItem
CREATE TABLE "OpenProductionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openProductionId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpenProductionItem_openProductionId_fkey" FOREIGN KEY ("openProductionId") REFERENCES "OpenProduction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpenProductionItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex: Performance indexes
CREATE INDEX "idx_openproduction_date" ON "OpenProduction"("productionDate");
CREATE INDEX "idx_openproduction_status" ON "OpenProduction"("status");
CREATE INDEX "idx_openproduction_produced_material" ON "OpenProduction"("producedMaterialId");
CREATE INDEX "idx_openproduction_warehouses" ON "OpenProduction"("productionWarehouseId", "consumptionWarehouseId");
CREATE INDEX "idx_openproduction_user" ON "OpenProduction"("userId");
CREATE INDEX "idx_openproductionitem_material" ON "OpenProductionItem"("materialId");
CREATE INDEX "idx_openproductionitem_production" ON "OpenProductionItem"("openProductionId");