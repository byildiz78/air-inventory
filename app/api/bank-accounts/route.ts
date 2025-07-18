import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};
    
    if (activeOnly) {
      where.isActive = true;
    }

    const bankAccounts = await prisma.bankAccount.findMany({
      where,
      include: {
        _count: {
          select: {
            payments: true
          }
        }
      },
      orderBy: { accountName: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: bankAccounts
    });

  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json(
      { success: false, error: 'Banka hesapları yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || '1';

    const bankAccount = await prisma.bankAccount.create({
      data: {
        accountName: body.accountName,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        iban: body.iban || null,
        currency: body.currency || 'TRY',
        currentBalance: body.currentBalance || 0,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    });

    // Log activity
    await ActivityLogger.logCreate(
      userId,
      'bank_account',
      bankAccount.id,
      {
        accountName: bankAccount.accountName,
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: bankAccount,
      message: 'Banka hesabı başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Error creating bank account:', error);
    return NextResponse.json(
      { success: false, error: 'Banka hesabı oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}