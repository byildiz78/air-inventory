import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { CurrentAccountBalanceUpdater } from '@/lib/services/current-account-balance-updater';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        currentAccount: {
          include: {
            supplier: true
          }
        },
        bankAccount: true,
        user: true,
        transactions: {
          include: {
            user: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Ödeme bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { success: false, error: 'Ödeme yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || '1';

    // Get existing payment
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        currentAccount: true,
        transactions: true
      }
    });

    if (!existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Ödeme bulunamadı' },
        { status: 404 }
      );
    }

    // Check if payment has transactions (completed)
    if (existingPayment.transactions.length > 0 && body.status !== existingPayment.status) {
      return NextResponse.json(
        { success: false, error: 'Tamamlanmış ödeme durumu değiştirilemez' },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentDate: new Date(body.paymentDate),
          amount: body.amount,
          paymentMethod: body.paymentMethod,
          currency: body.currency || 'TRY',
          referenceNumber: body.referenceNumber || null,
          description: body.description || null,
          bankAccountId: body.bankAccountId || null,
          status: body.status
        },
        include: {
          currentAccount: {
            include: {
              supplier: true
            }
          },
          bankAccount: true,
          user: true
        }
      });

      // If status changed to COMPLETED and no transactions exist, create them
      if (body.status === 'COMPLETED' && existingPayment.transactions.length === 0) {
        // Create current account transaction with temporary balance values
        // These will be recalculated properly by CurrentAccountBalanceUpdater below
        await prisma.currentAccountTransaction.create({
          data: {
            currentAccountId: existingPayment.currentAccountId,
            paymentId: paymentId,
            transactionDate: new Date(body.paymentDate),
            type: 'PAYMENT',
            amount: -body.amount,
            description: body.description || `${existingPayment.paymentNumber} numaralı ödeme`,
            referenceNumber: existingPayment.paymentNumber,
            balanceBefore: 0, // Will be recalculated
            balanceAfter: 0, // Will be recalculated
            userId: userId
          }
        });

        // Update last activity date only
        await prisma.currentAccount.update({
          where: { id: existingPayment.currentAccountId },
          data: {
            lastActivityDate: new Date(body.paymentDate)
          }
        });

        // Update bank account balance if specified
        if (body.bankAccountId) {
          const bankAccount = await prisma.bankAccount.findUnique({
            where: { id: body.bankAccountId }
          });

          if (bankAccount) {
            await prisma.bankAccount.update({
              where: { id: body.bankAccountId },
              data: {
                currentBalance: bankAccount.currentBalance - body.amount
              }
            });
          }
        }
      }

      // Recalculate current account balances
      await CurrentAccountBalanceUpdater.recalculateForPaymentUpdate(paymentId, prisma);

      return updatedPayment;
    });

    // Log activity
    await ActivityLogger.logUpdate(
      userId,
      'payment',
      paymentId,
      {
        amount: existingPayment.amount,
        paymentMethod: existingPayment.paymentMethod,
        status: existingPayment.status
      },
      {
        amount: result.amount,
        paymentMethod: result.paymentMethod,
        status: result.status
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Ödeme başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Ödeme güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    const userId = request.headers.get('x-user-id') || '1';

    // Get payment info
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        transactions: true,
        currentAccount: true
      }
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Ödeme bulunamadı' },
        { status: 404 }
      );
    }

    // Check if payment is completed
    if (payment.status === 'COMPLETED' && payment.transactions.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Tamamlanmış ödeme silinemez' },
        { status: 400 }
      );
    }

    // Delete payment
    await prisma.payment.delete({
      where: { id: paymentId }
    });

    // Log activity
    await ActivityLogger.logDelete(
      userId,
      'payment',
      paymentId,
      {
        paymentNumber: payment.paymentNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Ödeme başarıyla silindi'
    });

  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { success: false, error: 'Ödeme silinirken hata oluştu' },
      { status: 500 }
    );
  }
}