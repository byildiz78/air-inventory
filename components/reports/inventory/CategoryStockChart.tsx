import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { CategoryStockSummary } from '@/types/inventory-reports';

interface CategoryStockChartProps {
  categories: CategoryStockSummary[];
  loading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function CategoryStockChart({ categories, loading = false }: CategoryStockChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-green-600" />
            Kategori Bazlı Stok Değeri
          </CardTitle>
          <CardDescription>
            Kategorilere göre stok değeri dağılımı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center">
              <span className="text-gray-500">Grafik yükleniyor...</span>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = categories.filter(cat => cat.totalValue > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-green-600" />
          Kategori Bazlı Stok Değeri
        </CardTitle>
        <CardDescription>
          Kategorilere göre stok değeri dağılımı
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalValue"
                  label={({ categoryName, percentage }: {categoryName: string, percentage: number}) => 
                    `${categoryName}: %${percentage.toFixed(0)}`
                  }
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.categoryColor || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`₺${value.toLocaleString()}`, 'Stok Değeri']} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            {chartData
              .sort((a, b) => b.totalValue - a.totalValue)
              .map((category, index) => (
                <div key={category.categoryId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.categoryColor || COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <span className="font-medium">{category.categoryName}</span>
                      <div className="text-xs text-muted-foreground">
                        {category.materialCount} malzeme
                        {category.lowStockCount > 0 && (
                          <span className="text-orange-600 ml-2">
                            • {category.lowStockCount} düşük stok
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">₺{category.totalValue.toLocaleString()}</span>
                    <div className="text-xs text-muted-foreground">
                      %{category.percentage.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}