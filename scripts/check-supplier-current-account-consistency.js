const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSupplierCurrentAccountConsistency() {
  console.log('=== SUPPLIER & CURRENT ACCOUNT CONSISTENCY CHECK ===\n');
  
  try {
    // Get all suppliers with their current accounts
    const suppliers = await prisma.supplier.findMany({
      include: {
        currentAccounts: true,
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Found ${suppliers.length} suppliers\n`);

    // Check each supplier
    let suppliersWithoutCurrentAccount = 0;
    let suppliersWithMultipleAccounts = 0;
    let suppliersWithInvoicesButNoAccount = 0;
    let totalInvoicesAffected = 0;

    for (const supplier of suppliers) {
      console.log(`📊 Supplier: ${supplier.name}`);
      console.log(`   ID: ${supplier.id}`);
      console.log(`   Current Accounts: ${supplier.currentAccounts.length}`);
      console.log(`   Invoices: ${supplier.invoices.length}`);
      
      // Check current account status
      if (supplier.currentAccounts.length === 0) {
        suppliersWithoutCurrentAccount++;
        console.log(`   ❌ NO CURRENT ACCOUNT`);
        
        if (supplier.invoices.length > 0) {
          suppliersWithInvoicesButNoAccount++;
          totalInvoicesAffected += supplier.invoices.length;
          console.log(`   ⚠️  HAS INVOICES BUT NO CURRENT ACCOUNT - CRITICAL!`);
        }
      } else if (supplier.currentAccounts.length > 1) {
        suppliersWithMultipleAccounts++;
        console.log(`   ⚠️  MULTIPLE CURRENT ACCOUNTS:`);
        supplier.currentAccounts.forEach((acc, idx) => {
          console.log(`      ${idx + 1}. ${acc.code} - ${acc.name} (Balance: ${acc.currentBalance})`);
        });
      } else {
        const account = supplier.currentAccounts[0];
        console.log(`   ✅ Current Account: ${account.code} - ${account.name} (Balance: ${account.currentBalance})`);
      }
      
      console.log('');
    }

    // Check current accounts that reference suppliers
    console.log('\n=== CURRENT ACCOUNTS WITH SUPPLIER REFERENCES ===');
    const currentAccountsWithSuppliers = await prisma.currentAccount.findMany({
      where: {
        supplierId: { not: null }
      },
      include: {
        supplier: true
      }
    });

    console.log(`Found ${currentAccountsWithSuppliers.length} current accounts with supplier references`);

    // Check for orphaned current accounts (supplier reference but supplier doesn't exist)
    let orphanedAccounts = 0;
    for (const account of currentAccountsWithSuppliers) {
      if (!account.supplier) {
        orphanedAccounts++;
        console.log(`❌ Orphaned Account: ${account.code} - ${account.name} (references supplier ID: ${account.supplierId})`);
      }
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total Suppliers: ${suppliers.length}`);
    console.log(`Suppliers without Current Account: ${suppliersWithoutCurrentAccount}`);
    console.log(`Suppliers with Multiple Accounts: ${suppliersWithMultipleAccounts}`);
    console.log(`Suppliers with Invoices but No Account: ${suppliersWithInvoicesButNoAccount} ⚠️`);
    console.log(`Total Invoices Affected: ${totalInvoicesAffected} ⚠️`);
    console.log(`Orphaned Current Accounts: ${orphanedAccounts}`);
    
    // Check invoices that reference suppliers
    console.log('\n=== INVOICE SUPPLIER REFERENCES ===');
    const invoicesWithSuppliers = await prisma.invoice.findMany({
      where: {
        supplierId: { not: null }
      },
      include: {
        supplier: true
      },
      orderBy: { invoiceNumber: 'asc' }
    });

    console.log(`Found ${invoicesWithSuppliers.length} invoices with supplier references`);

    // Check for invoices with invalid supplier references
    let invalidSupplierRefs = 0;
    for (const invoice of invoicesWithSuppliers) {
      if (!invoice.supplier) {
        invalidSupplierRefs++;
        console.log(`❌ Invalid Supplier Reference: Invoice ${invoice.invoiceNumber} references supplier ID: ${invoice.supplierId}`);
      }
    }

    console.log(`Invoices with Invalid Supplier References: ${invalidSupplierRefs}`);

    console.log('\n=== MIGRATION READINESS ===');
    if (suppliersWithInvoicesButNoAccount === 0 && invalidSupplierRefs === 0) {
      console.log('✅ READY FOR MIGRATION - All suppliers with invoices have current accounts');
    } else {
      console.log('❌ NOT READY - Fix data consistency issues first');
      console.log('Next steps:');
      if (suppliersWithInvoicesButNoAccount > 0) {
        console.log(`  1. Create current accounts for ${suppliersWithInvoicesButNoAccount} suppliers with invoices`);
      }
      if (invalidSupplierRefs > 0) {
        console.log(`  2. Fix ${invalidSupplierRefs} invoices with invalid supplier references`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSupplierCurrentAccountConsistency();