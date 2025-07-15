import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, DollarSign, TrendingUp, Package } from 'lucide-react';
import { RecipeWithRelations } from '../types';

interface RecipeStatsProps {
  recipes: RecipeWithRelations[];
  categories: string[];
}

export function RecipeStats({ recipes, categories }: RecipeStatsProps) {
  const calculateAverageCost = () => {
    if (recipes.length === 0) return '0.00';
    const totalCost = recipes.reduce((sum, r) => sum + r.costPerServing, 0);
    return (totalCost / recipes.length).toFixed(2);
  };

  const highProfitCount = recipes.filter(r => (r.profitMargin || 0) >= 40).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Reçete</CardTitle>
          <ChefHat className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recipes.length}</div>
          <p className="text-xs text-muted-foreground">Aktif reçete sayısı</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ortalama Maliyet</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₺{calculateAverageCost()}
          </div>
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
            {highProfitCount}
          </div>
          <p className="text-xs text-muted-foreground">%40+ kâr marjı</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kategoriler</CardTitle>
          <Package className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{categories.length}</div>
          <p className="text-xs text-muted-foreground">Reçete kategorisi</p>
        </CardContent>
      </Card>
    </div>
  );
}
