import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

// GET /api/expenses/batches - Fetch expense batches with pagination
export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (year) {
      where.periodYear = year;
    }
    
    if (month) {
      where.periodMonth = month;
    }
    
    if (status) {
      where.status = status;
    }

    const [batches, totalCount] = await Promise.all([
      prisma.expenseBatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true }
          },
          items: {
            include: {
              expenseItem: {
                include: {
                  subCategory: {
                    include: {
                      mainCategory: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.expenseBatch.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: batches,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: skip + limit < totalCount,
        hasPreviousPage: page > 1
      }
    });

  } catch (error: any) {
    console.error('Error fetching expense batches:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch expense batches'
      },
      { status: 500 }
    );
  }
});

// POST /api/expenses/batches - Create new expense batch
export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      name,
      description,
      periodYear,
      periodMonth,
      items // Array of { expenseItemId, description, amount, paymentStatus, paymentDate, invoiceNumber, notes }
    } = body;

    // Validate required fields
    if (!name || !periodYear || !periodMonth || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, period year, period month, and items are required'
        },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.expenseItemId || !item.description || !item.amount) {
        return NextResponse.json(
          {
            success: false,
            error: 'Each item must have expenseItemId, description, and amount'
          },
          { status: 400 }
        );
      }

      if (item.amount <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Item amounts must be greater than zero'
          },
          { status: 400 }
        );
      }
    }

    // Get user ID from request
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated'
        },
        { status: 401 }
      );
    }

    // Generate batch number
    const existingBatchesCount = await prisma.expenseBatch.count({
      where: {
        periodYear,
        periodMonth
      }
    });
    const batchNumber = `EB-${periodYear}-${periodMonth.toString().padStart(2, '0')}-${(existingBatchesCount + 1).toString().padStart(3, '0')}`;

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);

    // Create batch with items in a transaction
    const batch = await prisma.$transaction(async (tx) => {
      // Create the batch
      const createdBatch = await tx.expenseBatch.create({
        data: {
          batchNumber,
          name,
          description: description || null,
          periodYear,
          periodMonth,
          totalAmount,
          status: 'DRAFT',
          userId
        }
      });

      // Create batch items
      const batchItems = await tx.expenseBatchItem.createMany({
        data: items.map((item: any) => ({
          batchId: createdBatch.id,
          expenseItemId: item.expenseItemId,
          description: item.description,
          amount: parseFloat(item.amount),
          paymentStatus: item.paymentStatus || 'PENDING',
          paymentDate: item.paymentDate ? new Date(item.paymentDate) : null,
          invoiceNumber: item.invoiceNumber || null,
          notes: item.notes || null,
          attachmentUrl: item.attachmentUrl || null
        }))
      });

      return createdBatch;
    });

    // Log activity
    await ActivityLogger.logCreate(
      userId,
      'expense_batch',
      batch.id,
      {
        batchNumber: batch.batchNumber,
        name: batch.name,
        totalAmount: batch.totalAmount,
        itemCount: items.length
      },
      request
    );

    // Fetch the created batch with full details
    const fullBatch = await prisma.expenseBatch.findUnique({
      where: { id: batch.id },
      include: {
        user: {
          select: { id: true, name: true }
        },
        items: {
          include: {
            expenseItem: {
              include: {
                subCategory: {
                  include: {
                    mainCategory: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: fullBatch
    });

  } catch (error: any) {
    console.error('Error creating expense batch:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create expense batch'
      },
      { status: 500 }
    );
  }
});