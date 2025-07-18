const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDuplicateCurrentAccounts() {
  console.log('=== FIXING DUPLICATE CURRENT ACCOUNTS ===\n');
  
  try {
    // Find the supplier with multiple accounts
    const supplierWithDuplicates = await prisma.supplier.findFirst({
      where: { name: 'Anadolu Et Pazarıxx' },
      include: {
        currentAccounts: {
          include: {
            transactions: true,
            payments: true
          }
        },
        invoices: true
      }
    });

    if (!supplierWithDuplicates) {
      console.log('No duplicate accounts found');
      return;
    }

    console.log(`Found supplier: ${supplierWithDuplicates.name}`);
    console.log(`Current accounts: ${supplierWithDuplicates.currentAccounts.length}`);

    // Analyze each account
    for (const account of supplierWithDuplicates.currentAccounts) {
      console.log(`\n📊 Account: ${account.code} - ${account.name}`);
      console.log(`   Balance: ${account.currentBalance}`);
      console.log(`   Transactions: ${account.transactions.length}`);
      console.log(`   Payments: ${account.payments.length}`);
      // Get invoices for this account
      const invoices = await prisma.invoice.findMany({
        where: { currentAccountId: account.id }
      });
      console.log(`   Invoices: ${invoices.length}`);
      console.log(`   Created: ${account.createdAt}`);
    }

    // Determine which account to keep (the one with more activity or older one)
    const accounts = supplierWithDuplicates.currentAccounts;
    
    // Sort by activity (transactions + payments) and creation date
    const accountsWithActivity = await Promise.all(accounts.map(async (account) => {
      const invoices = await prisma.invoice.findMany({
        where: { currentAccountId: account.id }
      });
      return {
        ...account,
        invoicesCount: invoices.length,
        totalActivity: account.transactions.length + account.payments.length + invoices.length
      };
    }));
    
    accountsWithActivity.sort((a, b) => {
      if (a.totalActivity !== b.totalActivity) {
        return b.totalActivity - a.totalActivity; // More activity first
      }
      
      return a.createdAt.getTime() - b.createdAt.getTime(); // Older first
    });

    const keepAccount = accountsWithActivity[0];
    const removeAccount = accountsWithActivity[1];

    console.log(`\n🎯 Decision:`);
    console.log(`   KEEP: ${keepAccount.code} - ${keepAccount.name} (${keepAccount.totalActivity} activities)`);
    console.log(`   REMOVE: ${removeAccount.code} - ${removeAccount.name} (${removeAccount.totalActivity} activities)`);

    // Check if the account to remove has any activity
    if (removeAccount.transactions.length > 0 || removeAccount.payments.length > 0 || removeAccount.invoicesCount > 0) {
      console.log(`\n⚠️  Account to remove has activity - need to merge data first`);
      console.log(`   - Transactions: ${removeAccount.transactions.length}`);
      console.log(`   - Payments: ${removeAccount.payments.length}`);
      console.log(`   - Invoices: ${removeAccount.invoicesCount}`);
      
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

      // Merge invoices
      if (removeAccount.invoicesCount > 0) {
        console.log(`   Moving ${removeAccount.invoicesCount} invoices...`);
        await prisma.invoice.updateMany({
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

fixDuplicateCurrentAccounts();