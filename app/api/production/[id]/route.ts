import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { AuthMiddleware } from '@/lib/auth-middleware';

/**
 * @swagger
 * /api/production/{id}:
 *   get:
 *     summary: Get a production record by ID
 *     description: Retrieve detailed information about a specific production record
 *     tags:
 *       - Production
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Production record ID
 *     responses:
 *       200:
 *         description: Production record retrieved successfully
 *       404:
 *         description: Production record not found
 *       500:
 *         description: Internal server error
 */

export const GET = AuthMiddleware.withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    console.log('Fetching production with ID:', params.id);
    
    // First try without includes to isolate the issue
    const production = await prisma.production.findUnique({
      where: { id: params.id }
    });

    if (!production) {
      console.log('Production not found for ID:', params.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Production record not found',
        },
        { status: 404 }
      );
    }

    // If basic fetch works, try to get related data separately
    let userData = null;
    let recipeData = null;
    let materialData = null;
    let warehouseData = null;

    try {
      if (production.userId) {
        userData = await prisma.user.findUnique({
          where: { id: production.userId },
          select: { id: true, name: true }
        });
      }
    } catch (e) {
      console.log('Error fetching user:', e);
    }

    try {
      if (production.recipeId) {
        recipeData = await prisma.recipe.findUnique({
          where: { id: production.recipeId },
          select: { id: true, name: true, description: true }
        });
      }
    } catch (e) {
      console.log('Error fetching recipe:', e);
    }

    try {
      if (production.materialId) {
        materialData = await prisma.material.findUnique({
          where: { id: production.materialId },
          select: { id: true, name: true }
        });
      }
    } catch (e) {
      console.log('Error fetching material:', e);
    }

    try {
      if (production.warehouseId) {
        warehouseData = await prisma.warehouse.findUnique({
          where: { id: production.warehouseId },
          select: { id: true, name: true }
        });
      }
    } catch (e) {
      console.log('Error fetching warehouse:', e);
    }

    // Combine the data
    const productionWithRelations = {
      ...production,
      user: userData,
      recipe: recipeData,
      material: materialData,
      warehouse: warehouseData
    };

    console.log('Found production:', production ? 'Yes' : 'No');

    return NextResponse.json({
      success: true,
      data: productionWithRelations,
    });
  } catch (error: any) {
    console.error('Error fetching production record:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch production record',
      },
      { status: 500 }
    );
  }
});

/**
 * @swagger
 * /api/production/{id}:
 *   put:
 *     summary: Update a production record
 *     description: Update production record details (limited fields for data integrity)
 *     tags:
 *       - Production
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Production record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Production date
 *               notes:
 *                 type: string
 *                 description: Production notes
 *               quantity:
 *                 type: number
 *                 description: Production quantity (portions)
 *     responses:
 *       200:
 *         description: Production record updated successfully
 *       404:
 *         description: Production record not found
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */

export const PUT = AuthMiddleware.withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const productionId = params.id;
    const body = await request.json();

    // Check if production exists
    const existingProduction = await prisma.production.findUnique({
      where: { id: productionId },
      include: {
        user: true,
        recipe: true,
        material: true,
        warehouse: true
      }
    });

    if (!existingProduction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Production record not found',
        },
        { status: 404 }
      );
    }

    // Validate input
    if (body.quantity && body.quantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quantity must be greater than 0',
        },
        { status: 400 }
      );
    }

    // For data integrity, we only allow updating limited fields
    // Stock movements are not automatically adjusted when quantity changes
    const updatedProduction = await prisma.production.update({
      where: { id: productionId },
      data: {
        date: body.date ? new Date(body.date) : existingProduction.date,
        notes: body.notes !== undefined ? body.notes : existingProduction.notes,
        quantity: body.quantity !== undefined ? body.quantity : existingProduction.quantity,
        // If quantity changes, we should update producedQuantity proportionally
        ...(body.quantity && body.quantity !== existingProduction.quantity && {
          producedQuantity: (existingProduction.producedQuantity / existingProduction.quantity) * body.quantity
        })
      },
      include: {
        user: true,
        recipe: true,
        material: true,
        warehouse: true
      }
    });

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logUpdate(
      userId,
      'production',
      productionId,
      {
        before: {
          date: existingProduction.date,
          quantity: existingProduction.quantity,
          notes: existingProduction.notes
        },
        after: {
          date: updatedProduction.date,
          quantity: updatedProduction.quantity,
          notes: updatedProduction.notes
        }
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedProduction,
      message: 'Production record updated successfully. Note: Stock movements are not automatically adjusted.',
    });
  } catch (error: any) {
    console.error('Error updating production record:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update production record',
      },
      { status: 500 }
    );
  }
});

/**
 * @swagger
 * /api/production/{id}:
 *   delete:
 *     summary: Delete a production record
 *     description: Delete production record (Note: This does not reverse stock movements)
 *     tags:
 *       - Production
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Production record ID
 *     responses:
 *       200:
 *         description: Production record deleted successfully
 *       404:
 *         description: Production record not found
 *       500:
 *         description: Internal server error
 */

export const DELETE = AuthMiddleware.withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const productionId = params.id;

    // Check if production exists
    const existingProduction = await prisma.production.findUnique({
      where: { id: productionId },
      include: {
        material: true,
        recipe: true
      }
    });

    if (!existingProduction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Production record not found',
        },
        { status: 404 }
      );
    }

    // Delete the production record
    await prisma.production.delete({
      where: { id: productionId }
    });

    // Log the activity
    const userId = request.headers.get('x-user-id') || '1';
    await ActivityLogger.logDelete(
      userId,
      'production',
      productionId,
      {
        recipeName: existingProduction.recipeName,
        materialName: existingProduction.materialName,
        quantity: existingProduction.quantity,
        producedQuantity: existingProduction.producedQuantity
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Production record deleted successfully. Note: Stock movements are not automatically reversed.',
    });
  } catch (error: any) {
    console.error('Error deleting production record:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete production record',
      },
      { status: 500 }
    );
  }
});