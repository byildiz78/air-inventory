const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateInvoicesToCurrentAccounts() {
  console.log('=== MIGRATING INVOICES TO CURRENT ACCOUNTS ===\n');
  
  try {
    // Get all invoices that have supplierId but no currentAccountId
    const invoicesToMigrate = await prisma.invoice.findMany({
      where: {
        supplierId: { not: null },
        currentAccountId: null
      },
      include: {
        supplier: true
      }
    });

    console.log(`Found ${invoicesToMigrate.length} invoices to migrate\n`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const invoice of invoicesToMigrate) {
      try {
        console.log(`📄 Invoice: ${invoice.invoiceNumber}`);
        console.log(`   Supplier: ${invoice.supplier?.name || 'Unknown'}`);
        console.log(`   Supplier ID: ${invoice.supplierId}`);
        
        // Find the current account for this supplier
        const currentAccount = await prisma.currentAccount.findFirst({
          where: { supplierId: invoice.supplierId }
        });

        if (currentAccount) {
          console.log(`   ✅ Found Current Account: ${currentAccount.code} - ${currentAccount.name}`);
          
          // Update the invoice
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { currentAccountId: currentAccount.id }
          });
          
          console.log(`   ✅ Updated invoice with currentAccountId: ${currentAccount.id}`);
          migratedCount++;
        } else {
          console.log(`   ❌ No current account found for supplier: ${invoice.supplier?.name}`);
          errorCount++;
        }
        
        console.log('');
      } catch (error) {
        console.error(`   ❌ Error migrating invoice ${invoice.invoiceNumber}:`, error.message);
        errorCount++;
      }
    }

    console.log('=== MIGRATION SUMMARY ===');
    console.log(`Total invoices to migrate: ${invoicesToMigrate.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Errors: ${errorCount}`);

    if (migratedCount > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('All invoices now have currentAccountId references.');
    }

    // Verify the migration
    console.log('\n=== VERIFICATION ===');
    const remainingInvoices = await prisma.invoice.findMany({
      where: {
        supplierId: { not: null },
        currentAccountId: null
      }
    });

    console.log(`Invoices still without currentAccountId: ${remainingInvoices.length}`);
    
    if (remainingInvoices.length === 0) {
      console.log('✅ All invoices have been successfully migrated!');
    } else {
      console.log('❌ Some invoices still need migration');
    }

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateInvoicesToCurrentAccounts();