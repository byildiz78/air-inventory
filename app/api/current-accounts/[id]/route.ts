import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentAccountId = params.id;

    const currentAccount = await prisma.currentAccount.findUnique({
      where: { id: currentAccountId },
      include: {
        supplier: true,
        transactions: {
          include: {
            invoice: true,
            payment: true,
            user: true
          },
          orderBy: { transactionDate: 'desc' }
        },
        payments: {
          include: {
            bankAccount: true,
            user: true
          },
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!currentAccount) {
      return NextResponse.json(
        { success: false, error: 'Cari hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Calculate aging
    const aging = await getAccountAging(currentAccountId);

    return NextResponse.json({
      success: true,
      data: {
        ...currentAccount,
        aging
      }
    });

  } catch (error) {
    console.error('Error fetching current account:', error);
    return NextResponse.json(
      { success: false, error: 'Cari hesap yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentAccountId = params.id;
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || '1';

    // Get existing account
    const existingAccount = await prisma.currentAccount.findUnique({
      where: { id: currentAccountId }
    });

    if (!existingAccount) {
      return NextResponse.json(
        { success: false, error: 'Cari hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Update current account
    const updatedAccount = await prisma.currentAccount.update({
      where: { id: currentAccountId },
      data: {
        name: body.name,
        type: body.type,
        supplierId: body.supplierId || null,
        creditLimit: body.creditLimit || 0,
        contactName: body.contactName || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        taxNumber: body.taxNumber || null,
        isActive: body.isActive !== undefined ? body.isActive : true
      },
      include: {
        supplier: true
      }
    });

    // Log activity
    await ActivityLogger.logUpdate(
      userId,
      'current_account',
      currentAccountId,
      {
        name: existingAccount.name,
        type: existingAccount.type,
        creditLimit: existingAccount.creditLimit
      },
      {
        name: updatedAccount.name,
        type: updatedAccount.type,
        creditLimit: updatedAccount.creditLimit
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedAccount,
      message: 'Cari hesap başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Error updating current account:', error);
    return NextResponse.json(
      { success: false, error: 'Cari hesap güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentAccountId = params.id;
    const userId = request.headers.get('x-user-id') || '1';

    // Check if account has transactions
    const transactionCount = await prisma.currentAccountTransaction.count({
      where: { currentAccountId }
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Hareketli cari hesap silinemez' },
        { status: 400 }
      );
    }

    // Get account info before deletion
    const account = await prisma.currentAccount.findUnique({
      where: { id: currentAccountId }
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Cari hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Delete account
    await prisma.currentAccount.delete({
      where: { id: currentAccountId }
    });

    // Log activity
    await ActivityLogger.logDelete(
      userId,
      'current_account',
      currentAccountId,
      {
        code: account.code,
        name: account.name,
        type: account.type
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Cari hesap başarıyla silindi'
    });

  } catch (error) {
    console.error('Error deleting current account:', error);
    return NextResponse.json(
      { success: false, error: 'Cari hesap silinirken hata oluştu' },
      { status: 500 }
    );
  }
}

// Helper function to calculate account aging
async function getAccountAging(currentAccountId: string) {
  const now = new Date();
  
  // Get current account to get current balance
  const currentAccount = await prisma.currentAccount.findUnique({
    where: { id: currentAccountId }
  });
  
  if (!currentAccount) {
    return {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0
    };
  }
  
  // If current balance is 0 or negative (credit), no aging needed
  if (currentAccount.currentBalance <= 0) {
    return {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0
    };
  }
  
  // Get unpaid debt transactions ordered by date
  const debtTransactions = await prisma.currentAccountTransaction.findMany({
    where: {
      currentAccountId,
      type: 'DEBT'
    },
    orderBy: { transactionDate: 'asc' }
  });
  
  // Get all payments
  const payments = await prisma.payment.findMany({
    where: {
      currentAccountId,
      status: 'COMPLETED'
    },
    orderBy: { paymentDate: 'asc' }
  });
  
  // Calculate remaining debt by applying payments to oldest debts first (FIFO)
  const aging = {
    current: 0,      // 0-30 gün
    days30: 0,       // 31-60 gün
    days60: 0,       // 61-90 gün
    days90: 0        // 90+ gün
  };
  
  let remainingPayments = payments.reduce((total, payment) => total + payment.amount, 0);
  
  for (const transaction of debtTransactions) {
    let remainingDebt = transaction.amount;
    
    // Apply payments to this debt
    if (remainingPayments > 0) {
      const paymentApplied = Math.min(remainingPayments, remainingDebt);
      remainingPayments -= paymentApplied;
      remainingDebt -= paymentApplied;
    }
    
    // If there's still debt remaining, add to aging
    if (remainingDebt > 0) {
      const daysDiff = Math.floor((now.getTime() - transaction.transactionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 30) {
        aging.current += remainingDebt;
      } else if (daysDiff <= 60) {
        aging.days30 += remainingDebt;
      } else if (daysDiff <= 90) {
        aging.days60 += remainingDebt;
      } else {
        aging.days90 += remainingDebt;
      }
    }
  }
  
  return aging;
}