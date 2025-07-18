const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBalances() {
  console.log('Starting balance recalculation...');
  
  const currentAccounts = await prisma.currentAccount.findMany({
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

  for (const account of currentAccounts) {
    console.log(`\nAccount: ${account.code} - ${account.name}`);
    console.log(`Current Balance in DB: ${account.currentBalance}`);
    
    // Calculate correct balance
    let runningBalance = account.openingBalance;
    
    // Get all operations and sort by date
    const allOperations = [];
    
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
    
    // Sort by date
    allOperations.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate running balance
    for (const op of allOperations) {
      runningBalance += op.amount;
    }
    
    console.log(`Calculated Balance: ${runningBalance}`);
    
    if (Math.abs(account.currentBalance - runningBalance) > 0.01) {
      console.log(`❌ MISMATCH! Updating from ${account.currentBalance} to ${runningBalance}`);
      
      // Update the account
      await prisma.currentAccount.update({
        where: { id: account.id },
        data: { currentBalance: runningBalance }
      });
      
      console.log(`✅ Updated account ${account.code}`);
    } else {
      console.log(`✅ Balance is correct`);
    }
  }
  
  console.log('\nBalance recalculation completed!');
}

fixBalances()
  .catch(console.error)
  .finally(() => prisma.$disconnect());