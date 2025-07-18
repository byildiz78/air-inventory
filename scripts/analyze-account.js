const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeAccount() {
  console.log('Analyzing CAR003 account...');
  
  const account = await prisma.currentAccount.findFirst({
    where: { code: 'CAR003' },
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

  if (!account) {
    console.log('Account not found');
    return;
  }

  console.log(`\n=== ACCOUNT: ${account.code} - ${account.name} ===`);
  console.log(`Opening Balance: ${account.openingBalance}`);
  console.log(`Current Balance in DB: ${account.currentBalance}`);
  
  console.log('\n=== TRANSACTIONS ===');
  let runningBalance = account.openingBalance;
  
  // Show all transactions with their stored balanceAfter
  for (const transaction of account.transactions) {
    console.log(`${transaction.transactionDate.toISOString().split('T')[0]} | ${transaction.type} | ${transaction.amount} | Description: ${transaction.description}`);
    console.log(`  Stored: balanceBefore=${transaction.balanceBefore}, balanceAfter=${transaction.balanceAfter}`);
    
    runningBalance += transaction.amount;
    console.log(`  Calculated: runningBalance=${runningBalance}`);
    console.log('');
  }
  
  console.log('=== PAYMENTS ===');
  for (const payment of account.payments) {
    console.log(`${payment.paymentDate.toISOString().split('T')[0]} | PAYMENT | -${payment.amount} | ${payment.description || 'Payment'}`);
    console.log(`  Payment Reference: ${payment.paymentNumber}`);
    
    runningBalance -= payment.amount;
    console.log(`  After Payment: runningBalance=${runningBalance}`);
    console.log('');
  }
  
  console.log(`=== SUMMARY ===`);
  console.log(`Final Calculated Balance: ${runningBalance}`);
  console.log(`Database Current Balance: ${account.currentBalance}`);
  console.log(`Latest Transaction Balance: ${account.transactions[account.transactions.length - 1]?.balanceAfter || 'N/A'}`);
  
  // Check if balanceAfter values include payments
  const lastTransaction = account.transactions[account.transactions.length - 1];
  if (lastTransaction && lastTransaction.balanceAfter !== account.currentBalance) {
    console.log(`\n❌ ISSUE FOUND:`);
    console.log(`Last transaction balanceAfter (${lastTransaction.balanceAfter}) != Current Balance (${account.currentBalance})`);
    console.log(`This suggests payments are not reflected in transaction balanceAfter values`);
  }
}

analyzeAccount()
  .catch(console.error)
  .finally(() => prisma.$disconnect());