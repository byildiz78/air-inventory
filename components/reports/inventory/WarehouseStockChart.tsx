import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { WarehouseStockSummary } from '@/types/inventory-reports';

interface WarehouseStockChartProps {
  warehouses: WarehouseStockSummary[];
  loading?: boolean;
}

export function WarehouseStockChart({ warehouses, loading = false }: WarehouseStockChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-blue-600" />
            Depo Bazlı Stok Değeri
          </CardTitle>
          <CardDescription>
            Depolara göre stok değeri dağılımı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center">
            <span className="text-gray-500">Grafik yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = warehouses.map(warehouse => ({
    name: warehouse.warehouseName,
    value: warehouse.totalValue,
    utilization: warehouse.utilizationPercentage || 0,
    materials: warehouse.materialCount
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-blue-600" />
          Depo Bazlı Stok Değeri
        </CardTitle>
        <CardDescription>
          Depolara göre stok değeri dağılımı ve doluluk oranları
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'Stok Değeri') {
                    return [`₺${value.toLocaleString()}`, name];
                  }
                  return [`%${value.toFixed(1)}`, name];
                }}
                labelFormatter={(label) => `Depo: ${label}`}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="value" 
                name="Stok Değeri" 
                fill="#3B82F6" 
              />
              <Bar 
                yAxisId="right"
                dataKey="utilization" 
                name="Doluluk Oranı (%)" 
                fill="#F59E0B" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Warehouse Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((warehouse) => (
            <div key={warehouse.warehouseId} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{warehouse.warehouseName}</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {warehouse.warehouseType}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stok Değeri:</span>
                  <span className="font-medium">₺{warehouse.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Malzeme Sayısı:</span>
                  <span>{warehouse.materialCount}</span>
                </div>
                {warehouse.utilizationPercentage !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Doluluk:</span>
                    <span className={
                      warehouse.utilizationPercentage > 80 ? 'text-red-600' :
                      warehouse.utilizationPercentage > 60 ? 'text-orange-600' :
                      'text-green-600'
                    }>
                      %{warehouse.utilizationPercentage.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}