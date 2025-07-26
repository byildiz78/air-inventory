import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, Eye, Edit, Copy, Trash2, Warehouse } from 'lucide-react';
import { Recipe } from '@prisma/client';
import { RecipeWithRelations } from '../types';

interface RecipeCardProps {
  recipe: RecipeWithRelations;
  onViewDetails: (recipe: RecipeWithRelations) => void;
  onEdit: (recipe: RecipeWithRelations) => void;
  onCopy: (recipe: RecipeWithRelations) => void;
  onDelete?: (recipe: RecipeWithRelations) => void;
  getProfitabilityBadge: (profitMargin?: number | null) => { 
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    text: string;
    color: string;
  };
}

export function RecipeCard({
  recipe,
  onViewDetails,
  onEdit,
  onCopy,
  onDelete,
  getProfitabilityBadge
}: RecipeCardProps) {
  const profitBadge = getProfitabilityBadge(recipe.profitMargin);

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{recipe.servingSize} porsiyon</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{recipe.preparationTime} dk</span>
          </div>
        </div>
        
        {recipe.warehouse && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              <Warehouse className="w-3 h-3 mr-1" />
              {recipe.warehouse.name}
              <span className="ml-1 text-xs opacity-75">({recipe.warehouse.type})</span>
            </Badge>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Porsiyon Maliyeti:</span>
            <span className="font-medium">₺{recipe.costPerServing.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Önerilen Fiyat:</span>
            <span className="font-medium text-green-600">₺{recipe.suggestedPrice?.toFixed(2) || 'Belirtilmemiş'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Kâr Marjı:</span>
            <span className={`font-medium ${profitBadge.color}`}>
              %{recipe.profitMargin?.toFixed(1) || '0.0'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewDetails(recipe)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Detay
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(recipe)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onCopy(recipe)}
          >
            <Copy className="w-4 h-4" />
          </Button>
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDelete(recipe)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
