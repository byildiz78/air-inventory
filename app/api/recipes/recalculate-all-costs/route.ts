import { NextRequest, NextResponse } from 'next/server';
import { RecipeCostUpdater } from '@/lib/services/recipe-cost-updater';

export async function POST(request: NextRequest) {
  try {
    const result = await RecipeCostUpdater.updateAllRecipeCosts();

    return NextResponse.json({
      success: true,
      message: 'Tüm reçete maliyetleri güncellendi',
      data: {
        updatedRecipes: result.updatedRecipes,
        updatedIngredients: result.updatedIngredients
      }
    });
  } catch (error) {
    console.error('Recipe costs recalculation error:', error);
    return NextResponse.json(
      { error: 'Reçete maliyetleri güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}