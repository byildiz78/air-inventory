'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, DollarSign, TrendingUp, Package } from 'lucide-react';

interface RecipeStatsProps {
  recipes: any[];
}

export function RecipeStatsCards({ recipes }: RecipeStatsProps) {
  const totalRecipes = recipes.length;
  const averageCost = totalRecipes > 0 
    ? recipes.reduce((sum, r) => sum + r.costPerServing, 0) / totalRecipes 
    : 0;
  const highProfitRecipes = recipes.filter(r => r.profitMargin >= 40).length;
  const totalIngredients = recipes.reduce((sum, r) => sum + r.ingredientCosts.length, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Reçete</CardTitle>
          <ChefHat className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRecipes}</div>
          <p className="text-xs text-muted-foreground">Analiz edilebilir</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ortalama Maliyet</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₺{averageCost.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Porsiyon başı</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Yüksek Karlı</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {highProfitRecipes}
          </div>
          <p className="text-xs text-muted-foreground">%40+ kâr marjı</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Malzeme</CardTitle>
          <Package className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalIngredients}</div>
          <p className="text-xs text-muted-foreground">Kullanılan malzeme</p>
        </CardContent>
      </Card>
    </div>
  );
}