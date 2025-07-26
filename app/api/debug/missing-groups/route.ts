import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all groups
    const allGroups = await prisma.salesItemGroup.findMany({
      include: {
        category: true
      }
    });

    // Get all categories
    const allCategories = await prisma.salesItemCategory.findMany();

    // Groups by name
    const groupsByName = allGroups.reduce((acc, group) => {
      if (!acc[group.name]) {
        acc[group.name] = [];
      }
      acc[group.name].push({
        id: group.id,
        categoryName: group.category.name,
        categoryId: group.categoryId,
        externalId: group.externalId,
        externalSystem: group.externalSystem
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Check specific groups
    const problematicGroups = ['İÇECEK', 'İND. MENÜ'];
    const analysis = problematicGroups.map(groupName => ({
      groupName,
      found: groupsByName[groupName] || [],
      possibleMatches: Object.keys(groupsByName).filter(name => 
        name.toLowerCase().includes(groupName.toLowerCase()) ||
        groupName.toLowerCase().includes(name.toLowerCase())
      )
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalGroups: allGroups.length,
        totalCategories: allCategories.length,
        problematicGroupsAnalysis: analysis,
        allGroupNames: Object.keys(groupsByName).sort(),
        allCategoryNames: allCategories.map(c => c.name).sort()
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze groups' },
      { status: 500 }
    );
  }
}