'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eye, Edit, Copy, Clock, Users, TrendingUp } from 'lucide-react';
import { RecipeWithRelations } from '../types';

interface RecipeListViewProps {
  recipes: RecipeWithRelations[];
  onViewDetails: (recipe: RecipeWithRelations) => void;
  onEdit: (recipe: RecipeWithRelations) => void;
  onCopy: (recipe: RecipeWithRelations) => void;
  getProfitabilityBadge: (profitMargin?: number | null) => {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    text: string;
    color: string;
  };
}

export function RecipeListView({
  recipes,
  onViewDetails,
  onEdit,
  onCopy,
  getProfitabilityBadge
}: RecipeListViewProps) {
  return (
    <div className="space-y-3">
      {recipes.map((recipe) => {
        const profitabilityBadge = getProfitabilityBadge(recipe.profitMargin);
        
        return (
          <Card key={recipe.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg truncate">
                      {recipe.name}
                    </h3>
                    {recipe.description && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {recipe.category && (
                      <Badge variant="outline" className="shrink-0">
                        {recipe.category}
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.preparationTime || 0}dk</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{recipe.servingSize || 1} porsiyon</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4">
                    {recipe.totalCost !== undefined && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Maliyet: </span>
                        <span className="font-medium">
                          ₺{recipe.totalCost.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {recipe.suggestedPrice !== undefined && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Önerilen Fiyat: </span>
                        <span className="font-medium text-green-600">
                          ₺{recipe.suggestedPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <Badge variant={profitabilityBadge.variant}>
                        {profitabilityBadge.text}
                        {recipe.profitMargin && (
                          <span className="ml-1">
                            %{recipe.profitMargin.toFixed(0)}
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(recipe)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(recipe)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopy(recipe)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      
      {recipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Filtre kriterlerine uygun reçete bulunamadı.</p>
        </div>
      )}
    </div>
  );
}