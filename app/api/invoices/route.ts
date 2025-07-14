import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchTerm = request.nextUrl.searchParams.get('search') || '';
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const type = request.nextUrl.searchParams.get('type') || undefined;

    // Build the where clause
    const where: any = {};
    
    if (searchTerm) {
      where.OR = [
        { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
        { supplier: { name: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (type && type !== 'all') {
      where.type = type;
    }

    // Get all invoices from the database with their related data
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        supplier: true,
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
      orderBy: {
        date: 'desc'
      }
    });

    // Transform the data to match the expected format in the frontend
    const formattedInvoices = invoices.map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      supplierId: invoice.supplierId,
      supplierName: invoice.supplier?.name || 'Belirtilmemiş',
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

    // Create the invoice in a transaction with its items
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: body.invoiceNumber,
          type: body.type,
          supplierId: body.supplierId,
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
          await Promise.all(body.items.map((item: any) => 
            tx.stockMovement.create({
              data: {
                materialId: item.materialId,
                unitId: item.unitId,
                userId: body.userId,
                invoiceId: invoice.id,
                type: body.type === 'PURCHASE' ? 'IN' : 'OUT',
                quantity: body.type === 'PURCHASE' ? item.quantity : -item.quantity,
                reason: `${body.type === 'PURCHASE' ? 'Alış' : 'Satış'} Faturası: ${body.invoiceNumber}`,
                unitCost: item.unitPrice,
                totalCost: item.totalAmount,
                stockBefore: 0, // This will be calculated by a trigger or in the future
                stockAfter: 0,  // This will be calculated by a trigger or in the future
                date: new Date(body.date)
              }
            })
          ));
        }
      }

      return invoice;
    });

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
