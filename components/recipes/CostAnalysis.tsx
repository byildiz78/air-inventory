'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
interface CostAnalysisProps {
  recipe: any;
  ingredients: any[];
  materials: any[];
}

export function CostAnalysis({ recipe, ingredients, materials }: CostAnalysisProps) {
  const [analysis, setAnalysis] = useState({
    totalCost: 0,
    costPerServing: 0,
    ingredientCosts: [] as Array<{
      name: string;
      cost: number;
      percentage: number;
      material: any;
    }>,
    profitAnalysis: {
      currentMargin: 0,
      recommendedPrice: 0,
      competitivePrice: 0,
    }
  });

  useEffect(() => {
    calculateAnalysis();
  }, [recipe, ingredients, materials]);

  const calculateAnalysis = () => {
    let totalCost = 0;
    const ingredientCosts: any[] = [];

    ingredients.forEach(ingredient => {
      const material = materials.find(m => m.id === ingredient.materialId);
      if (material) {
        const cost = material.averageCost * ingredient.quantity;
        totalCost += cost;
        ingredientCosts.push({
          name: material.name,
          cost,
          percentage: 0, // Will be calculated after totalCost is known
          material
        });
      }
    });

    // Calculate percentages
    ingredientCosts.forEach(item => {
      item.percentage = totalCost > 0 ? (item.cost / totalCost) * 100 : 0;
    });

    // Sort by cost (highest first)
    ingredientCosts.sort((a, b) => b.cost - a.cost);

    const costPerServing = totalCost / recipe.servingSize;
    const currentMargin = recipe.suggestedPrice 
      ? ((recipe.suggestedPrice - costPerServing) / recipe.suggestedPrice) * 100 
      : 0;

    setAnalysis({
      totalCost,
      costPerServing,
      ingredientCosts,
      profitAnalysis: {
        currentMargin,
        recommendedPrice: costPerServing * 1.4, // %40 kâr marjı
        competitivePrice: costPerServing * 1.6, // %60 kâr marjı
      }
    });
  };

  const getMarginStatus = (margin: number) => {
    if (margin >= 40) return { status: 'excellent', color: 'text-green-600', icon: CheckCircle };
    if (margin >= 25) return { status: 'good', color: 'text-blue-600', icon: TrendingUp };
    if (margin >= 15) return { status: 'fair', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'poor', color: 'text-red-600', icon: TrendingDown };
  };

  const marginStatus = getMarginStatus(analysis.profitAnalysis.currentMargin);
  const MarginIcon = marginStatus.icon;

  return (
    <div className="space-y-6">
      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Maliyet</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{analysis.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {recipe.servingSize} porsiyon için
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Porsiyon Maliyeti</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{analysis.costPerServing.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Birim maliyet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kâr Marjı</CardTitle>
            <MarginIcon className={`h-4 w-4 ${marginStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${marginStatus.color}`}>
              %{analysis.profitAnalysis.currentMargin.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mevcut marj
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ingredient Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Malzeme Maliyet Dağılımı
          </CardTitle>
          <CardDescription>
            En yüksek maliyetli malzemeler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.ingredientCosts.slice(0, 8).map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                      %{item.percentage.toFixed(1)}
                    </Badge>
                  </div>
                  <span className="font-bold">₺{item.cost.toFixed(2)}</span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Fiyat Önerileri
          </CardTitle>
          <CardDescription>
            Farklı kâr marjları için önerilen satış fiyatları
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Önerilen Fiyat</h4>
                  <Badge variant="secondary">%40 Kâr</Badge>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ₺{analysis.profitAnalysis.recommendedPrice.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Kâr: ₺{(analysis.profitAnalysis.recommendedPrice - analysis.costPerServing).toFixed(2)}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Premium Fiyat</h4>
                  <Badge variant="default">%60 Kâr</Badge>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  ₺{analysis.profitAnalysis.competitivePrice.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Kâr: ₺{(analysis.profitAnalysis.competitivePrice - analysis.costPerServing).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Current vs Recommended */}
            {recipe.suggestedPrice && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Mevcut Fiyat Analizi</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Mevcut Fiyat</p>
                    <p className="font-bold">₺{recipe.suggestedPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mevcut Kâr</p>
                    <p className="font-bold">₺{(recipe.suggestedPrice - analysis.costPerServing).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mevcut Marj</p>
                    <p className={`font-bold ${marginStatus.color}`}>
                      %{analysis.profitAnalysis.currentMargin.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Optimizasyon Önerileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.ingredientCosts.slice(0, 3).map((item, index) => (
              <div key={index} className="p-3 border-l-4 border-orange-500 bg-orange-50">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Toplam maliyetin %{item.percentage.toFixed(1)}'ini oluşturuyor. 
                  Alternatif tedarikçi araştırması yapılabilir.
                </p>
              </div>
            ))}
            
            {analysis.profitAnalysis.currentMargin < 25 && (
              <div className="p-3 border-l-4 border-red-500 bg-red-50">
                <p className="font-medium">Düşük Kâr Marjı Uyarısı</p>
                <p className="text-sm text-muted-foreground">
                  Mevcut kâr marjı %{analysis.profitAnalysis.currentMargin.toFixed(1)} ile düşük. 
                  Fiyat artışı veya maliyet optimizasyonu önerilir.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}