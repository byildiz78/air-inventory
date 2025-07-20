'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calculator,
  FileText
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface ExpenseStats {
  totalBatches: number;
  totalAmount: number;
  averageBatchAmount: number;
  monthlyStats: {
    month: number;
    year: number;
    totalAmount: number;
    batchCount: number;
  }[];
}

interface CategoryStats {
  mainCategoryId: string;
  mainCategoryName: string;
  mainCategoryColor: string;
  totalAmount: number;
  batchCount: number;
  itemCount: number;
  subCategories: {
    subCategoryId: string;
    subCategoryName: string;
    totalAmount: number;
    itemCount: number;
  }[];
}

export default function ExpenseAnalysisPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ExpenseStats>({
    totalBatches: 0,
    totalAmount: 0,
    averageBatchAmount: 0,
    monthlyStats: []
  });
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    loadStats();
    loadCategoryStats();
  }, [selectedYear, selectedMonth]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        year: selectedYear.toString()
      });
      
      if (selectedMonth) {
        params.append('month', selectedMonth.toString());
      }

      const response = await apiClient.get(`/api/expenses/stats?${params.toString()}`);
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('İstatistikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStats = async () => {
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString()
      });
      
      if (selectedMonth) {
        params.append('month', selectedMonth.toString());
      }

      const response = await apiClient.get(`/api/expenses/analysis/categories?${params.toString()}`);
      
      if (response.success) {
        setCategoryStats(response.data);
      }
    } catch (error) {
      console.error('Error loading category stats:', error);
      // Don't show error toast for this, as it's optional data
    }
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return monthNames[month - 1];
  };

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const getPreviousMonthComparison = () => {
    if (!selectedMonth || stats.monthlyStats.length < 2) return null;

    const currentMonthStats = stats.monthlyStats.find(s => s.month === selectedMonth);
    const previousMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const previousMonthStats = stats.monthlyStats.find(s => s.month === previousMonth);

    if (!currentMonthStats || !previousMonthStats) return null;

    const change = currentMonthStats.totalAmount - previousMonthStats.totalAmount;
    const changePercent = previousMonthStats.totalAmount > 0 
      ? (change / previousMonthStats.totalAmount) * 100 
      : 0;

    return { change, changePercent };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Analiz verileri yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  const comparison = getPreviousMonthComparison();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Masraf Analizi</h1>
            <p className="text-muted-foreground">Detaylı masraf analizi ve istatistikleri</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Analiz Dönemi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Yıl</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = currentDate.getFullYear() - 2 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Ay</label>
                <Select
                  value={selectedMonth?.toString() || 'all'}
                  onValueChange={(value) => setSelectedMonth(value === 'all' ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Yıl</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      return (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Fiş Sayısı</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBatches}</div>
              <p className="text-xs text-muted-foreground">
                {selectedMonth ? getMonthName(selectedMonth) : 'Yıllık'} fiş sayısı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Masraf</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalAmount)}
              </div>
              {comparison && (
                <p className={`text-xs flex items-center gap-1 ${comparison.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {comparison.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(comparison.changePercent).toFixed(1)}% önceki aya göre
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Fiş Tutarı</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.averageBatchAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Fiş başına ortalama
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Günlük Ortalama</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {selectedMonth 
                  ? formatCurrency(stats.totalAmount / new Date(selectedYear, selectedMonth, 0).getDate())
                  : formatCurrency(stats.totalAmount / 365)
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Günlük ortalama masraf
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Analysis */}
        {categoryStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Kategori Bazlı Analiz
              </CardTitle>
              <CardDescription>
                Ana kategorilere göre masraf dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats
                  .sort((a, b) => b.totalAmount - a.totalAmount)
                  .map((category) => {
                    const percentage = stats.totalAmount > 0 ? (category.totalAmount / stats.totalAmount) * 100 : 0;
                    return (
                      <div key={category.mainCategoryId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: category.mainCategoryColor }}
                            />
                            <div>
                              <h4 className="font-medium">{category.mainCategoryName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {category.batchCount} fiş, {category.itemCount} kalem
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(category.totalAmount)}</div>
                            <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              backgroundColor: category.mainCategoryColor,
                              width: `${percentage}%`
                            }}
                          />
                        </div>

                        {/* Sub categories */}
                        {category.subCategories.length > 0 && (
                          <div className="ml-7 space-y-1">
                            {category.subCategories
                              .sort((a, b) => b.totalAmount - a.totalAmount)
                              .slice(0, 3) // Show top 3 sub categories
                              .map((subCat) => {
                                const subPercentage = category.totalAmount > 0 ? (subCat.totalAmount / category.totalAmount) * 100 : 0;
                                return (
                                  <div key={subCat.subCategoryId} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      → {subCat.subCategoryName} ({subCat.itemCount} kalem)
                                    </span>
                                    <span className="font-medium">
                                      {formatCurrency(subCat.totalAmount)} ({subPercentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Trend */}
        {!selectedMonth && stats.monthlyStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Aylık Trend ({selectedYear})
              </CardTitle>
              <CardDescription>
                Aylık masraf değişimi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stats.monthlyStats.map((monthStat) => {
                  const previousMonth = stats.monthlyStats.find(s => s.month === (monthStat.month === 1 ? 12 : monthStat.month - 1));
                  const change = previousMonth ? monthStat.totalAmount - previousMonth.totalAmount : 0;
                  const changePercent = previousMonth && previousMonth.totalAmount > 0 
                    ? (change / previousMonth.totalAmount) * 100 
                    : 0;

                  return (
                    <div 
                      key={monthStat.month}
                      className="p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{getMonthName(monthStat.month)}</h4>
                        <Badge variant="outline">{monthStat.batchCount} fiş</Badge>
                      </div>
                      <div className="text-lg font-bold text-red-600 mb-1">
                        {formatCurrency(monthStat.totalAmount)}
                      </div>
                      {previousMonth && (
                        <div className={`text-xs flex items-center gap-1 ${change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(changePercent).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}