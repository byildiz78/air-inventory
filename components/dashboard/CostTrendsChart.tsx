import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { CostTrend } from '@/types/dashboard';

interface CostTrendsChartProps {
  data: CostTrend[];
  loading?: boolean;
  title?: string;
  description?: string;
}

export function CostTrendsChart({ 
  data, 
  loading = false,
  title = "Satış ve Maliyet Trendi",
  description = "Son 7 günün satış ve maliyet trendi"
}: CostTrendsChartProps) {
  
  // Chart renkleri
  const CHART_COLORS = {
    sales: 'hsl(var(--chart-1))',
    costs: 'hsl(var(--chart-2))',
    profit: 'hsl(var(--chart-3))'
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center">
            <span className="text-gray-500">Grafik yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`₺${value.toLocaleString()}`, undefined]}
                labelFormatter={(label) => `Tarih: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalSales" 
                name="Satış" 
                stroke={CHART_COLORS.sales} 
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="totalCost" 
                name="Maliyet" 
                stroke={CHART_COLORS.costs} 
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                name="Kâr" 
                stroke={CHART_COLORS.profit} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}