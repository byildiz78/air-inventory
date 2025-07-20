import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { ActivityLogger } from '@/lib/activity-logger';

export const GET = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const type = searchParams.get('type');
    const paymentStatus = searchParams.get('paymentStatus');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (categoryId) {
      where.expenseItemId = categoryId; // Using categoryId as expenseItemId for backward compatibility
    }
    
    if (type) {
      where.expenseItem = {
        subCategory: {
          mainCategory: {
            code: type === 'FIXED' ? 'FIXED' : type === 'VARIABLE' ? 'VARIABLE' : type === 'PERSONNEL' ? 'PERSONNEL' : type
          }
        }
      };
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          expenseItem: {
            include: {
              subCategory: {
                include: {
                  mainCategory: true
                }
              }
            }
          },
          batch: {
            select: {
              id: true,
              batchNumber: true,
              name: true
            }
          },
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.expense.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: expenses,
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
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch expenses'
      },
      { status: 500 }
    );
  }
});

export const POST = AuthMiddleware.withAuth(async (request: NextRequest) => {
  try {
    console.log('POST /api/expenses - Request received');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('Authorization header:', request.headers.get('Authorization'));
    
    const body = await request.json();
    const {
      categoryId,
      description,
      amount,
      date,
      isRecurring,
      recurringPeriod,
      recurringEndDate,
      invoiceNumber,
      paymentStatus,
      paymentDate,
      notes,
      attachmentUrl
    } = body;

    // Validate required fields
    if (!categoryId || !description || !amount || !date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category, description, amount and date are required'
        },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Amount must be greater than zero'
        },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found'
        },
        { status: 404 }
      );
    }


    // Create expense
    const authenticatedRequest = request as any;
    const userId = authenticatedRequest.user?.userId || authenticatedRequest.user?.id;
    
    console.log('User from token:', authenticatedRequest.user);
    console.log('Extracted userId:', userId);
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated'
        },
        { status: 401 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        expenseItemId: categoryId,
        description,
        amount: parseFloat(amount.toString()),
        date: new Date(date),
        isRecurring: Boolean(isRecurring),
        recurringPeriod: isRecurring ? recurringPeriod : null,
        recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate) : null,
        invoiceNumber: invoiceNumber || null,
        paymentStatus: paymentStatus || 'PENDING',
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        notes: notes || null,
        attachmentUrl: attachmentUrl || null,
        userId
      },
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
    });

    // Log activity
    await ActivityLogger.logCreate(
      userId,
      'expense',
      expense.id,
      {
        description: expense.description,
        amount: expense.amount,
        categoryName: category.name
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: expense
    });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create expense'
      },
      { status: 500 }
    );
  }
});