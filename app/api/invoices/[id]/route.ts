import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { warehouseService } from '@/lib/services/warehouse-service';
import { CurrentAccountBalanceUpdater } from '@/lib/services/current-account-balance-updater';

// Helper function to update MaterialStock table with logging
async function updateMaterialStock(materialId: string, warehouseId: string | undefined, newStock: number, averageCost?: number): Promise<void> {
  if (!warehouseId) {
    console.log('⚠️ MaterialStock Update Skipped: No warehouseId provided', { materialId });
    return;
  }
  
  console.log('🔄 Updating MaterialStock (Invoice Update):', { 
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
    
    console.log('✅ MaterialStock Updated Successfully (Invoice Update):', result?.id);
  } catch (error) {
    console.error('❌ MaterialStock Update Failed (Invoice Update):', error);
    throw error;
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        currentAccount: true,
        user: true,
        items: {
          include: {
            material: true,
            unit: true,
            warehouse: true,
            tax: true
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    // Format the response to match the expected format in the frontend
    const formattedInvoice = {
      ...invoice,
      supplierName: invoice.supplier?.name || invoice.currentAccount?.name,
      currentAccountName: invoice.currentAccount?.name,
      userName: invoice.user?.name,
      supplierInfo: {
        contactName: invoice.supplier?.contactName || invoice.currentAccount?.contactName,
        phone: invoice.supplier?.phone || invoice.currentAccount?.phone,
        email: invoice.supplier?.email || invoice.currentAccount?.email,
        taxNumber: invoice.supplier?.taxNumber || invoice.currentAccount?.taxNumber,
        address: invoice.supplier?.address || invoice.currentAccount?.address
      },
      items: invoice.items.map((item: any) => ({
        ...item,
        materialName: item.material.name,
        unitName: item.unit.name,
        warehouseName: item.warehouse.name,
        taxName: item.tax.name,
        taxRate: item.tax.rate
      }))
    };

    return NextResponse.json({
      success: true,
      data: formattedInvoice,
    });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch invoice',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Check if the invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true }
    });

    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    // Check if we're trying to update the invoice number to one that already exists
    if (body.invoiceNumber && body.invoiceNumber !== existingInvoice.invoiceNumber) {
      const duplicateInvoice = await prisma.invoice.findUnique({
        where: { invoiceNumber: body.invoiceNumber }
      });

      if (duplicateInvoice) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invoice number already exists',
          },
          { status: 400 }
        );
      }
    }

    // Update the invoice in a transaction with its items
    const result = await prisma.$transaction(async (tx: any) => {
      // Update the invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: params.id },
        data: {
          invoiceNumber: body.invoiceNumber,
          type: body.type,
          supplierId: body.supplierId, // Keep for backward compatibility
          currentAccountId: body.currentAccountId,
          date: body.date ? new Date(body.date) : undefined,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          subtotalAmount: body.subtotalAmount,
          totalDiscountAmount: body.totalDiscountAmount,
          totalTaxAmount: body.totalTaxAmount,
          totalAmount: body.totalAmount,
          status: body.status,
          paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
          notes: body.notes
        },
        include: {
          supplier: true,
          user: true
        }
      });

      // If items are provided, handle them
      if (body.items) {
        // First, delete existing stock movements for this invoice
        console.log(`Deleting existing stock movements for invoice ${params.id}`);
        const deletedCount = await tx.stockMovement.deleteMany({
          where: { invoiceId: params.id }
        });
        console.log(`Deleted ${deletedCount.count} stock movements`);

        // Delete existing items if we're replacing them
        if (body.replaceItems) {
          await tx.invoiceItem.deleteMany({
            where: { invoiceId: params.id }
          });
        }

        // Create new items
        if (body.items.length > 0) {
          await Promise.all(body.items.map((item: any) => {
            if (item.id) {
              // Update existing item
              return tx.invoiceItem.update({
                where: { id: item.id },
                data: {
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
              });
            } else {
              // Create new item
              return tx.invoiceItem.create({
                data: {
                  invoiceId: params.id,
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
              });
            }
          }));

          // Create new stock movements for updated items
          await Promise.all(body.items.map(async (item: any) => {
            // Calculate stock at the specific date and warehouse
            const movementDate = new Date(body.date || updatedInvoice.date);
            const stockBefore = await calculateStockAtDate(item.materialId, item.warehouseId, movementDate);
            const invoiceQuantity = updatedInvoice.type === 'PURCHASE' ? item.quantity : -item.quantity;
            
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
              const conversionFactor = purchaseUnit.conversionFactor / consumptionUnit.conversionFactor;
              consumptionQuantity = invoiceQuantity * conversionFactor;
              consumptionUnitCost = item.unitPrice / conversionFactor;
            }

            const stockAfter = stockBefore + consumptionQuantity;
            
            const stockMovement = await tx.stockMovement.create({
              data: {
                materialId: item.materialId,
                unitId: material.consumptionUnitId, // Use consumption unit
                userId: body.userId || '1',
                invoiceId: params.id,
                warehouseId: item.warehouseId,
                type: updatedInvoice.type === 'PURCHASE' ? 'IN' : 'OUT',
                quantity: consumptionQuantity, // Use consumption quantity
                reason: `${updatedInvoice.type === 'PURCHASE' ? 'Alış' : 'Satış'} Faturası (Güncellendi): ${updatedInvoice.invoiceNumber}`,
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

      // Handle current account transaction updates for purchase invoices
      if (updatedInvoice.type === 'PURCHASE' && updatedInvoice.supplierId) {
        // Find existing current account transaction for this invoice
        const existingTransaction = await tx.currentAccountTransaction.findFirst({
          where: { invoiceId: params.id }
        });

        // Find or create current account for supplier
        let currentAccount = await tx.currentAccount.findFirst({
          where: { supplierId: updatedInvoice.supplierId }
        });

        if (!currentAccount) {
          // Get supplier info
          const supplier = await tx.supplier.findUnique({
            where: { id: updatedInvoice.supplierId }
          });

          if (supplier) {
            // Auto-generate current account code
            const count = await tx.currentAccount.count();
            const code = `CAR${(count + 1).toString().padStart(3, '0')}`;

            // Create current account for supplier
            currentAccount = await tx.currentAccount.create({
              data: {
                code: code,
                name: supplier.name,
                type: 'SUPPLIER',
                supplierId: updatedInvoice.supplierId,
                contactName: supplier.contactName,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
                taxNumber: supplier.taxNumber,
                openingBalance: 0,
                currentBalance: 0,
                creditLimit: 0,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }
        }

        if (currentAccount) {
          const newInvoiceAmount = updatedInvoice.totalAmount || 0;

          if (existingTransaction) {
            // Update existing transaction
            const oldAmount = existingTransaction.amount;
            const amountDifference = newInvoiceAmount - oldAmount;
            const newBalance = currentAccount.currentBalance + amountDifference;

            await tx.currentAccountTransaction.update({
              where: { id: existingTransaction.id },
              data: {
                amount: newInvoiceAmount,
                balanceAfter: newBalance,
                description: `Alış Faturası (Güncellendi): ${updatedInvoice.invoiceNumber}`,
                referenceNumber: updatedInvoice.invoiceNumber,
                transactionDate: new Date(body.date || updatedInvoice.date)
              }
            });

            // Update current account balance
            await tx.currentAccount.update({
              where: { id: currentAccount.id },
              data: { currentBalance: newBalance }
            });
          } else {
            // Create new transaction
            const currentBalance = currentAccount.currentBalance;
            const newBalance = currentBalance + newInvoiceAmount;

            await tx.currentAccountTransaction.create({
              data: {
                currentAccountId: currentAccount.id,
                invoiceId: params.id,
                type: 'DEBT',
                amount: newInvoiceAmount,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
                description: `Alış Faturası: ${updatedInvoice.invoiceNumber}`,
                referenceNumber: updatedInvoice.invoiceNumber,
                transactionDate: new Date(body.date || updatedInvoice.date),
                userId: body.userId || '1'
              }
            });

            // Update current account balance
            await tx.currentAccount.update({
              where: { id: currentAccount.id },
              data: { currentBalance: newBalance }
            });
          }
        }
      }

      // Recalculate current account balances if this is a purchase invoice
      if (updatedInvoice.type === 'PURCHASE' && updatedInvoice.supplierId) {
        await CurrentAccountBalanceUpdater.recalculateForInvoiceUpdate(params.id, tx);
      }

      return updatedInvoice;
    });

    // Recalculate stock levels for affected materials (outside transaction)
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        await recalculateStockAfterDate(item.materialId, item.warehouseId, new Date(body.date || result.date));
        
        // Update MaterialStock table and Material.currentStock, lastPurchasePrice and averageCost
        const currentStock = await calculateCurrentStock(item.materialId, item.warehouseId);
        
        // Get material with units for conversion
        const material = await prisma.material.findUnique({
          where: { id: item.materialId },
          include: {
            purchaseUnit: true,
            consumptionUnit: true
          }
        });
        
        // Convert lastPurchasePrice to consumption unit for averageCost
        let consumptionUnitCost = item.unitPrice; // item.unitPrice is in purchase unit
        if (material && material.purchaseUnit && material.consumptionUnit && material.purchaseUnit.id !== material.consumptionUnit.id) {
          const conversionFactor = material.purchaseUnit.conversionFactor / material.consumptionUnit.conversionFactor;
          consumptionUnitCost = item.unitPrice / conversionFactor;
        }
        
        // Update MaterialStock table - use the updateMaterialStock helper with logging
        await updateMaterialStock(item.materialId, item.warehouseId, currentStock, consumptionUnitCost);
        
        // Update Material table (only for PURCHASE invoices)
        if (result.type === 'PURCHASE') {
          const totalStock = await calculateTotalStockFromMovements(item.materialId);
          
          await prisma.material.update({
            where: { id: item.materialId },
            data: { 
              currentStock: totalStock,
              lastPurchasePrice: item.unitPrice, // Update last purchase price (purchase unit)
              averageCost: consumptionUnitCost // Update average cost (consumption unit)
            }
          });
        }
      }
    }

    // Update recipe costs for affected materials (only for PURCHASE invoices)
    if (result.type === 'PURCHASE' && body.items && body.items.length > 0) {
      try {
        const { RecipeCostUpdater } = await import('@/lib/services/recipe-cost-updater');
        const affectedMaterialIds = body.items.map((item: any) => item.materialId);
        let totalUpdatedRecipes = 0;
        let totalUpdatedIngredients = 0;

        for (const materialId of affectedMaterialIds) {
          const result = await RecipeCostUpdater.updateRecipeCostsForMaterial(materialId);
          totalUpdatedRecipes += result.updatedRecipes;
          totalUpdatedIngredients += result.updatedIngredients;
        }

        console.log(`Recipe costs updated after invoice edit: ${totalUpdatedRecipes} recipes, ${totalUpdatedIngredients} ingredients`);
      } catch (error) {
        console.error('Error updating recipe costs after invoice edit:', error);
        // Don't fail the invoice update if recipe cost update fails
      }
    }

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logUpdate(
      userId,
      'invoice',
      params.id,
      {
        before: {
          invoiceNumber: existingInvoice.invoiceNumber,
          totalAmount: existingInvoice.totalAmount,
          status: existingInvoice.status
        },
        after: {
          invoiceNumber: result.invoiceNumber,
          totalAmount: result.totalAmount,
          status: result.status
        }
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
      message: 'Invoice updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update invoice',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { stockMovements: true }
    });

    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    // Delete the invoice and related items in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Handle current account transaction cleanup
      const existingCurrentAccountTransaction = await tx.currentAccountTransaction.findFirst({
        where: { invoiceId: params.id },
        include: { currentAccount: true }
      });

      if (existingCurrentAccountTransaction) {
        const currentAccountId = existingCurrentAccountTransaction.currentAccount.id;
        const transactionDate = existingCurrentAccountTransaction.transactionDate;

        // Delete the current account transaction first
        await tx.currentAccountTransaction.delete({
          where: { id: existingCurrentAccountTransaction.id }
        });

        // Recalculate balances from the transaction date
        await CurrentAccountBalanceUpdater.recalculateAccountBalances(
          currentAccountId,
          transactionDate,
          tx
        );
      }

      // Delete related stock movements if they exist
      if (existingInvoice.stockMovements.length > 0) {
        await tx.stockMovement.deleteMany({
          where: { invoiceId: params.id }
        });
      }

      // Delete invoice items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: params.id }
      });

      // Delete the invoice
      await tx.invoice.delete({
        where: { id: params.id }
      });
    });

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logDelete(
      userId,
      'invoice',
      params.id,
      {
        invoiceNumber: existingInvoice.invoiceNumber,
        type: existingInvoice.type,
        totalAmount: existingInvoice.totalAmount
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete invoice',
      },
      { status: 500 }
    );
  }
}
