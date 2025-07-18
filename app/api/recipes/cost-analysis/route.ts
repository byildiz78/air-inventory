import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/recipes/cost-analysis:
 *   get:
 *     summary: Get recipe cost analysis with profitability insights
 *     description: Retrieve detailed cost analysis for recipes that have active sales item mappings, including profitability calculations, filtering, and pagination
 *     tags:
 *       - Recipes
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for recipe name or description
 *         example: "domates"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by recipe category
 *         example: "Çorbalar"
 *       - in: query
 *         name: profitability
 *         schema:
 *           type: string
 *           enum: [excellent, good, fair, poor, loss]
 *         description: Filter by profitability level
 *         example: "excellent"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, profitMargin, profitAmount, costPerServing]
 *         description: Field to sort by
 *         example: "profitMargin"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *         example: "desc"
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
 *         example: 12
 *     responses:
 *       200:
 *         description: Successfully retrieved recipe cost analysis
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "clx1234567890"
 *                       name:
 *                         type: string
 *                         example: "Domates Çorbası"
 *                       description:
 *                         type: string
 *                         example: "Geleneksel domates çorbası"
 *                       category:
 *                         type: string
 *                         example: "Çorbalar"
 *                       servingSize:
 *                         type: integer
 *                         example: 4
 *                       preparationTime:
 *                         type: integer
 *                         example: 30
 *                       salesItem:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "clx1234567890"
 *                           name:
 *                             type: string
 *                             example: "Domates Çorbası"
 *                           basePrice:
 *                             type: number
 *                             format: float
 *                             example: 15.00
 *                       totalCost:
 *                         type: number
 *                         format: float
 *                         example: 25.50
 *                       costPerServing:
 *                         type: number
 *                         format: float
 *                         example: 6.38
 *                       profitMargin:
 *                         type: number
 *                         format: float
 *                         example: 57.5
 *                       profitAmount:
 *                         type: number
 *                         format: float
 *                         example: 8.62
 *                       recommendedPrice:
 *                         type: number
 *                         format: float
 *                         example: 8.93
 *                       premiumPrice:
 *                         type: number
 *                         format: float
 *                         example: 10.21
 *                       profitabilityStatus:
 *                         type: string
 *                         enum: [excellent, good, fair, poor]
 *                         example: "excellent"
 *                       portionRatio:
 *                         type: number
 *                         format: float
 *                         example: 1.0
 *                       mappingPriority:
 *                         type: integer
 *                         example: 1
 *                       ingredientCosts:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             materialId:
 *                               type: string
 *                               example: "clx1234567890"
 *                             materialName:
 *                               type: string
 *                               example: "Domates"
 *                             quantity:
 *                               type: number
 *                               format: float
 *                               example: 2.5
 *                             unitCost:
 *                               type: number
 *                               format: float
 *                               example: 4.50
 *                             totalCost:
 *                               type: number
 *                               format: float
 *                               example: 11.25
 *                             unit:
 *                               type: string
 *                               example: "Kilogram"
 *                             unitAbbreviation:
 *                               type: string
 *                               example: "kg"
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *                 filters:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Çorbalar", "Ana Yemek", "Salata"]
 *                     profitabilityOptions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                             example: "excellent"
 *                           label:
 *                             type: string
 *                             example: "Mükemmel (40%+)"
 *                           count:
 *                             type: integer
 *                             example: 12
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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