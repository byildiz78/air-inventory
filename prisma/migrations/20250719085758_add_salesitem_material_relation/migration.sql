-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sales_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "groupId" TEXT,
    "materialId" TEXT,
    "description" TEXT,
    "basePrice" REAL,
    "taxPercent" REAL NOT NULL DEFAULT 10.0,
    "menuCode" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sales_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "sales_item_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_items_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "sales_item_groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sales_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sales_items" ("basePrice", "categoryId", "createdAt", "description", "groupId", "id", "isActive", "isAvailable", "menuCode", "name", "sortOrder", "taxPercent", "updatedAt") SELECT "basePrice", "categoryId", "createdAt", "description", "groupId", "id", "isActive", "isAvailable", "menuCode", "name", "sortOrder", "taxPercent", "updatedAt" FROM "sales_items";
DROP TABLE "sales_items";
ALTER TABLE "new_sales_items" RENAME TO "sales_items";
CREATE UNIQUE INDEX "sales_items_categoryId_name_key" ON "sales_items"("categoryId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
