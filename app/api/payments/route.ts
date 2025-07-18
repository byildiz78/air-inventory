import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { CurrentAccountBalanceUpdater } from '@/lib/services/current-account-balance-updater';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const method = searchParams.get('method') || 'all';
    const currentAccountId = searchParams.get('currentAccountId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { currentAccount: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (method !== 'all') {
      where.paymentMethod = method;
    }

    if (currentAccountId) {
      where.currentAccountId = currentAccountId;
    }

    // Get total count
    const total = await prisma.payment.count({ where });

    // Get payments
    const payments = await prisma.payment.findMany({
      where,
      include: {
        currentAccount: {
          include: {
            supplier: true
          }
        },
        bankAccount: true,
        user: true
      },
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Ödemeler yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || '1';

    // Generate unique payment number
    const lastPayment = await prisma.payment.findFirst({
      orderBy: { paymentNumber: 'desc' }
    });
    
    let nextNumber = 1;
    if (lastPayment?.paymentNumber) {
      const match = lastPayment.paymentNumber.match(/PAY(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    const paymentNumber = `PAY${String(nextNumber).padStart(4, '0')}`;

    // Get current account
    const currentAccount = await prisma.currentAccount.findUnique({
      where: { id: body.currentAccountId }
    });

    if (!currentAccount) {
      return NextResponse.json(
        { success: false, error: 'Cari hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create payment
      const payment = await prisma.payment.create({
        data: {
          paymentNumber,
          currentAccountId: body.currentAccountId,
          paymentDate: new Date(body.paymentDate),
          amount: body.amount,
          paymentMethod: body.paymentMethod,
          currency: body.currency || 'TRY',
          referenceNumber: body.referenceNumber || null,
          description: body.description || null,
          bankAccountId: body.bankAccountId || null,
          status: body.status || 'PENDING',
          userId: userId
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

      // If payment is completed, create transaction and update balance
      console.log(`Payment status: ${payment.status}, creating transaction: ${payment.status === 'COMPLETED'}`);
      if (payment.status === 'COMPLETED') {
        // Create current account transaction with temporary balance values
        // These will be recalculated properly by CurrentAccountBalanceUpdater below
        console.log('Creating current account transaction for payment:', payment.id);
        await tx.currentAccountTransaction.create({
          data: {
            currentAccountId: body.currentAccountId,
            paymentId: payment.id,
            transactionDate: new Date(body.paymentDate),
            type: 'PAYMENT',
            amount: -body.amount, // Negative for payment
            description: body.description || `${paymentNumber} numaralı ödeme`,
            referenceNumber: paymentNumber,
            balanceBefore: 0, // Will be recalculated
            balanceAfter: 0, // Will be recalculated
            userId: userId
          }
        });

        // Update last activity date only
        await tx.currentAccount.update({
          where: { id: body.currentAccountId },
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

      // Recalculate current account balances if payment is completed
      if (payment.status === 'COMPLETED') {
        await CurrentAccountBalanceUpdater.recalculateForPaymentUpdate(payment.id, tx);
      }

      return payment;
    });

    // Log activity
    await ActivityLogger.logCreate(
      userId,
      'payment',
      result.id,
      {
        paymentNumber: result.paymentNumber,
        currentAccountId: result.currentAccountId,
        amount: result.amount,
        paymentMethod: result.paymentMethod,
        status: result.status
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Ödeme başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Ödeme oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}