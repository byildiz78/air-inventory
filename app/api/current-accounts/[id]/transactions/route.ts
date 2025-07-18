import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentAccountId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = {
      currentAccountId: currentAccountId
    };

    if (type !== 'all') {
      where.type = type;
    }

    // Get total count
    const total = await prisma.currentAccountTransaction.count({ where });

    // Get transactions
    const transactions = await prisma.currentAccountTransaction.findMany({
      where,
      include: {
        invoice: true,
        payment: true,
        user: true
      },
      orderBy: { transactionDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Cari hareketler yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentAccountId = params.id;
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || '1';

    // Get current account
    const currentAccount = await prisma.currentAccount.findUnique({
      where: { id: currentAccountId }
    });

    if (!currentAccount) {
      return NextResponse.json(
        { success: false, error: 'Cari hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Calculate new balance
      const newBalance = currentAccount.currentBalance + body.amount;

      // Create transaction
      const transaction = await prisma.currentAccountTransaction.create({
        data: {
          currentAccountId: currentAccountId,
          transactionDate: new Date(body.transactionDate),
          type: body.type,
          amount: body.amount,
          description: body.description,
          referenceNumber: body.referenceNumber || null,
          balanceBefore: currentAccount.currentBalance,
          balanceAfter: newBalance,
          userId: userId
        },
        include: {
          invoice: true,
          payment: true,
          user: true
        }
      });

      // Update current account balance
      await prisma.currentAccount.update({
        where: { id: currentAccountId },
        data: {
          currentBalance: newBalance,
          lastActivityDate: new Date(body.transactionDate)
        }
      });

      return transaction;
    });

    // Log activity
    await ActivityLogger.logCreate(
      userId,
      'current_account_transaction',
      result.id,
      {
        currentAccountId: result.currentAccountId,
        type: result.type,
        amount: result.amount,
        description: result.description
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Cari hareket başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Cari hareket oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}