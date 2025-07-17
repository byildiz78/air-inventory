import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, userId } = await request.json();
    const invoiceId = params.id;

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'PAID', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz fatura durumu' },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        supplier: true,
        user: true
      }
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'Fatura bulunamadı' },
        { status: 404 }
      );
    }

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: status,
        updatedAt: new Date()
      },
      include: {
        supplier: true,
        user: true
      }
    });

    // Log activity
    const currentUserId = userId || request.headers.get('x-user-id') || '1';
    await ActivityLogger.logUpdate(
      currentUserId,
      'invoice',
      invoiceId,
      { status: existingInvoice.status },
      { status: status },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: 'Fatura durumu başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Error updating invoice status:', error);
    return NextResponse.json(
      { success: false, error: 'Fatura durumu güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}