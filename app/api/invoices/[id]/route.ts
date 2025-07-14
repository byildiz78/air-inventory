import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
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
      supplierName: invoice.supplier?.name,
      userName: invoice.user?.name,
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
          supplierId: body.supplierId,
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
        }
      }

      return updatedInvoice;
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
