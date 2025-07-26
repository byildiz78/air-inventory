import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Total sales items
    const totalCount = await prisma.salesItem.count();
    
    // Active sales items
    const activeCount = await prisma.salesItem.count({
      where: { isActive: true }
    });
    
    // Inactive sales items
    const inactiveCount = await prisma.salesItem.count({
      where: { isActive: false }
    });
    
    // From POS system
    const posCount = await prisma.salesItem.count({
      where: { externalSystem: 'POS' }
    });
    
    // Manual entries
    const manualCount = await prisma.salesItem.count({
      where: { 
        OR: [
          { externalSystem: null },
          { externalSystem: { not: 'POS' } }
        ]
      }
    });

    // Items with invalid/missing category (shouldn't exist due to schema constraints)
    const withoutCategoryCount = 0; // categoryId is required in schema
    
    // Items without group (this is allowed)
    const withoutGroupCount = await prisma.salesItem.count({
      where: { groupId: null }
    });

    // Categories and groups count
    const categoriesCount = await prisma.salesItemCategory.count();
    const groupsCount = await prisma.salesItemGroup.count();

    // Missing groups
    const allGroups = await prisma.salesItemGroup.findMany({
      select: { name: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        salesItems: {
          total: totalCount,
          active: activeCount,
          inactive: inactiveCount,
          fromPOS: posCount,
          manual: manualCount,
          withoutCategory: withoutCategoryCount,
          withoutGroup: withoutGroupCount
        },
        categories: {
          total: categoriesCount
        },
        groups: {
          total: groupsCount,
          names: allGroups.map(g => g.name)
        },
        summary: {
          expectedFromPOS: 506,
          actualInDB: totalCount,
          difference: 506 - totalCount,
          visibleInUI: activeCount
        }
      }
    });
  } catch (error) {
    console.error('Debug count error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get counts' },
      { status: 500 }
    );
  }
}