import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

/**
 * @swagger
 * /api/current-accounts:
 *   get:
 *     summary: Retrieve current accounts with filtering and pagination
 *     description: Get a list of current accounts with support for filtering by type, search, and pagination
 *     tags:
 *       - Current Accounts
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for account name or code
 *         example: "ABC"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SUPPLIER, CUSTOMER, BOTH]
 *         description: Filter by account type
 *         example: "SUPPLIER"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Successfully retrieved current accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CurrentAccount'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     pages:
 *                       type: integer
 *                       example: 10
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new current account
 *     description: Create a new current account with automatic code generation
 *     tags:
 *       - Current Accounts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Account name
 *                 example: "ABC Tedarik Ltd."
 *               type:
 *                 type: string
 *                 enum: [SUPPLIER, CUSTOMER, BOTH]
 *                 description: Account type
 *                 example: "SUPPLIER"
 *               supplierId:
 *                 type: string
 *                 description: Associated supplier ID
 *                 example: "clx1234567890"
 *               openingBalance:
 *                 type: number
 *                 format: float
 *                 description: Opening balance
 *                 example: 0.00
 *               creditLimit:
 *                 type: number
 *                 format: float
 *                 description: Credit limit
 *                 example: 10000.00
 *               contactName:
 *                 type: string
 *                 description: Contact person name
 *                 example: "Ahmet Yılmaz"
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "+90 555 123 4567"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: "info@abctedarik.com"
 *               address:
 *                 type: string
 *                 description: Address
 *                 example: "Atatürk Cad. No:123 Şişli/İstanbul"
 *               taxNumber:
 *                 type: string
 *                 description: Tax number
 *                 example: "1234567890"
 *               isActive:
 *                 type: boolean
 *                 description: Whether the account is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Current account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CurrentAccount'
 *                 message:
 *                   type: string
 *                   example: "Cari hesap başarıyla oluşturuldu"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Calculate real-time balance for a current account
async function calculateRealTimeBalance(currentAccountId: string, openingBalance: number): Promise<number> {
  // Get all transactions for this account (payments are already included as PAYMENT type transactions)
  const transactions = await prisma.currentAccountTransaction.findMany({
    where: { currentAccountId },
    orderBy: { transactionDate: 'asc' }
  });

  // Calculate balance: opening + all transactions (including payments)
  let balance = openingBalance;
  
  // Add transaction amounts (PAYMENT transactions already have negative amounts)
  for (const transaction of transactions) {
    balance += transaction.amount;
  }

  return balance;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type !== 'all') {
      where.type = type;
    }

    // Get total count
    const total = await prisma.currentAccount.count({ where });

    // Get current accounts
    const currentAccounts = await prisma.currentAccount.findMany({
      where,
      include: {
        supplier: true,
        _count: {
          select: {
            transactions: true,
            payments: true
          }
        }
      },
      orderBy: [
        { currentBalance: 'desc' },
        { name: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    // Calculate aging and real-time balance for each account
    const enrichedAccounts = await Promise.all(
      currentAccounts.map(async (account) => {
        // Get aging analysis
        const aging = await getAccountAging(account.id);
        
        // Get last transaction date
        const lastTransaction = await prisma.currentAccountTransaction.findFirst({
          where: { currentAccountId: account.id },
          orderBy: { transactionDate: 'desc' },
          select: { transactionDate: true }
        });

        // Calculate real-time balance
        const realTimeBalance = await calculateRealTimeBalance(account.id, account.openingBalance);

        return {
          ...account,
          currentBalance: realTimeBalance, // Override with real-time calculation
          aging,
          lastTransactionDate: lastTransaction?.transactionDate || null
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedAccounts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching current accounts:', error);
    return NextResponse.json(
      { success: false, error: 'Cari hesaplar yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || '1';

    console.log('Creating current account with data:', body);

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Cari hesap adı gereklidir' },
        { status: 400 }
      );
    }

    // Generate unique code
    const lastAccount = await prisma.currentAccount.findFirst({
      orderBy: { code: 'desc' }
    });
    
    let nextNumber = 1;
    if (lastAccount?.code) {
      const match = lastAccount.code.match(/CAR(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    const code = `CAR${String(nextNumber).padStart(3, '0')}`;

    // Create current account
    const currentAccount = await prisma.currentAccount.create({
      data: {
        code,
        name: body.name,
        type: body.type || 'SUPPLIER',
        supplierId: body.supplierId || null,
        openingBalance: body.openingBalance || 0,
        currentBalance: body.openingBalance || 0,
        creditLimit: body.creditLimit || 0,
        contactName: body.contactName || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        taxNumber: body.taxNumber || null,
        isActive: body.isActive !== undefined ? body.isActive : true
      },
      include: {
        supplier: true
      }
    });

    // Create opening balance transaction if needed
    if (body.openingBalance && body.openingBalance !== 0) {
      await prisma.currentAccountTransaction.create({
        data: {
          currentAccountId: currentAccount.id,
          transactionDate: new Date(),
          type: body.openingBalance > 0 ? 'CREDIT' : 'DEBT',
          amount: Math.abs(body.openingBalance),
          description: 'Açılış bakiyesi',
          referenceNumber: code,
          balanceBefore: 0,
          balanceAfter: body.openingBalance,
          userId: userId
        }
      });
    }

    // Log activity
    await ActivityLogger.logCreate(
      userId,
      'current_account',
      currentAccount.id,
      {
        code: currentAccount.code,
        name: currentAccount.name,
        type: currentAccount.type,
        openingBalance: currentAccount.openingBalance
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: currentAccount,
      message: 'Cari hesap başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Error creating current account:', error);
    return NextResponse.json(
      { success: false, error: 'Cari hesap oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}

// Helper function to calculate account aging
async function getAccountAging(currentAccountId: string) {
  const now = new Date();
  const transactions = await prisma.currentAccountTransaction.findMany({
    where: {
      currentAccountId,
      type: 'DEBT'
    },
    orderBy: { transactionDate: 'asc' }
  });

  const aging = {
    current: 0,      // 0-30 gün
    days30: 0,       // 31-60 gün
    days60: 0,       // 61-90 gün
    days90: 0        // 90+ gün
  };

  for (const transaction of transactions) {
    const daysDiff = Math.floor((now.getTime() - transaction.transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 30) {
      aging.current += transaction.amount;
    } else if (daysDiff <= 60) {
      aging.days30 += transaction.amount;
    } else if (daysDiff <= 90) {
      aging.days60 += transaction.amount;
    } else {
      aging.days90 += transaction.amount;
    }
  }

  return aging;
}