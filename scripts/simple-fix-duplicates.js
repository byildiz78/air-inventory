const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simpleFixDuplicates() {
  console.log('=== SIMPLE FIX FOR DUPLICATE ACCOUNTS ===\n');
  
  try {
    // Get all current accounts for Anadolu Et Pazarıxx
    const accounts = await prisma.currentAccount.findMany({
      where: { name: 'Anadolu Et Pazarıxx' },
      include: {
        transactions: true,
        payments: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${accounts.length} accounts for Anadolu Et Pazarıxx`);
    
    for (const account of accounts) {
      console.log(`\n📊 Account: ${account.code} - ${account.name}`);
      console.log(`   Balance: ${account.currentBalance}`);
      console.log(`   Transactions: ${account.transactions.length}`);
      console.log(`   Payments: ${account.payments.length}`);
      console.log(`   Created: ${account.createdAt}`);
    }

    // Keep the first one (CAR001) and remove the second one (CAR005)
    const keepAccount = accounts.find(acc => acc.code === 'CAR001');
    const removeAccount = accounts.find(acc => acc.code === 'CAR005');

    if (!keepAccount || !removeAccount) {
      console.log('Could not find both accounts');
      return;
    }

    console.log(`\n🎯 Decision:`);
    console.log(`   KEEP: ${keepAccount.code} - ${keepAccount.name} (${keepAccount.transactions.length + keepAccount.payments.length} activities)`);
    console.log(`   REMOVE: ${removeAccount.code} - ${removeAccount.name} (${removeAccount.transactions.length + removeAccount.payments.length} activities)`);

    // Check if the account to remove has any activity
    if (removeAccount.transactions.length > 0 || removeAccount.payments.length > 0) {
      console.log(`\n⚠️  Account to remove has activity - need to merge data first`);
      console.log(`   - Transactions: ${removeAccount.transactions.length}`);
      console.log(`   - Payments: ${removeAccount.payments.length}`);
      
      // Merge transactions
      if (removeAccount.transactions.length > 0) {
        console.log(`   Moving ${removeAccount.transactions.length} transactions...`);
        await prisma.currentAccountTransaction.updateMany({
          where: { currentAccountId: removeAccount.id },
          data: { currentAccountId: keepAccount.id }
        });
      }

      // Merge payments
      if (removeAccount.payments.length > 0) {
        console.log(`   Moving ${removeAccount.payments.length} payments...`);
        await prisma.payment.updateMany({
          where: { currentAccountId: removeAccount.id },
          data: { currentAccountId: keepAccount.id }
        });
      }

      // Merge balances
      const totalBalance = keepAccount.currentBalance + removeAccount.currentBalance;
      console.log(`   Merging balances: ${keepAccount.currentBalance} + ${removeAccount.currentBalance} = ${totalBalance}`);
      
      await prisma.currentAccount.update({
        where: { id: keepAccount.id },
        data: { currentBalance: totalBalance }
      });
    }

    // Now remove the duplicate account
    console.log(`\n🗑️  Removing duplicate account: ${removeAccount.code}`);
    await prisma.currentAccount.delete({
      where: { id: removeAccount.id }
    });

    console.log(`\n✅ Successfully merged and removed duplicate account`);
    console.log(`   Kept account: ${keepAccount.code} - ${keepAccount.name}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleFixDuplicates();