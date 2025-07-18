const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncInvoiceCurrentAccounts() {
  console.log('=== SYNCING INVOICE CURRENT ACCOUNTS ===\n');
  
  try {
    // Find invoices that have supplierId but no currentAccountId
    const invoicesNeedingSync = await prisma.invoice.findMany({
      where: {
        supplierId: { not: null },
        currentAccountId: null
      },
      include: {
        supplier: true
      }
    });

    console.log(`Found ${invoicesNeedingSync.length} invoices needing currentAccountId sync`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const invoice of invoicesNeedingSync) {
      try {
        console.log(`\n📄 Invoice: ${invoice.invoiceNumber}`);
        console.log(`   Supplier: ${invoice.supplier?.name || 'Unknown'}`);
        
        // Find current account for this supplier
        const currentAccount = await prisma.currentAccount.findFirst({
          where: { supplierId: invoice.supplierId }
        });

        if (currentAccount) {
          console.log(`   ✅ Found Current Account: ${currentAccount.code} - ${currentAccount.name}`);
          
          // Update invoice with currentAccountId
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { currentAccountId: currentAccount.id }
          });
          
          console.log(`   ✅ Updated invoice with currentAccountId`);
          syncedCount++;
        } else {
          console.log(`   ❌ No current account found for supplier`);
          errorCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error syncing invoice ${invoice.invoiceNumber}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== SYNC SUMMARY ===');
    console.log(`Total invoices needing sync: ${invoicesNeedingSync.length}`);
    console.log(`Successfully synced: ${syncedCount}`);
    console.log(`Errors: ${errorCount}`);

    if (syncedCount > 0) {
      console.log('\n✅ Sync completed successfully!');
    }

  } catch (error) {
    console.error('Sync error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncInvoiceCurrentAccounts();