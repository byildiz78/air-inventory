const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Başlıyor: Mevcut verilerin cari yönetimine geçiş...');

  try {
    // 1. Mevcut tedarikçiler için cari hesap oluştur
    console.log('📊 Tedarikçiler için cari hesap oluşturuluyor...');
    
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'asc' }
    });

    for (let i = 0; i < suppliers.length; i++) {
      const supplier = suppliers[i];
      const code = `CAR${String(i + 1).padStart(3, '0')}`;
      
      console.log(`   Creating current account for ${supplier.name} (${code})`);
      
      await prisma.currentAccount.create({
        data: {
          code: code,
          name: supplier.name,
          type: 'SUPPLIER',
          supplierId: supplier.id,
          contactName: supplier.contactName,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          taxNumber: supplier.taxNumber,
          openingBalance: 0,
          currentBalance: 0,
          creditLimit: 0,
          isActive: true
        }
      });
    }

    console.log(`✅ ${suppliers.length} tedarikçi için cari hesap oluşturuldu.`);

    // 2. Mevcut alış faturalarını cari hareket olarak kaydet
    console.log('📋 Alış faturaları cari hareket olarak kaydediliyor...');
    
    const purchaseInvoices = await prisma.invoice.findMany({
      where: { 
        type: 'PURCHASE',
        supplierId: { not: null }
      },
      include: {
        supplier: true
      },
      orderBy: { date: 'asc' }
    });

    let processedInvoices = 0;
    let skippedInvoices = 0;

    for (const invoice of purchaseInvoices) {
      if (!invoice.supplier) {
        console.log(`   ⚠️ Skipping invoice ${invoice.invoiceNumber} - no supplier`);
        skippedInvoices++;
        continue;
      }

      const currentAccount = await prisma.currentAccount.findFirst({
        where: { supplierId: invoice.supplier.id }
      });

      if (!currentAccount) {
        console.log(`   ⚠️ Skipping invoice ${invoice.invoiceNumber} - no current account found`);
        skippedInvoices++;
        continue;
      }

      // Mevcut bakiyeyi al
      const currentBalance = currentAccount.currentBalance;
      const newBalance = currentBalance + invoice.totalAmount; // Borç artışı

      console.log(`   Processing invoice ${invoice.invoiceNumber} - Amount: ₺${invoice.totalAmount}`);

      // Cari hareket oluştur
      await prisma.currentAccountTransaction.create({
        data: {
          currentAccountId: currentAccount.id,
          invoiceId: invoice.id,
          transactionDate: invoice.date,
          type: 'DEBT',
          amount: invoice.totalAmount,
          description: `${invoice.invoiceNumber} numaralı alış faturası borcu`,
          referenceNumber: invoice.invoiceNumber,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          userId: invoice.userId
        }
      });

      // Cari hesap bakiyesini güncelle
      await prisma.currentAccount.update({
        where: { id: currentAccount.id },
        data: {
          currentBalance: newBalance,
          lastActivityDate: invoice.date
        }
      });

      processedInvoices++;
    }

    console.log(`✅ ${processedInvoices} alış faturası cari hareket olarak kaydedildi.`);
    if (skippedInvoices > 0) {
      console.log(`⚠️ ${skippedInvoices} fatura atlandı (tedarikçi bulunamadı).`);
    }

    // 3. Satış faturalarını da işle (müşteri cari hesabı olmadığı için sadece info)
    const saleInvoices = await prisma.invoice.findMany({
      where: { type: 'SALE' }
    });

    console.log(`ℹ️ ${saleInvoices.length} satış faturası bulundu (müşteri cari hesabı olmadığı için şimdilik atlandı).`);

    // 4. Örnek banka hesabı oluştur
    console.log('🏦 Örnek banka hesabı oluşturuluyor...');
    
    const existingBankAccount = await prisma.bankAccount.findFirst();
    
    if (!existingBankAccount) {
      await prisma.bankAccount.create({
        data: {
          accountName: 'Ana Hesap',
          bankName: 'Örnek Banka',
          accountNumber: '1234567890',
          iban: 'TR640006400000112345678901',
          currency: 'TRY',
          currentBalance: 0,
          isActive: true
        }
      });
      console.log('✅ Örnek banka hesabı oluşturuldu.');
    } else {
      console.log('ℹ️ Banka hesabı zaten mevcut.');
    }

    // 5. Özet rapor
    console.log('\n📊 ÖZET RAPOR:');
    console.log('================');
    
    const totalCurrentAccounts = await prisma.currentAccount.count();
    const totalTransactions = await prisma.currentAccountTransaction.count();
    const totalDebt = await prisma.currentAccountTransaction.aggregate({
      where: { type: 'DEBT' },
      _sum: { amount: true }
    });
    const totalBankAccounts = await prisma.bankAccount.count();

    console.log(`📈 Toplam Cari Hesap: ${totalCurrentAccounts}`);
    console.log(`📋 Toplam Cari Hareket: ${totalTransactions}`);
    console.log(`💰 Toplam Borç: ₺${totalDebt._sum.amount?.toLocaleString() || 0}`);
    console.log(`🏦 Toplam Banka Hesabı: ${totalBankAccounts}`);

    // 6. Cari hesap bakiyelerini kontrol et
    console.log('\n🔍 Cari hesap bakiyeleri:');
    const currentAccountsWithBalance = await prisma.currentAccount.findMany({
      where: {
        currentBalance: { gt: 0 }
      },
      include: {
        supplier: true
      },
      orderBy: { currentBalance: 'desc' }
    });

    for (const account of currentAccountsWithBalance) {
      console.log(`   ${account.supplier?.name || account.name}: ₺${account.currentBalance.toLocaleString()}`);
    }

    console.log('\n🎉 Veri geçişi başarıyla tamamlandı!');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();