import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StockValueTrend, StockMovementTrend } from '@/types/inventory-reports';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const type = searchParams.get('type') || 'both'; // 'value', 'movement', 'both'

    // Generate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    
    let stockValueTrend: StockValueTrend[] = [];
    let stockMovementTrend: StockMovementTrend[] = [];

    if (type === 'value' || type === 'both') {
      // Get stock movements grouped by date for value trend
      const movements = await prisma.stockMovement.groupBy({
        by: ['date'],
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          totalCost: true,
          quantity: true
        },
        _count: {
          id: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      // Create stock value trend data
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
        
        const dayData = movements.find(movement => {
          const movementDate = new Date(movement.date);
          return movementDate.toDateString() === date.toDateString();
        });

        // Calculate IN and OUT values
        const inMovements = await prisma.stockMovement.aggregate({
          where: {
            date: {
              gte: date,
              lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
            },
            type: 'IN'
          },
          _sum: { totalCost: true }
        });

        const outMovements = await prisma.stockMovement.aggregate({
          where: {
            date: {
              gte: date,
              lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
            },
            type: 'OUT'
          },
          _sum: { totalCost: true }
        });

        const inValue = inMovements._sum.totalCost || 0;
        const outValue = Math.abs(outMovements._sum.totalCost || 0);
        const netChange = inValue - outValue;

        // For total value, we'll use a cumulative approach
        // This is simplified - in reality you'd want to track daily snapshots
        const totalValue = inValue + outValue;

        stockValueTrend.push({
          date: dateStr,
          totalValue,
          inValue,
          outValue,
          netChange
        });
      }
    }

    if (type === 'movement' || type === 'both') {
      // Get stock movements grouped by date for movement trend
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
        
        const [inMovements, outMovements] = await Promise.all([
          prisma.stockMovement.aggregate({
            where: {
              date: {
                gte: date,
                lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
              },
              type: 'IN'
            },
            _sum: { 
              quantity: true,
              totalCost: true 
            }
          }),
          prisma.stockMovement.aggregate({
            where: {
              date: {
                gte: date,
                lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
              },
              type: 'OUT'
            },
            _sum: { 
              quantity: true,
              totalCost: true 
            }
          })
        ]);

        const inQuantity = inMovements._sum.quantity || 0;
        const outQuantity = Math.abs(outMovements._sum.quantity || 0);
        const inValue = inMovements._sum.totalCost || 0;
        const outValue = Math.abs(outMovements._sum.totalCost || 0);

        stockMovementTrend.push({
          date: dateStr,
          inQuantity,
          outQuantity,
          inValue,
          outValue,
          netQuantity: inQuantity - outQuantity,
          netValue: inValue - outValue
        });
      }
    }

    return NextResponse.json({
      stockValueTrend: type === 'movement' ? [] : stockValueTrend,
      stockMovementTrend: type === 'value' ? [] : stockMovementTrend
    });
  } catch (error) {
    console.error('Trends error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}