import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { warehouseService } from '@/lib/services/warehouse-service';
import { RecipeCostUpdater } from '@/lib/services/recipe-cost-updater';
import { CurrentAccountBalanceUpdater } from '@/lib/services/current-account-balance-updater';

// Helper function to get or create current account ID for a supplier
async function getOrCreateCurrentAccountId(supplierId: string, tx: any): Promise<string | null> {
  if (!supplierId) return null;
  
  // Try to find existing current account for this supplier
  const existingAccount = await tx.currentAccount.findFirst({
    where: { supplierId: supplierId }
  });
  
  if (existingAccount) {
    return existingAccount.id;
  }
  
  // If no current account exists, create one
  const supplier = await tx.supplier.findUnique({
    where: { id: supplierId }
  });
  
  if (!supplier) {
    throw new Error(`Supplier not found: ${supplierId}`);
  }
  
  // Generate new current account code
  const count = await tx.currentAccount.count();
  const code = `CAR${(count + 1).toString().padStart(3, '0')}`;
  
  const newAccount = await tx.currentAccount.create({
    data: {
      code,
      name: supplier.name,
      type: 'SUPPLIER',
      supplierId: supplier.id,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      taxNumber: supplier.taxNumber,
    }
  });
  
  return newAccount.id;
}

// Helper function to calculate stock at a specific date and warehouse
async function calculateStockAtDate(materialId: string, warehouseId: string | undefined, date: Date): Promise<number> {
  // Get all stock movements for this material and warehouse up to the specified date
  const movements = await prisma.stockMovement.findMany({
    where: {
      materialId: materialId,
      warehouseId: warehouseId,
      date: {
        lt: date // Less than the target date
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  // Calculate stock by summing all movements
  let stock = 0;
  for (const movement of movements) {
    stock += movement.quantity;
  }

  return stock;
}

// Helper function to calculate total stock from movements across all warehouses
async function calculateTotalStockFromMovements(materialId: string): Promise<number> {
  const movements = await prisma.stockMovement.findMany({
    where: {
      materialId: materialId
    },
    orderBy: {
      date: 'asc'
    }
  });

  let totalStock = 0;
  for (const movement of movements) {
    totalStock += movement.quantity;
  }

  return totalStock;
}

// Helper function to recalculate stock levels for all movements after a specific date
async function recalculateStockAfterDate(materialId: string, warehouseId: string | undefined, fromDate: Date): Promise<void> {
  // Get all movements for this material and warehouse after the specified date
  const movements = await prisma.stockMovement.findMany({
    where: {
      materialId: materialId,
      warehouseId: warehouseId,
      date: {
        gte: fromDate // Greater than or equal to the from date
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  // Recalculate stock levels for each movement
  for (const movement of movements) {
    const stockBefore = await calculateStockAtDate(materialId, warehouseId, movement.date);
    const stockAfter = stockBefore + movement.quantity;

    // Update the movement with correct stock levels
    await prisma.stockMovement.update({
      where: { id: movement.id },
      data: {
        stockBefore: stockBefore,
        stockAfter: stockAfter
      }
    });
  }
}

// Helper function to calculate current stock for a material and warehouse
async function calculateCurrentStock(materialId: string, warehouseId: string | undefined): Promise<number> {
  const movements = await prisma.stockMovement.findMany({
    where: {
      materialId: materialId,
      warehouseId: warehouseId,
    },
    orderBy: {
      date: 'asc'
    }
  });

  let stock = 0;
  for (const movement of movements) {
    stock += movement.quantity;
  }

  return stock;
}

// Helper function to update MaterialStock table
async function updateMaterialStock(materialId: string, warehouseId: string | undefined, newStock: number, averageCost?: number): Promise<void> {
  if (!warehouseId) {
    console.log('⚠️ MaterialStock Update Skipped: No warehouseId provided', { materialId });
    return;
  }
  
  console.log('🔄 Updating MaterialStock:', { 
    materialId, 
    warehouseId, 
    newStock, 
    averageCost 
  });
  
  try {
    const result = await warehouseService.updateMaterialStock(warehouseId, materialId, {
      currentStock: newStock,
      availableStock: newStock,
      averageCost: averageCost
    });
    
    console.log('✅ MaterialStock Updated Successfully:', result?.id);
  } catch (error) {
    console.error('❌ MaterialStock Update Failed:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchTerm = request.nextUrl.searchParams.get('search') || '';
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const type = request.nextUrl.searchParams.get('type') || undefined;
    const sortBy = request.nextUrl.searchParams.get('sortBy') || 'date';
    const sortOrder = request.nextUrl.searchParams.get('sortOrder') || 'desc';
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    // Build the where clause
    const where: any = {};
    
    if (searchTerm) {
      where.OR = [
        { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
        { supplier: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { currentAccount: { name: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (type && type !== 'all') {
      where.type = type;
    }

    // Build the orderBy clause
    const orderBy: any = {};
    if (sortBy === 'supplierName') {
      orderBy.currentAccount = { name: sortOrder };
    } else if (sortBy === 'totalAmount') {
      orderBy.totalAmount = sortOrder;
    } else if (sortBy === 'invoiceNumber') {
      orderBy.invoiceNumber = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      orderBy.date = sortOrder;
    }

    // Get total count for pagination
    const totalCount = await prisma.invoice.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated invoices from the database with their related data
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        supplier: true,
        currentAccount: true,
        items: {
          include: {
            material: true,
            unit: true,
            warehouse: true,
            tax: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Transform the data to match the expected format in the frontend
    const formattedInvoices = invoices.map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      supplierId: invoice.supplierId, // Keep for backward compatibility
      supplierName: invoice.supplier?.name || invoice.currentAccount?.name || 'Belirtilmemiş',
      currentAccountId: invoice.currentAccountId,
      currentAccountName: invoice.currentAccount?.name || 'Belirtilmemiş',
      date: invoice.date,
      dueDate: invoice.dueDate,
      subtotalAmount: invoice.subtotalAmount,
      totalDiscountAmount: invoice.totalDiscountAmount,
      totalTaxAmount: invoice.totalTaxAmount,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      itemCount: invoice.items.length,
      userName: invoice.user.name,
      items: invoice.items.map((item: any) => ({
        id: item.id,
        materialId: item.materialId,
        materialName: item.material.name,
        unitId: item.unitId,
        unitName: item.unit.name,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        taxId: item.taxId,
        taxName: item.tax.name,
        taxRate: item.tax.rate,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount1Rate: item.discount1Rate,
        discount2Rate: item.discount2Rate,
        discount1Amount: item.discount1Amount,
        discount2Amount: item.discount2Amount,
        totalDiscountAmount: item.totalDiscountAmount,
        subtotalAmount: item.subtotalAmount,
        taxAmount: item.taxAmount,
        totalAmount: item.totalAmount
      }))
    }));

    return NextResponse.json({
      success: true,
      data: formattedInvoices,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch invoices',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.invoiceNumber || !body.type || !body.date || !body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Check if invoice number already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: body.invoiceNumber }
    });

    if (existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice number already exists',
        },
        { status: 400 }
      );
    }

    // Debug log
    console.log('Invoice creation data:', {
      currentAccountId: body.currentAccountId,
      supplierId: body.supplierId,
      type: body.type
    });

    // Validate and resolve currentAccountId before transaction
    let finalCurrentAccountId = null;
    
    if (body.currentAccountId) {
      // Validate provided currentAccountId
      const currentAccount = await prisma.currentAccount.findUnique({
        where: { id: body.currentAccountId }
      });
      if (!currentAccount) {
        return NextResponse.json(
          { success: false, error: `Selected account not found: ${body.currentAccountId}` },
          { status: 400 }
        );
      }
      finalCurrentAccountId = body.currentAccountId;
      console.log('Using provided current account:', currentAccount.name);
    } else if (body.supplierId) {
      // Fallback to supplier - find or create current account
      const supplier = await prisma.supplier.findUnique({
        where: { id: body.supplierId }
      });
      if (!supplier) {
        return NextResponse.json(
          { success: false, error: `Supplier not found: ${body.supplierId}` },
          { status: 400 }
        );
      }
      
      // Find existing current account for supplier
      let currentAccount = await prisma.currentAccount.findFirst({
        where: { supplierId: body.supplierId }
      });
      
      if (!currentAccount) {
        // Create new current account for supplier
        const count = await prisma.currentAccount.count();
        const code = `CAR${(count + 1).toString().padStart(3, '0')}`;
        
        currentAccount = await prisma.currentAccount.create({
          data: {
            code,
            name: supplier.name,
            type: 'SUPPLIER',
            supplierId: supplier.id,
            contactName: supplier.contactName,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            taxNumber: supplier.taxNumber,
          }
        });
        console.log('Created new current account:', currentAccount.name);
      }
      
      finalCurrentAccountId = currentAccount.id;
      console.log('Using supplier current account:', currentAccount.name);
    } else {
      return NextResponse.json(
        { success: false, error: 'Either currentAccountId or supplierId must be provided' },
        { status: 400 }
      );
    }

    // Additional validation before transaction
    console.log('Pre-transaction validation...');
    
    // Validate userId exists
    const userExists = await prisma.user.findUnique({
      where: { id: body.userId }
    });
    if (!userExists) {
      return NextResponse.json(
        { success: false, error: `User not found: ${body.userId}` },
        { status: 400 }
      );
    }
    console.log('User validated:', userExists.name);
    
    // Validate supplierId if provided (legacy support)
    if (body.supplierId && body.supplierId !== '') {
      const supplierExists = await prisma.supplier.findUnique({
        where: { id: body.supplierId }
      });
      if (!supplierExists) {
        return NextResponse.json(
          { success: false, error: `Supplier not found: ${body.supplierId}` },
          { status: 400 }
        );
      }
      console.log('Supplier validated:', supplierExists.name);
    }

    // Create the invoice in a transaction with its items
    const result = await prisma.$transaction(async (tx: any) => {

      // Create the invoice
      console.log('Creating invoice with data:', {
        invoiceNumber: body.invoiceNumber,
        type: body.type,
        supplierId: body.supplierId || null,
        currentAccountId: finalCurrentAccountId,
        userId: body.userId,
        date: new Date(body.date)
      });
      
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: body.invoiceNumber,
          type: body.type,
          supplierId: (body.supplierId && body.supplierId !== '') ? body.supplierId : null, // Keep for backward compatibility
          currentAccountId: finalCurrentAccountId,
          userId: body.userId,
          date: new Date(body.date),
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          subtotalAmount: body.subtotalAmount || 0,
          totalDiscountAmount: body.totalDiscountAmount || 0,
          totalTaxAmount: body.totalTaxAmount || 0,
          totalAmount: body.totalAmount || 0,
          status: body.status || 'PENDING',
          notes: body.notes
        },
        include: {
          supplier: true,
          user: true
        }
      });

      // Create invoice items if provided
      if (body.items && body.items.length > 0) {
        const items = await Promise.all(body.items.map((item: any) => 
          tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              materialId: item.materialId,
              unitId: item.unitId,
              warehouseId: item.warehouseId,
              taxId: item.taxId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount1Rate: item.discount1Rate || 0,
              discount2Rate: item.discount2Rate || 0,
              discount1Amount: item.discount1Amount || 0,
              discount2Amount: item.discount2Amount || 0,
              totalDiscountAmount: item.totalDiscountAmount || 0,
              subtotalAmount: item.subtotalAmount || 0,
              taxAmount: item.taxAmount || 0,
              totalAmount: item.totalAmount || 0
            }
          })
        ));

        // Create stock movements for each item
        if (body.createStockMovements) {
          await Promise.all(body.items.map(async (item: any) => {
            // Calculate stock at the specific date and warehouse
            const movementDate = new Date(body.date);
            const stockBefore = await calculateStockAtDate(item.materialId, item.warehouseId, movementDate);
            const invoiceQuantity = body.type === 'PURCHASE' ? item.quantity : -item.quantity;
            
            // Get material with purchase and consumption units
            const material = await tx.material.findUnique({
              where: { id: item.materialId },
              include: {
                purchaseUnit: true,
                consumptionUnit: true
              }
            });

            if (!material) {
              throw new Error(`Material not found: ${item.materialId}`);
            }

            // Calculate quantity in consumption unit
            const purchaseUnit = material.purchaseUnit;
            const consumptionUnit = material.consumptionUnit;
            
            let consumptionQuantity = invoiceQuantity;
            let consumptionUnitCost = item.unitPrice;
            
            if (purchaseUnit && consumptionUnit && purchaseUnit.id !== consumptionUnit.id) {
              // Convert from purchase unit to consumption unit
              // Example: 1 kg = 1000 gr, so if conversionFactor for gram is 0.001, then 1 kg = 1000 gram
              const conversionFactor = purchaseUnit.conversionFactor / consumptionUnit.conversionFactor;
              consumptionQuantity = invoiceQuantity * conversionFactor;
              consumptionUnitCost = item.unitPrice / conversionFactor;
            }

            // Calculate stock after with consumption quantity
            const stockAfter = stockBefore + consumptionQuantity;

            const stockMovement = await tx.stockMovement.create({
              data: {
                materialId: item.materialId,
                unitId: material.consumptionUnitId, // Use consumption unit for stock movements
                userId: body.userId,
                invoiceId: invoice.id,
                warehouseId: item.warehouseId,
                type: body.type === 'PURCHASE' ? 'IN' : 'OUT',
                quantity: consumptionQuantity, // Use consumption quantity
                reason: `${body.type === 'PURCHASE' ? 'Alış' : 'Satış'} Faturası: ${body.invoiceNumber}`,
                unitCost: consumptionUnitCost, // Use consumption unit cost
                totalCost: item.totalAmount,
                stockBefore: stockBefore,
                stockAfter: stockAfter,
                date: movementDate
              }
            });

            return stockMovement;
          }));
        }
      }

      // Create current account transaction for purchase invoices
      if (body.type === 'PURCHASE' && finalCurrentAccountId) {
        // Get current account
        const currentAccount = await tx.currentAccount.findUnique({
          where: { id: finalCurrentAccountId }
        });

        if (currentAccount) {
          // Create debt transaction for the invoice
          const currentBalance = currentAccount.currentBalance;
          const newBalance = currentBalance + (body.totalAmount || 0);

          await tx.currentAccountTransaction.create({
            data: {
              currentAccountId: currentAccount.id,
              invoiceId: invoice.id,
              type: 'DEBT',
              amount: body.totalAmount || 0,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              description: `Alış Faturası: ${body.invoiceNumber}`,
              referenceNumber: body.invoiceNumber,
              transactionDate: new Date(body.date),
              userId: body.userId
            }
          });

          // Update current account balance
          await tx.currentAccount.update({
            where: { id: currentAccount.id },
            data: { currentBalance: newBalance }
          });
        }
      }

      // Recalculate current account balances if this is a purchase invoice
      if (body.type === 'PURCHASE' && body.supplierId) {
        await CurrentAccountBalanceUpdater.recalculateForInvoiceUpdate(invoice.id, tx);
      }

      return invoice;
    });

    // Recalculate stock levels for affected materials (outside transaction)
    if (body.items && body.items.length > 0 && body.createStockMovements) {
      for (const item of body.items) {
        await recalculateStockAfterDate(item.materialId, item.warehouseId, new Date(body.date));
        
        // Update MaterialStock table - use consumption unit cost
        const currentStock = await calculateCurrentStock(item.materialId, item.warehouseId);
        // Get the consumption unit cost for this material
        const material = await prisma.material.findUnique({
          where: { id: item.materialId },
          include: {
            purchaseUnit: true,
            consumptionUnit: true
          }
        });
        
        let consumptionUnitCost = item.unitPrice;
        if (material && material.purchaseUnit && material.consumptionUnit && material.purchaseUnit.id !== material.consumptionUnit.id) {
          const conversionFactor = material.purchaseUnit.conversionFactor / material.consumptionUnit.conversionFactor;
          consumptionUnitCost = item.unitPrice / conversionFactor;
        }
        
        await updateMaterialStock(item.materialId, item.warehouseId, currentStock, consumptionUnitCost);
        
        // Update Material.currentStock, lastPurchasePrice and averageCost with total across all warehouses
        const totalStock = await calculateTotalStockFromMovements(item.materialId);
        
        // Convert lastPurchasePrice to consumption unit for averageCost
        let newAverageCost = item.unitPrice; // item.unitPrice is in purchase unit
        if (material && material.purchaseUnit && material.consumptionUnit && material.purchaseUnit.id !== material.consumptionUnit.id) {
          const conversionFactor = material.purchaseUnit.conversionFactor / material.consumptionUnit.conversionFactor;
          newAverageCost = item.unitPrice / conversionFactor;
        }
        
        await prisma.material.update({
          where: { id: item.materialId },
          data: { 
            currentStock: totalStock,
            lastPurchasePrice: item.unitPrice, // Update last purchase price (purchase unit)
            averageCost: newAverageCost // Update average cost (consumption unit)
          }
        });
      }
    }

    // Update recipe costs for affected materials
    try {
      const affectedMaterialIds = body.items ? body.items.map((item: any) => item.materialId) : [];
      let totalUpdatedRecipes = 0;
      let totalUpdatedIngredients = 0;

      for (const materialId of affectedMaterialIds) {
        const result = await RecipeCostUpdater.updateRecipeCostsForMaterial(materialId);
        totalUpdatedRecipes += result.updatedRecipes;
        totalUpdatedIngredients += result.updatedIngredients;
      }

      console.log(`Recipe costs updated: ${totalUpdatedRecipes} recipes, ${totalUpdatedIngredients} ingredients`);
    } catch (error) {
      console.error('Error updating recipe costs after invoice:', error);
      // Don't fail the invoice creation if recipe cost update fails
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logCreate(
      userId,
      'invoice',
      result.id,
      {
        invoiceNumber: result.invoiceNumber,
        type: result.type,
        supplierName: result.supplier?.name,
        totalAmount: result.totalAmount,
        itemCount: body.items?.length || 0
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        invoiceNumber: result.invoiceNumber,
        type: result.type,
        supplierName: result.supplier?.name,
        date: result.date,
        totalAmount: result.totalAmount,
        status: result.status
      },
      message: 'Invoice created successfully',
    });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create invoice',
      },
      { status: 500 }
    );
  }
}
