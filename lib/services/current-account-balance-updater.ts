import { prisma } from '@/lib/prisma';

export class CurrentAccountBalanceUpdater {
  /**
   * Recalculates balance snapshots for all transactions of a current account from a specific date
   * @param currentAccountId - ID of the current account
   * @param fromDate - Date from which to recalculate (optional, if not provided, recalculates all)
   * @param tx - Optional transaction context
   */
  static async recalculateAccountBalances(
    currentAccountId: string, 
    fromDate?: Date, 
    tx?: any
  ): Promise<void> {
    const prismaClient = tx || prisma;

    console.log(`Recalculating balances for account ${currentAccountId} from ${fromDate || 'beginning'}`);

    // Get the current account with opening balance
    const currentAccount = await prismaClient.currentAccount.findUnique({
      where: { id: currentAccountId }
    });

    if (!currentAccount) {
      throw new Error(`Current account not found: ${currentAccountId}`);
    }

    // Get all transactions and payments for this account, ordered by date
    const [transactions, payments] = await Promise.all([
      prismaClient.currentAccountTransaction.findMany({
        where: { 
          currentAccountId,
          ...(fromDate ? { transactionDate: { gte: fromDate } } : {})
        },
        orderBy: { transactionDate: 'asc' }
      }),
      prismaClient.payment.findMany({
        where: { 
          currentAccountId,
          status: 'COMPLETED',
          ...(fromDate ? { paymentDate: { gte: fromDate } } : {})
        },
        orderBy: { paymentDate: 'asc' }
      })
    ]);

    // If we're recalculating from a specific date, we need the balance at that point
    let runningBalance = currentAccount.openingBalance;
    
    if (fromDate) {
      // Calculate balance up to the fromDate
      const transactionsBeforeDate = await prismaClient.currentAccountTransaction.findMany({
        where: { 
          currentAccountId,
          transactionDate: { lt: fromDate }
        },
        orderBy: { transactionDate: 'asc' }
      });

      const paymentsBeforeDate = await prismaClient.payment.findMany({
        where: { 
          currentAccountId,
          status: 'COMPLETED',
          paymentDate: { lt: fromDate }
        },
        orderBy: { paymentDate: 'asc' }
      });

      // Calculate balance up to fromDate
      for (const transaction of transactionsBeforeDate) {
        runningBalance += transaction.amount;
      }
      for (const payment of paymentsBeforeDate) {
        runningBalance -= payment.amount; // Payments reduce debt
      }
    }

    // Combine and sort all operations by date
    const allOperations: Array<{
      date: Date;
      type: 'transaction' | 'payment';
      amount: number;
      operation: any;
    }> = [];

    // Add transactions (but skip PAYMENT type transactions as they're already in payments table)
    for (const transaction of transactions) {
      allOperations.push({
        date: transaction.transactionDate,
        type: 'transaction',
        amount: transaction.amount,
        operation: transaction
      });
    }

    // Don't add payments separately - they're already included as PAYMENT transactions

    // Sort by date, then by type (transactions before payments on same date)
    allOperations.sort((a, b) => {
      const dateComparison = a.date.getTime() - b.date.getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // If same date, process transactions before payments
      if (a.type === 'transaction' && b.type === 'payment') return -1;
      if (a.type === 'payment' && b.type === 'transaction') return 1;
      return 0;
    });

    // Update balance snapshots for each operation
    for (const op of allOperations) {
      const balanceBefore = runningBalance;
      runningBalance += op.amount;
      const balanceAfter = runningBalance;

      if (op.type === 'transaction') {
        // Update transaction balance snapshots
        await prismaClient.currentAccountTransaction.update({
          where: { id: op.operation.id },
          data: {
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter
          }
        });
      }
      // Note: Payments don't store balance snapshots in their table
    }

    // Update the current account's current balance
    await prismaClient.currentAccount.update({
      where: { id: currentAccountId },
      data: { currentBalance: runningBalance }
    });

    console.log(`Balance recalculation completed for account ${currentAccountId}. Final balance: ${runningBalance}`);
  }

  /**
   * Recalculates balances for a current account when an invoice is updated
   * @param invoiceId - ID of the updated invoice
   * @param tx - Transaction context
   */
  static async recalculateForInvoiceUpdate(invoiceId: string, tx: any): Promise<void> {
    // Find the current account transaction for this invoice
    const transaction = await tx.currentAccountTransaction.findFirst({
      where: { invoiceId },
      include: { currentAccount: true }
    });

    if (transaction) {
      // Recalculate from the transaction date
      await this.recalculateAccountBalances(
        transaction.currentAccountId,
        transaction.transactionDate,
        tx
      );
    }
  }

  /**
   * Recalculates balances for a current account when a payment is updated
   * @param paymentId - ID of the updated payment
   * @param tx - Transaction context
   */
  static async recalculateForPaymentUpdate(paymentId: string, tx: any): Promise<void> {
    // Find the payment
    const payment = await tx.payment.findUnique({
      where: { id: paymentId }
    });

    if (payment && payment.currentAccountId) {
      // Recalculate from the payment date
      await this.recalculateAccountBalances(
        payment.currentAccountId,
        payment.paymentDate,
        tx
      );
    }
  }
}