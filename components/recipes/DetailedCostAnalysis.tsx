'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  DollarSign, 
  BarChart3, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  TrendingDown
} from 'lucide-react';

interface DetailedCostAnalysisProps {
  recipe: any;
}

export function DetailedCostAnalysis({ recipe }: DetailedCostAnalysisProps) {
  const getMarginIcon = (margin: number) => {
    if (margin >= 40) return { icon: CheckCircle, color: 'text-green-600' };
    if (margin >= 25) return { icon: TrendingUp, color: 'text-blue-600' };
    if (margin >= 15) return { icon: AlertTriangle, color: 'text-yellow-600' };
    return { icon: TrendingDown, color: 'text-red-600' };
  };

  const marginStatus = getMarginIcon(recipe.profitMargin);
  const MarginIcon = marginStatus.icon;

  // Calculate ingredient percentages
  const ingredientCostsWithPercentage = recipe.ingredientCosts.map((item: any) => ({
    ...item,
    percentage: recipe.totalCost > 0 ? (item.totalCost / recipe.totalCost) * 100 : 0
  }));

  return (
    <div className="space-y-6">
      {/* Sales Item Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">Satış Malı Bilgisi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-blue-600 mb-1">Satış Malı</p>
              <p className="text-xl font-bold text-blue-800">{recipe.salesItem.name}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600 mb-1">Satış Fiyatı</p>
              <p className="text-xl font-bold text-green-600">₺{recipe.salesItem.basePrice.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600 mb-1">Porsiyon Oranı</p>
              <p className="text-xl font-bold text-blue-800">{recipe.portionRatio}x</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Maliyet</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{recipe.totalCost.toFixed(2)}</div>
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
            <div className="text-2xl font-bold">₺{recipe.costPerServing.toFixed(2)}</div>
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
              %{recipe.profitMargin.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mevcut marj
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kar Tutarı</CardTitle>
            <TrendingUp className={`h-4 w-4 ${recipe.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${recipe.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₺{recipe.profitAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net kâr
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
            {ingredientCostsWithPercentage
              .sort((a: any, b: any) => b.totalCost - a.totalCost)
              .slice(0, 8)
              .map((item: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.materialName}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.quantity} {item.unitAbbreviation}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        %{item.percentage.toFixed(1)}
                      </Badge>
                    </div>
                    <span className="font-bold">₺{item.totalCost.toFixed(2)}</span>
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
                  ₺{recipe.recommendedPrice.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Kâr: ₺{(recipe.recommendedPrice - recipe.costPerServing).toFixed(2)}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Premium Fiyat</h4>
                  <Badge variant="default">%60 Kâr</Badge>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  ₺{recipe.premiumPrice.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Kâr: ₺{(recipe.premiumPrice - recipe.costPerServing).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Current vs Recommended */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Mevcut Fiyat Analizi</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Satış Fiyatı</p>
                  <p className="font-bold">₺{recipe.salesItem.basePrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net Kâr</p>
                  <p className={`font-bold ${recipe.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₺{recipe.profitAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kâr Marjı</p>
                  <p className={`font-bold ${marginStatus.color}`}>
                    %{recipe.profitMargin.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
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
            {ingredientCostsWithPercentage
              .sort((a: any, b: any) => b.percentage - a.percentage)
              .slice(0, 3)
              .map((item: any, index: number) => (
                <div key={index} className="p-3 border-l-4 border-orange-500 bg-orange-50">
                  <p className="font-medium">{item.materialName}</p>
                  <p className="text-sm text-muted-foreground">
                    Toplam maliyetin %{item.percentage.toFixed(1)}'ini oluşturuyor. 
                    Alternatif tedarikçi araştırması yapılabilir.
                  </p>
                </div>
              ))}
            
            {recipe.profitMargin < 25 && (
              <div className="p-3 border-l-4 border-red-500 bg-red-50">
                <p className="font-medium">Düşük Kâr Marjı Uyarısı</p>
                <p className="text-sm text-muted-foreground">
                  Mevcut kâr marjı %{recipe.profitMargin.toFixed(1)} ile düşük. 
                  Satış fiyatı artışı veya maliyet optimizasyonu önerilir.
                </p>
              </div>
            )}
            
            {recipe.profitAmount < 0 && (
              <div className="p-3 border-l-4 border-red-500 bg-red-50">
                <p className="font-medium">Zarar Uyarısı</p>
                <p className="text-sm text-muted-foreground">
                  Bu reçete ₺{Math.abs(recipe.profitAmount).toFixed(2)} zarar ediyor! 
                  Acil olarak satış fiyatını ₺{recipe.recommendedPrice.toFixed(2)}'ye çıkarın veya maliyetleri düşürün.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}