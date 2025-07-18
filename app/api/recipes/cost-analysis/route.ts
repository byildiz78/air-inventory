import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const profitability = searchParams.get('profitability') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    // Build where clause
    const whereClause: any = {
      mappings: {
        some: {
          isActive: true
        }
      }
    };
    
    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Add category filter
    if (category) {
      whereClause.category = category;
    }

    // Get recipes that have sales item mappings (only these can be analyzed for profitability)
    const recipes = await prisma.recipe.findMany({
      where: whereClause,
      include: {
        ingredients: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                averageCost: true,
                currentStock: true
              }
            },
            unit: {
              select: {
                name: true,
                abbreviation: true
              }
            }
          }
        },
        mappings: {
          where: {
            isActive: true
          },
          include: {
            salesItem: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    // Calculate cost analysis for each recipe
    const analyzedRecipes = recipes.map(recipe => {
      let totalCost = 0;
      const ingredientCosts = recipe.ingredients.map(ingredient => {
        const materialCost = ingredient.material.averageCost || 0;
        const cost = materialCost * ingredient.quantity;
        totalCost += cost;
        
        return {
          materialId: ingredient.material.id,
          materialName: ingredient.material.name,
          quantity: ingredient.quantity,
          unitCost: materialCost,
          totalCost: cost,
          unit: ingredient.unit.name,
          unitAbbreviation: ingredient.unit.abbreviation
        };
      });

      const costPerServing = totalCost / recipe.servingSize;
      
      // Get sales item mapping information
      const activeMapping = recipe.mappings.find(m => m.isActive);
      const salesItem = activeMapping?.salesItem;
      const salesPrice = salesItem?.basePrice || 0;
      
      // Calculate profit margin based on sales item price
      const profitMargin = salesPrice > 0 
        ? ((salesPrice - costPerServing) / salesPrice) * 100 
        : 0;

      // Calculate profit amount
      const profitAmount = salesPrice - costPerServing;

      return {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        category: recipe.category || 'Diğer',
        servingSize: recipe.servingSize,
        preparationTime: recipe.preparationTime,
        
        // Sales item information
        salesItem: {
          id: salesItem?.id || '',
          name: salesItem?.name || '',
          basePrice: salesPrice
        },
        
        // Cost information
        totalCost,
        costPerServing,
        profitMargin,
        profitAmount,
        
        // Ingredients
        ingredientCosts,
        
        // Price recommendations
        recommendedPrice: costPerServing * 1.4, // 40% profit margin
        premiumPrice: costPerServing * 1.6, // 60% profit margin
        
        // Profitability status
        profitabilityStatus: profitMargin >= 40 ? 'excellent' : 
                            profitMargin >= 25 ? 'good' :
                            profitMargin >= 15 ? 'fair' : 'poor',
        
        // Mapping information
        portionRatio: activeMapping?.portionRatio || 1.0,
        mappingPriority: activeMapping?.priority || 1
      };
    });

    // Apply profitability filter after calculation
    let filteredRecipes = analyzedRecipes;
    if (profitability) {
      filteredRecipes = analyzedRecipes.filter(recipe => {
        switch (profitability) {
          case 'excellent': return recipe.profitMargin >= 40;
          case 'good': return recipe.profitMargin >= 25 && recipe.profitMargin < 40;
          case 'fair': return recipe.profitMargin >= 15 && recipe.profitMargin < 25;
          case 'poor': return recipe.profitMargin < 15;
          case 'loss': return recipe.profitAmount < 0;
          default: return true;
        }
      });
    }

    // Apply sorting for calculated fields
    if (sortBy === 'profitMargin' || sortBy === 'profitAmount' || sortBy === 'costPerServing') {
      filteredRecipes.sort((a, b) => {
        const aValue = a[sortBy as keyof typeof a] as number;
        const bValue = b[sortBy as keyof typeof b] as number;
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    // Get total count for pagination
    const totalCount = filteredRecipes.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedRecipes = filteredRecipes.slice(startIndex, startIndex + limit);

    // Get categories for filter
    const categories = await prisma.recipe.findMany({
      where: {
        mappings: {
          some: {
            isActive: true
          }
        }
      },
      select: {
        category: true
      },
      distinct: ['category']
    });

    const uniqueCategories = categories
      .map(r => r.category)
      .filter(Boolean)
      .sort();

    return NextResponse.json({
      success: true,
      data: paginatedRecipes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        categories: uniqueCategories,
        profitabilityOptions: [
          { value: 'excellent', label: 'Mükemmel (40%+)', count: analyzedRecipes.filter(r => r.profitMargin >= 40).length },
          { value: 'good', label: 'İyi (25-39%)', count: analyzedRecipes.filter(r => r.profitMargin >= 25 && r.profitMargin < 40).length },
          { value: 'fair', label: 'Orta (15-24%)', count: analyzedRecipes.filter(r => r.profitMargin >= 15 && r.profitMargin < 25).length },
          { value: 'poor', label: 'Düşük (0-14%)', count: analyzedRecipes.filter(r => r.profitMargin >= 0 && r.profitMargin < 15).length },
          { value: 'loss', label: 'Zarar Ediyor', count: analyzedRecipes.filter(r => r.profitAmount < 0).length }
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching recipe cost analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Reçete maliyet analizi yüklenemedi' },
      { status: 500 }
    );
  }
}