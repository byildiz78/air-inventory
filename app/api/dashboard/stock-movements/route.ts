import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StockMovementSummary } from '@/types/dashboard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const movements = await prisma.stockMovement.findMany({
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        material: {
          select: { name: true }
        },
        warehouse: {
          select: { name: true }
        },
        unit: {
          select: { name: true, abbreviation: true }
        }
      }
    });

    const stockMovements: StockMovementSummary[] = movements.map(movement => ({
      id: movement.id,
      materialName: movement.material.name,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason || 'Sebep belirtilmemiş',
      date: movement.date,
      warehouseName: movement.warehouse?.name,
      unitName: movement.unit.abbreviation
    }));

    return NextResponse.json(stockMovements);
  } catch (error) {
    console.error('Stock movements error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    );
  }
}