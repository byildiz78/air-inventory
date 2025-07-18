import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentAccountId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const detailed = searchParams.get('detailed') === 'true';
    
    console.log('Statement API called:', {
      currentAccountId,
      startDate,
      endDate,
      detailed
    });

    // Get current account info
    const currentAccount = await prisma.currentAccount.findUnique({
      where: { id: currentAccountId },
      include: {
        supplier: true
      }
    });

    if (!currentAccount) {
      return NextResponse.json(
        { success: false, error: 'Cari hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      // Add 1 day to include the end date
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      dateFilter.lt = endDateObj;
    }

    // Get transactions in date range
    console.log('Fetching transactions with filter:', { currentAccountId, dateFilter });
    
    const transactions = await prisma.currentAccountTransaction.findMany({
      where: {
        currentAccountId,
        ...(Object.keys(dateFilter).length > 0 ? { transactionDate: dateFilter } : {})
      },
      include: detailed ? {
        invoice: {
          include: {
            items: {
              include: {
                material: true,
                unit: true
              }
            }
          }
        },
        payment: {
          include: {
            bankAccount: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      } : {
        invoice: {
          select: {
            invoiceNumber: true,
            totalAmount: true
          }
        },
        payment: {
          select: {
            paymentNumber: true,
            paymentMethod: true,
            amount: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        transactionDate: 'asc'
      }
    });
    
    console.log('Transactions found:', transactions.length);

    // Get payments in date range (for completed payments that might not have transactions)
    console.log('Fetching payments...');
    
    const payments = await prisma.payment.findMany({
      where: {
        currentAccountId,
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length > 0 ? { paymentDate: dateFilter } : {})
      },
      include: detailed ? {
        bankAccount: true,
        user: {
          select: {
            name: true
          }
        }
      } : {
        bankAccount: {
          select: {
            accountName: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        paymentDate: 'asc'
      }
    });
    
    console.log('Payments found:', payments.length);

    // Calculate opening balance for the period
    let openingBalance = currentAccount.openingBalance;
    
    if (startDate) {
      // Get all transactions before start date
      const transactionsBeforeStart = await prisma.currentAccountTransaction.findMany({
        where: {
          currentAccountId,
          transactionDate: {
            lt: new Date(startDate)
          }
        }
      });

      const paymentsBeforeStart = await prisma.payment.findMany({
        where: {
          currentAccountId,
          status: 'COMPLETED',
          paymentDate: {
            lt: new Date(startDate)
          }
        }
      });

      // Calculate opening balance for the period
      for (const transaction of transactionsBeforeStart) {
        openingBalance += transaction.amount;
      }
      for (const payment of paymentsBeforeStart) {
        openingBalance -= payment.amount;
      }
    }

    // Combine and sort all operations
    const allOperations: Array<{
      date: Date;
      type: 'transaction' | 'payment';
      amount: number;
      description: string;
      referenceNumber?: string;
      balance: number;
      details?: any;
    }> = [];

    // Combine and sort all operations first
    const allOperationsRaw: Array<{
      date: Date;
      type: 'transaction' | 'payment';
      amount: number;
      description: string;
      referenceNumber?: string;
      details?: any;
      originalData: any;
    }> = [];

    // Add transactions
    for (const transaction of transactions) {
      allOperationsRaw.push({
        date: transaction.transactionDate,
        type: 'transaction',
        amount: transaction.amount,
        description: transaction.description,
        referenceNumber: transaction.referenceNumber || undefined,
        details: detailed ? {
          id: transaction.id,
          transactionType: transaction.type,
          invoice: transaction.invoice,
          payment: transaction.payment,
          user: transaction.user
        } : undefined,
        originalData: transaction
      });
    }

    // Add payments (that might not have corresponding transactions)
    for (const payment of payments) {
      // Check if this payment already has a transaction
      const hasTransaction = transactions.some(t => t.paymentId === payment.id);
      if (!hasTransaction) {
        allOperationsRaw.push({
          date: payment.paymentDate,
          type: 'payment',
          amount: -payment.amount, // Payments are negative (reduce debt)
          description: payment.description || `${payment.paymentNumber} numaralı ödeme`,
          referenceNumber: payment.paymentNumber,
          details: detailed ? {
            id: payment.id,
            paymentMethod: payment.paymentMethod,
            bankAccount: payment.bankAccount,
            user: payment.user
          } : undefined,
          originalData: payment
        });
      }
    }

    // Sort all operations by date
    allOperationsRaw.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate running balance properly
    let runningBalance = openingBalance;
    for (const operation of allOperationsRaw) {
      runningBalance += operation.amount;
      
      allOperations.push({
        date: operation.date,
        type: operation.type,
        amount: operation.amount,
        description: operation.description,
        referenceNumber: operation.referenceNumber,
        balance: runningBalance,
        details: operation.details
      });
    }

    // Calculate period summary correctly
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const operation of allOperations) {
      if (operation.amount > 0) {
        totalDebit += operation.amount;
      } else {
        totalCredit += Math.abs(operation.amount);
      }
    }

    const periodSummary = {
      openingBalance,
      closingBalance: runningBalance,
      totalDebit,
      totalCredit,
      transactionCount: allOperations.length
    };

    const result = {
      account: {
        id: currentAccount.id,
        code: currentAccount.code,
        name: currentAccount.name,
        type: currentAccount.type,
        supplier: currentAccount.supplier
      },
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      summary: periodSummary,
      operations: allOperations,
      detailed
    };
    
    console.log('Statement API result:', {
      accountId: currentAccount.id,
      operationCount: allOperations.length,
      summary: periodSummary
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error generating account statement:', error);
    return NextResponse.json(
      { success: false, error: 'Ekstre oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}