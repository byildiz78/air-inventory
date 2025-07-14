# 🚀 SQLite Veritabanı Geçiş Planı - TODO Listesi

## 📋 Proje Durumu Özeti

**Mevcut Durum:** Proje tamamen mock data kullanıyor  
**Hedef:** SQLite veritabanına geçiş  
**Prisma Schema:**  Hazır (11 tablo)  
**Data Service Layer:**  Hazır (abstraction mevcut)  
**Tahmini Süre:** 3-5 gün  

---

## 🎯 PHASE 1: Veritabanı Kurulumu ve Temel Modüller

###  1.1 Veritabanı Kurulumu
- [x] `.env` dosyası oluştur 
  ```bash
  echo 'DATABASE_URL="file:./dev.db"' > .env
  ```
- [x] Prisma migrasyonları oluştur 
  ```bash
  npx prisma migrate dev --name init
  ```
- [x] Prisma client güncelle 
  ```bash
  npx prisma generate
  ```
- [x] Veritabanının oluştuğunu doğrula 
  ```bash
  npx prisma studio
  ```
- **Status:**  COMPLETED - SQLite database created successfully at dev.db

###  1.2 Temel CRUD İmplementasyonu

#### 👤 User Service (lib/data-service.ts:55-153)
- [x] `userService.getAll()` - Prisma query ile değiştir 
- [x] `userService.getById()` - Prisma query ile değiştir  
- [x] `userService.getByEmail()` - Prisma query ile değiştir 
- [x] `userService.create()` - Prisma query ile değiştir 
- [x] `userService.update()` - Prisma query ile değiştir 
- [x] `userService.delete()` - Prisma query ile değiştir 
- **Status:**  COMPLETED - All CRUD operations implemented with error handling

#### 📂 Category Service (lib/data-service.ts:159-258)
- [x] `categoryService.getAll()` - Prisma query ile değiştir 
- [x] `categoryService.getById()` - Prisma query ile değiştir 
- [x] `categoryService.create()` - Prisma query ile değiştir 
- [x] `categoryService.update()` - Prisma query ile değiştir 
- [x] `categoryService.delete()` - Prisma query ile değiştir 
- **Status:**  COMPLETED - Hierarchical relations included

#### 📏 Unit Service (lib/data-service.ts:264-314)
- [x] `unitService.getAll()` - Prisma query ile değiştir 
- [x] `unitService.getById()` - Prisma query ile değiştir 
- [x] `unitService.getByType()` - Prisma query ile değiştir 
- **Status:**  COMPLETED - Base unit relations included

#### 🏢 Supplier Service (lib/data-service.ts:320-407)
- [x] `supplierService.getAll()` - Prisma query ile değiştir 
- [x] `supplierService.getById()` - Prisma query ile değiştir 
- [x] `supplierService.create()` - Prisma query ile değiştir 
- [x] `supplierService.update()` - Prisma query ile değiştir 
- [x] `supplierService.delete()` - Prisma query ile değiştir 
- **Status:**  COMPLETED - All CRUD operations implemented

###  1.3 Data Service Switch
- [x] `lib/data-service.ts:50` - `USE_PRISMA = true` yap 
- [x] Mock interfaces updated with Prisma compatibility 
- **Status:**  COMPLETED - Phase 1 successfully migrated to Prisma!

---

## 🎯 PHASE 2: Envanter Yönetimi Modülleri

### 📦 2.1 Material Service (lib/data-service.ts:287-383)
- [ ] `materialService.getAll()` - Include relations (category, supplier, units)
- [ ] `materialService.getById()` - Include relations
- [ ] `materialService.getByCategory()` - Prisma query ile değiştir
- [ ] `materialService.getLowStock()` - Prisma query ile değiştir
- [ ] `materialService.create()` - Transaction kullan
- [ ] `materialService.update()` - Transaction kullan
- [ ] `materialService.updateStock()` - Complex stock logic
- [ ] `materialService.delete()` - Cascade delete kontrolleri

### 🏭 2.2 Warehouse ve Stock Yönetimi
- [ ] Warehouse CRUD operasyonları
- [ ] MaterialStock CRUD operasyonları
- [ ] WarehouseTransfer CRUD operasyonları
- [ ] Stock consistency check algoritmaları

### 💰 2.1 Tax Service (lib/data-service.ts:584-713)  COMPLETED
- [x] `taxService.getAll()` - Prisma query ile değiştir 
- [x] `taxService.getById()` - Prisma query ile değiştir 
- [x] `taxService.getByType()` - Prisma query ile değiştir 
- [x] `taxService.getDefault()` - Prisma query ile değiştir 
- [x] `taxService.getActive()` - Prisma query ile değiştir 
- [x] `taxService.create()` - Prisma query ile değiştir 
- [x] `taxService.update()` - Prisma query ile değiştir 
- [x] `taxService.delete()` - Prisma query ile değiştir 
- **Status:**  COMPLETED - All tax operations with business logic

### 📦 2.2 Material Service (lib/data-service.ts:413-630)  COMPLETED
- [x] `materialService.getAll()` - Complex relations with includes 
- [x] `materialService.getById()` - Full relation includes 
- [x] `materialService.getByCategory()` - Category filtering 
- [x] `materialService.getLowStock()` - Application-level filtering 
- [x] `materialService.create()` - Complex data creation 
- [x] `materialService.update()` - Comprehensive field updates 
- [x] `materialService.updateStock()` - Direct stock updates 
- [x] `materialService.delete()` - Safe deletion 
- **Status:**  COMPLETED - Core material management ready

---

## 🎯 PHASE 3: Reçete ve Satış Modülleri

### 🍳 3.1 Recipe Service (lib/data-service.ts:389-452)
- [ ] `recipeService.getAll()` - Include ingredients
- [ ] `recipeService.getById()` - Include ingredients
- [ ] `recipeService.getIngredients()` - Include material details
- [ ] `recipeService.create()` - Transaction ile ingredients
- [ ] `recipeService.update()` - Transaction ile ingredients
- [ ] `recipeService.delete()` - Cascade delete

### 🛒 3.2 Sales Item Services (lib/data-service.ts:681-1002)
- [ ] `salesItemCategoryService` - Tüm CRUD operasyonları
- [ ] `salesItemGroupService` - Tüm CRUD operasyonları  
- [ ] `salesItemService` - Tüm CRUD operasyonları
- [ ] `recipeMappingService` - Complex cost calculations

### 📊 3.3 Cost Calculation Service (lib/data-service.ts:544-568)
- [ ] `calculateRecipeCost()` - Complex aggregation queries
- [ ] `calculateMaterialAverageCost()` - Purchase history analysis
- [ ] `updateRecipeCosts()` - Batch updates with transactions

---

## 🎯 PHASE 4: Fatura ve Stok Hareketleri

### 🧾 4.1 Invoice Service (lib/data-service.ts:611-675)
- [ ] `invoiceService.getAll()` - Include items and relations
- [ ] `invoiceService.getById()` - Include full details
- [ ] `invoiceService.create()` - Complex transaction logic
- [ ] `invoiceService.update()` - Business logic validation
- [ ] `invoiceService.delete()` - Stock movement reversal

### 📈 4.2 Stock Movement Tracking
- [ ] Otomatik stok hareket kayıtları
- [ ] Stock before/after hesaplamaları
- [ ] Transaction rollback mekanizmaları

### 📦 4.3 Stock Count Service (lib/data-service.ts:1007-1214)
- [ ] `stockCountService.getAll()` - Include items
- [ ] `stockCountService.startCount()` - Complex initialization
- [ ] `stockCountService.completeCount()` - Stock adjustments
- [ ] `stockCountService.updateItem()` - Difference calculations

---

## 🎯 PHASE 5: Satış ve Analitik Modüller

### 💸 5.1 Sales Service (lib/data-service.ts:1220-1388)
- [ ] `salesService.getAll()` - Include sales item details
- [ ] `salesService.create()` - Cost calculation ve stock reduction
- [ ] `salesService.processStockMovements()` - Complex stock logic
- [ ] Profit margin calculations

### 📊 5.2 Stock Consistency Service (lib/data-service.ts:574-605)
- [ ] `checkConsistency()` - Multi-warehouse validation
- [ ] `fixInconsistencies()` - Automated corrections
- [ ] `getStockAlerts()` - Real-time monitoring
- [ ] `recalculateAverageCosts()` - Batch calculations

---

## 🎯 PHASE 6: Veri Migrasyonu ve Optimizasyon

### 📥 6.1 Seed Data Oluşturma
- [ ] `prisma/seed.ts` dosyası oluştur
- [ ] Mock data'yı sıralı olarak insert et:
  ```typescript
  // Dependency sırası:
  // 1. Users, Categories, Units, Suppliers, Taxes, Warehouses
  // 2. Materials, Recipes
  // 3. MaterialStocks, RecipeIngredients
  // 4. SalesItems, RecipeMappings
  // 5. Invoices, Sales, StockMovements
  ```
- [ ] Referential integrity kontrolleri
- [ ] `package.json`'a seed script ekle

### 🔧 6.2 Performance Optimizasyonu
- [ ] Critical queries için indexler ekle
- [ ] N+1 query problemlerini çöz
- [ ] Pagination implementasyonu
- [ ] Connection pooling ayarları

### 🧪 6.3 Test ve Doğrulama
- [ ] Tüm CRUD operasyonlarını test et
- [ ] Stok hesaplamalarını doğrula
- [ ] Maliyet hesaplamalarını kontrol et
- [ ] Performance benchmarking

---

## 🚨 Kritik Dikkat Edilmesi Gerekenler

### ⚠️ Veri Tutarlılığı
- [ ] **Foreign Key Constraints** - Referans bütünlüğü
- [ ] **Stock Calculations** - Multi-warehouse stok toplamları
- [ ] **Cost Calculations** - Reçete maliyet hesaplamaları
- [ ] **Transaction Management** - Critical operations

### 🔒 Business Logic Korunması
- [ ] **Permission System** - Module bazlı yetkilendirme
- [ ] **Activity Logging** - Tüm değişiklik logları
- [ ] **Stock Movement Tracking** - Audit trail
- [ ] **Cost Algorithms** - Existing business rules

### 🛡️ Error Handling
- [ ] Database connection failures
- [ ] Transaction rollback scenarios
- [ ] Validation error handling
- [ ] Constraint violation handling

---

## 📚 Prisma Query Örnekleri

### Temel CRUD
```typescript
// GET with relations
const materials = await prisma.material.findMany({
  include: {
    category: true,
    supplier: true,
    purchaseUnit: true,
    consumptionUnit: true
  }
})

// Complex filtering
const lowStockMaterials = await prisma.material.findMany({
  where: {
    currentStock: {
      lte: prisma.material.fields.minStockLevel
    }
  }
})
```

### Transaction Example
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Update material stock
  await tx.material.update({
    where: { id: materialId },
    data: { currentStock: newStock }
  })
  
  // Create stock movement
  await tx.stockMovement.create({
    data: {
      materialId,
      type: 'ADJUSTMENT',
      quantity: difference,
      // ...
    }
  })
})
```

### Aggregation Queries
```typescript
// Recipe cost calculation
const totalCost = await prisma.recipeIngredient.aggregate({
  where: { recipeId },
  _sum: { cost: true }
})
```

---

## 🎯 Next Steps

1. **Start with Phase 1** - Basic setup ve core models
2. **Test each phase** - Before moving to next
3. **Monitor performance** - Optimize queries as needed
4. **Document changes** - Update ROADMAP.md accordingly

---

*Bu TODO listesi SQLite geçişi için kapsamlı bir rehberdir. Her adımı tamamladıktan sonra işaretleyin ve test edin.*