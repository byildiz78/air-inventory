-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "supplierId" TEXT,
    "currentAccountId" TEXT,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "subtotalAmount" REAL NOT NULL DEFAULT 0,
    "totalDiscountAmount" REAL NOT NULL DEFAULT 0,
    "totalTaxAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invoices_currentAccountId_fkey" FOREIGN KEY ("currentAccountId") REFERENCES "current_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_invoices" ("createdAt", "date", "dueDate", "id", "invoiceNumber", "notes", "paymentDate", "status", "subtotalAmount", "supplierId", "totalAmount", "totalDiscountAmount", "totalTaxAmount", "type", "updatedAt", "userId") SELECT "createdAt", "date", "dueDate", "id", "invoiceNumber", "notes", "paymentDate", "status", "subtotalAmount", "supplierId", "totalAmount", "totalDiscountAmount", "totalTaxAmount", "type", "updatedAt", "userId" FROM "invoices";
DROP TABLE "invoices";
ALTER TABLE "new_invoices" RENAME TO "invoices";
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
