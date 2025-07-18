'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';

interface RecipeSelectionCardProps {
  recipe: any;
  onSelect: (recipe: any) => void;
}

export function RecipeSelectionCard({ recipe, onSelect }: RecipeSelectionCardProps) {
  const getProfitabilityBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return { variant: 'default' as const, text: 'Mükemmel', color: 'text-green-600' };
      case 'good':
        return { variant: 'secondary' as const, text: 'İyi', color: 'text-blue-600' };
      case 'fair':
        return { variant: 'outline' as const, text: 'Orta', color: 'text-yellow-600' };
      case 'poor':
        return { variant: 'destructive' as const, text: 'Düşük', color: 'text-red-600' };
      default:
        return { variant: 'outline' as const, text: 'Bilinmiyor', color: 'text-gray-500' };
    }
  };

  const profitBadge = getProfitabilityBadge(recipe.profitabilityStatus);

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={() => onSelect(recipe)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{recipe.name}</CardTitle>
            <CardDescription className="mt-1">
              {recipe.category}
            </CardDescription>
          </div>
          <Badge variant={profitBadge.variant}>
            {profitBadge.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {recipe.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Satış Malı:</span>
            <span className="font-medium text-blue-600">{recipe.salesItem.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Satış Fiyatı:</span>
            <span className="font-medium text-green-600">
              ₺{recipe.salesItem.basePrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Porsiyon Maliyeti:</span>
            <span className="font-medium">₺{recipe.costPerServing.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Kâr Marjı:</span>
            <span className={`font-medium ${profitBadge.color}`}>
              %{recipe.profitMargin.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Kar Tutarı:</span>
            <span className={`font-medium ${recipe.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₺{recipe.profitAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <Button className="w-full bg-orange-500 hover:bg-orange-600">
          <Calculator className="w-4 h-4 mr-2" />
          Analiz Et
        </Button>
      </CardContent>
    </Card>
  );
}