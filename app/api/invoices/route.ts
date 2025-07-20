import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { warehouseService } from '@/lib/services/warehouse-service';
import { RecipeCostUpdater } from '@/lib/services/recipe-cost-updater';
import { CurrentAccountBalanceUpdater } from '@/lib/services/current-account-balance-updater';
import { AuthMiddleware } from '@/lib/auth-middleware';

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Retrieve invoices with pagination and filtering
 *     description: Get a list of invoices with support for pagination, filtering, and sorting
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for invoice number or supplier name
 *         example: "INV-2024"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, PAID, CANCELLED]
 *         description: Filter by invoice status
 *         example: "PENDING"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PURCHASE, SALE, RETURN]
 *         description: Filter by invoice type
 *         example: "PURCHASE"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, invoiceNumber, supplierName, totalAmount, status]
 *         description: Field to sort by
 *         example: "date"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *         example: "desc"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Successfully retrieved invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new invoice
 *     description: Create a new invoice with items and handle stock movements
 *     tags:
 *       - Invoices
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceNumber
 *               - type
 *               - date
 *               - userId
 *             properties:
 *               invoiceNumber:
 *                 type: string
 *                 description: Unique invoice number
 *                 example: "INV-2024-001"
 *               type:
 *                 type: string
 *                 enum: [PURCHASE, SALE, RETURN]
 *                 description: Type of invoice
 *                 example: "PURCHASE"
 *               currentAccountId:
 *                 type: string
 *                 description: Current account ID (preferred over supplierId)
 *                 example: "clx1234567890"
 *               supplierId:
 *                 type: string
 *                 description: Supplier ID (legacy, will be converted to currentAccountId)
 *                 example: "clx1234567890"
 *               userId:
 *                 type: string
 *                 description: ID of the user creating the invoice
 *                 example: "clx1234567890"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Invoice date
 *                 example: "2024-01-15T10:30:00Z"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Due date for payment
 *                 example: "2024-02-15T10:30:00Z"
 *               subtotalAmount:
 *                 type: number
 *                 format: float
 *                 description: Subtotal amount (excluding tax)
 *                 example: 1000.00
 *               totalDiscountAmount:
 *                 type: number
 *                 format: float
 *                 description: Total discount amount
 *                 example: 100.00
 *               totalTaxAmount:
 *                 type: number
 *                 format: float
 *                 description: Total tax amount
 *                 example: 180.00
 *               totalAmount:
 *                 type: number
 *                 format: float
 *                 description: Total amount (including tax)
 *                 example: 1080.00
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, PAID, CANCELLED]
 *                 description: Invoice status
 *                 example: "PENDING"
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *                 example: "Monthly supply order"
 *               createStockMovements:
 *                 type: boolean
 *                 description: Whether to create stock movements for the invoice items
 *                 example: true
 *               items:
 *                 type: array
 *                 description: Invoice items
 *                 items:
 *                   type: object
 *                   required:
 *                     - materialId
 *                     - unitId
 *                     - warehouseId
 *                     - taxId
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     materialId:
 *                       type: string
 *                       description: Material ID
 *                       example: "clx1234567890"
 *                     unitId:
 *                       type: string
 *                       description: Unit ID
 *                       example: "clx1234567890"
 *                     warehouseId:
 *                       type: string
 *                       description: Warehouse ID
 *                       example: "clx1234567890"
 *                     taxId:
 *                       type: string
 *                       description: Tax ID
 *                       example: "clx1234567890"
 *                     quantity:
 *                       type: number
 *                       format: float
 *                       description: Quantity
 *                       example: 10.5
 *                     unitPrice:
 *                       type: number
 *                       format: float
 *                       description: Unit price (excluding tax)
 *                       example: 15.50
 *                     discount1Rate:
 *                       type: number
 *                       format: float
 *                       description: First discount rate (%)
 *                       example: 5.0
 *                     discount2Rate:
 *                       type: number
 *                       format: float
 *                       description: Second discount rate (%)
 *                       example: 2.0
 *                     discount1Amount:
 *                       type: number
 *                       format: float
 *                       description: First discount amount
 *                       example: 7.75
 *                     discount2Amount:
 *                       type: number
 *                       format: float
 *                       description: Second discount amount
 *                       example: 3.00
 *                     totalDiscountAmount:
 *                       type: number
 *                       format: float
 *                       description: Total discount amount
 *                       example: 10.75
 *                     subtotalAmount:
 *                       type: number
 *                       format: float
 *                       description: Subtotal amount (after discounts, before tax)
 *                       example: 152.00
 *                     taxAmount:
 *                       type: number
 *                       format: float
 *                       description: Tax amount
 *                       example: 30.40
 *                     totalAmount:
 *                       type: number
 *                       format: float
 *                       description: Total amount (including tax)
 *                       example: 182.40
 *     responses:
 *       200:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "clx1234567890"
 *                     invoiceNumber:
 *                       type: string
 *                       example: "INV-2024-001"
 *                     type:
 *                       type: string
 *                       example: "PURCHASE"
 *                     supplierName:
 *                       type: string
 *                       example: "ABC Tedarik Ltd."
 *                     date:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                     totalAmount:
 *                       type: number
 *                       format: float
 *                       example: 1080.00
 *                     status:
 *                       type: string
 *                       example: "PENDING"
 *                 message:
 *                   type: string
 *                   example: "Invoice created successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
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
});

export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    console.log('📥 Invoice creation request:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.invoiceNumber || !body.type || !body.date || !body.userId) {
      const missingFields = [];
      if (!body.invoiceNumber) missingFields.push('invoiceNumber');
      if (!body.type) missingFields.push('type');
      if (!body.date) missingFields.push('date');
      if (!body.userId) missingFields.push('userId');
      
      console.log('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if invoice number already exists and generate new one if needed
    let invoiceNumber = body.invoiceNumber;
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: body.invoiceNumber }
    });

    if (existingInvoice) {
      console.log('⚠️ Invoice number already exists, generating new number...');
      
      // Extract prefix and base number
      const prefix = body.invoiceNumber.split('-').slice(0, -1).join('-'); // ALF-2025
      const lastNumber = parseInt(body.invoiceNumber.split('-').pop() || '0');
      
      // Find the next available number
      let counter = lastNumber + 1;
      let newInvoiceNumber = `${prefix}-${counter}`;
      
      while (await prisma.invoice.findUnique({ where: { invoiceNumber: newInvoiceNumber } })) {
        counter++;
        newInvoiceNumber = `${prefix}-${counter}`;
      }
      
      invoiceNumber = newInvoiceNumber;
      console.log('✅ Generated new invoice number:', invoiceNumber);
    }

    // Debug log
    console.log('Invoice creation data:', {
      currentAccountId: body.currentAccountId,
      supplierId: body.supplierId,
      type: body.type
    });

    // Validate and resolve currentAccountId before transaction
    let finalCurrentAccountId: string | null = null;
    
    if (body.currentAccountId) {
      console.log('🔍 Validating currentAccountId:', body.currentAccountId);
      // Validate provided currentAccountId
      const currentAccount = await prisma.currentAccount.findUnique({
        where: { id: body.currentAccountId }
      });
      if (!currentAccount) {
        console.log('❌ Current account not found:', body.currentAccountId);
        return NextResponse.json(
          { success: false, error: `Selected account not found: ${body.currentAccountId}` },
          { status: 400 }
        );
      }
      finalCurrentAccountId = body.currentAccountId;
      console.log('✅ Using provided current account:', currentAccount.name);
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
    console.log('🔍 Pre-transaction validation...');
    
    // Validate userId exists
    const userExists = await prisma.user.findUnique({
      where: { id: body.userId }
    });
    if (!userExists) {
      console.log('❌ User not found:', body.userId);
      return NextResponse.json(
        { success: false, error: `User not found: ${body.userId}` },
        { status: 400 }
      );
    }
    console.log('✅ User validated:', userExists.name);

    // Validate items if provided
    if (body.items && body.items.length > 0) {
      console.log('🔍 Validating invoice items...');
      for (const item of body.items) {
        // Check material exists
        const material = await prisma.material.findUnique({
          where: { id: item.materialId }
        });
        if (!material) {
          console.log('❌ Material not found:', item.materialId);
          return NextResponse.json(
            { success: false, error: `Material not found: ${item.materialId}` },
            { status: 400 }
          );
        }

        // Check unit exists
        const unit = await prisma.unit.findUnique({
          where: { id: item.unitId }
        });
        if (!unit) {
          console.log('❌ Unit not found:', item.unitId);
          return NextResponse.json(
            { success: false, error: `Unit not found: ${item.unitId}` },
            { status: 400 }
          );
        }

        // Check warehouse exists
        const warehouse = await prisma.warehouse.findUnique({
          where: { id: item.warehouseId }
        });
        if (!warehouse) {
          console.log('❌ Warehouse not found:', item.warehouseId);
          return NextResponse.json(
            { success: false, error: `Warehouse not found: ${item.warehouseId}` },
            { status: 400 }
          );
        }

        // Check tax exists
        const tax = await prisma.tax.findUnique({
          where: { id: item.taxId }
        });
        if (!tax) {
          console.log('❌ Tax not found:', item.taxId);
          return NextResponse.json(
            { success: false, error: `Tax not found: ${item.taxId}` },
            { status: 400 }
          );
        }
      }
      console.log('✅ All invoice items validated');
    }
    
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
    console.log('🚀 Starting database transaction...');
    const result = await prisma.$transaction(async (tx: any) => {

      // Create the invoice
      console.log('📝 Creating invoice with data:', {
        invoiceNumber: invoiceNumber,
        type: body.type,
        supplierId: body.supplierId || null,
        currentAccountId: finalCurrentAccountId,
        userId: body.userId,
        date: new Date(body.date)
      });
      
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: invoiceNumber,
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
                reason: `${body.type === 'PURCHASE' ? 'Alış' : 'Satış'} Faturası: ${invoiceNumber}`,
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
              description: `Alış Faturası: ${invoiceNumber}`,
              referenceNumber: invoiceNumber,
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
});
