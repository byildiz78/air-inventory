import { Card, CardContent } from '@/components/ui/card';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Material, Unit } from '@prisma/client';
import { RecipeWithRelations } from '../types';

interface RecipeDetailProps {
  recipe: RecipeWithRelations;
  getMaterialById: (id: string) => Material | undefined;
  getUnitById: (id: string) => Unit | undefined;
}

export function RecipeDetail({ recipe, getMaterialById, getUnitById }: RecipeDetailProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
        <DialogDescription>
          {recipe.category} • {recipe.servingSize} porsiyon • {recipe.preparationTime} dakika
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Recipe Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">₺{recipe.costPerServing.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Porsiyon Maliyeti</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₺{recipe.suggestedPrice?.toFixed(2) || '0.00'}</div>
                <div className="text-sm text-muted-foreground">Önerilen Fiyat</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">%{recipe.profitMargin?.toFixed(1) || '0.0'}</div>
                <div className="text-sm text-muted-foreground">Kâr Marjı</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {recipe.description && (
          <div>
            <h3 className="font-semibold mb-2">Açıklama</h3>
            <p className="text-muted-foreground">{recipe.description}</p>
          </div>
        )}

        {/* Ingredients */}
        <div>
          <h3 className="font-semibold mb-4">Malzemeler</h3>
          <div className="space-y-2">
            {(recipe.ingredients || []).map((ingredient) => {
              const material = ingredient.material || getMaterialById(ingredient.materialId);
              const unit = ingredient.unit || getUnitById(ingredient.unitId);
              const ingredientCost = (material?.averageCost || 0) * ingredient.quantity;
              
              return (
                <div key={ingredient.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{material?.name}</p>
                    {ingredient.notes && (
                      <p className="text-sm text-muted-foreground">{ingredient.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{ingredient.quantity} {unit?.abbreviation}</p>
                    <p className="text-sm text-muted-foreground">₺{ingredientCost.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
