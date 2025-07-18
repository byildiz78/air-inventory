import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || '1';
    
    console.log('Starting balance recalculation for all current accounts...');

    const result = await prisma.$transaction(async (tx: any) => {
      // Get all current accounts
      const currentAccounts = await tx.currentAccount.findMany({
        include: {
          transactions: {
            orderBy: { transactionDate: 'asc' }
          },
          payments: {
            where: { status: 'COMPLETED' },
            orderBy: { paymentDate: 'asc' }
          }
        }
      });

      let updatedAccounts = 0;
      let totalTransactionsProcessed = 0;
      let totalPaymentsProcessed = 0;

      for (const account of currentAccounts) {
        console.log(`Recalculating balance for account: ${account.code} - ${account.name}`);

        // Start with opening balance
        let runningBalance = account.openingBalance;
        let transactionIndex = 0;
        let paymentIndex = 0;

        // Get all transactions and payments, then sort them by date
        const allOperations: Array<{
          date: Date;
          type: 'transaction' | 'payment';
          amount: number;
          operation: any;
        }> = [];

        // Add transactions (payments are already included as PAYMENT type transactions)
        for (const transaction of account.transactions) {
          allOperations.push({
            date: transaction.transactionDate,
            type: 'transaction',
            amount: transaction.amount,
            operation: transaction
          });
        }

        // Don't add payments separately - they're already included as PAYMENT transactions
        totalPaymentsProcessed += account.payments.length;

        // Sort all operations by date
        allOperations.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Process each operation and update balance snapshots
        for (const op of allOperations) {
          const balanceBefore = runningBalance;
          runningBalance += op.amount;
          const balanceAfter = runningBalance;

          if (op.type === 'transaction') {
            // Update transaction balance snapshots
            await tx.currentAccountTransaction.update({
              where: { id: op.operation.id },
              data: {
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter
              }
            });
            totalTransactionsProcessed++;
          }
          // Note: Payments don't have balance snapshots in their table
        }

        // Update the current account's current balance
        await tx.currentAccount.update({
          where: { id: account.id },
          data: {
            currentBalance: runningBalance
          }
        });

        updatedAccounts++;
        console.log(`Account ${account.code}: Opening=${account.openingBalance}, Final=${runningBalance}, Transactions=${account.transactions.length}, Payments=${account.payments.length}`);
      }

      return {
        updatedAccounts,
        totalTransactionsProcessed,
        totalPaymentsProcessed
      };
    });

    // Log the activity
    await ActivityLogger.logCreate(
      userId,
      'current_account_balance_recalculation',
      'system',
      {
        updatedAccounts: result.updatedAccounts,
        totalTransactionsProcessed: result.totalTransactionsProcessed,
        totalPaymentsProcessed: result.totalPaymentsProcessed
      },
      request
    );

    console.log('Balance recalculation completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Bakiyeler başarıyla yeniden hesaplandı',
      data: {
        updatedAccounts: result.updatedAccounts,
        totalTransactionsProcessed: result.totalTransactionsProcessed,
        totalPaymentsProcessed: result.totalPaymentsProcessed
      }
    });

  } catch (error) {
    console.error('Error recalculating balances:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bakiyeler yeniden hesaplanırken hata oluştu',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}