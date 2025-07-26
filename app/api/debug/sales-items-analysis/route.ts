import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all sales items with full details
    const allItems = await prisma.salesItem.findMany({
      include: {
        category: true,
        group: true
      }
    });

    // Count by various criteria
    const total = allItems.length;
    const active = allItems.filter(item => item.isActive).length;
    const inactive = allItems.filter(item => !item.isActive).length;
    const available = allItems.filter(item => item.isAvailable).length;
    const unavailable = allItems.filter(item => !item.isAvailable).length;
    const withCategory = allItems.filter(item => item.categoryId).length;
    const withoutCategory = allItems.filter(item => !item.categoryId).length;
    const withGroup = allItems.filter(item => item.groupId).length;
    const withoutGroup = allItems.filter(item => !item.groupId).length;
    const fromPOS = allItems.filter(item => item.externalSystem === 'POS').length;
    const manual = allItems.filter(item => item.externalSystem !== 'POS').length;

    // Check what would be displayed in frontend (simulating frontend filter)
    const displayableItems = allItems.filter(item => {
      // Items that would be shown in the UI (have category)
      return item.categoryId && item.category;
    });

    // Sample problematic items (without category)
    const problematicItems = allItems
      .filter(item => !item.categoryId || !item.category)
      .slice(0, 10)
      .map(item => ({
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        categoryName: item.category?.name,
        externalSystem: item.externalSystem,
        externalId: item.externalId,
        isActive: item.isActive,
        isAvailable: item.isAvailable
      }));

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          total,
          active,
          inactive,
          available,
          unavailable,
          withCategory,
          withoutCategory,
          withGroup,
          withoutGroup,
          fromPOS,
          manual,
          displayableInUI: displayableItems.length
        },
        discrepancy: {
          expectedTotal: 506,
          actualTotal: total,
          actualDisplayable: displayableItems.length,
          difference: total - displayableItems.length
        },
        problematicItems
      }
    });
  } catch (error) {
    console.error('Sales items analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze sales items' },
      { status: 500 }
    );
  }
}