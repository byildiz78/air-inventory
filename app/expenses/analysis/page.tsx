'use client';

import { useState, useEffect } from 'react';
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
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calculator,
  Download
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface ExpenseStats {
  summary: {
    totalExpenses: number;
    totalAmount: number;
    averageExpense: number;
  };
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    categoryType: 'FIXED' | 'VARIABLE';
    totalAmount: number;
    count: number;
  }>;
  byType: Record<string, { totalAmount: number; count: number }>;
  byPaymentStatus: Array<{
    status: string;
    totalAmount: number;
    count: number;
  }>;
  monthlyBreakdown?: Array<{
    month: string;
    totalAmount: number;
    count: number;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    categoryName: string;
    categoryType: 'FIXED' | 'VARIABLE';
    supplierName: string | null;
    paymentStatus: string;
  }>;
}

export default function ExpenseAnalysisPage() {
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'Ocak' },
    { value: '2', label: 'Şubat' },
    { value: '3', label: 'Mart' },
    { value: '4', label: 'Nisan' },
    { value: '5', label: 'Mayıs' },
    { value: '6', label: 'Haziran' },
    { value: '7', label: 'Temmuz' },
    { value: '8', label: 'Ağustos' },
    { value: '9', label: 'Eylül' },
    { value: '10', label: 'Ekim' },
    { value: '11', label: 'Kasım' },
    { value: '12', label: 'Aralık' }
  ];

  useEffect(() => {
    loadStats();
  }, [selectedYear, selectedMonth]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ year: selectedYear });
      if (selectedMonth) {
        params.append('month', selectedMonth);
      }

      const response = await apiClient.get(`/api/expenses/stats?${params.toString()}`);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading expense statistics:', error);
      toast.error('İstatistikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Ödendi';
      case 'PENDING': return 'Beklemede';
      case 'CANCELLED': return 'İptal';
      case 'FAILED': return 'Başarısız';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPeriodText = () => {
    if (selectedMonth) {
      const monthName = months.find(m => m.value === selectedMonth)?.label;
      return `${monthName} ${selectedYear}`;
    }
    return selectedYear;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Analiz yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Veri bulunamadı
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Masraf Analizi</h1>
            <p className="text-muted-foreground">
              {getPeriodText()} dönemi masraf analizi ve raporları
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedMonth || 'all'} onValueChange={(value) => setSelectedMonth(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tüm Aylar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Aylar</SelectItem>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Rapor İndir
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Masraf</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{stats.summary.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.totalExpenses} kayıt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Masraf</CardTitle>
              <Calculator className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{stats.summary.averageExpense.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Kayıt başına
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kayıt</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.totalExpenses}</div>
              <p className="text-xs text-muted-foreground">
                Masraf kaydı
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Type Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Gider Tipi Analizi
              </CardTitle>
              <CardDescription>
                Sabit ve değişken gider dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.byType).map(([type, data]) => {
                  const percentage = stats.summary.totalAmount > 0 
                    ? ((data.totalAmount / stats.summary.totalAmount) * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {type === 'FIXED' ? (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          )}
                          <span className="font-medium">
                            {type === 'FIXED' ? 'Sabit Giderler' : 'Değişken Giderler'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₺{data.totalAmount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">%{percentage}</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            type === 'FIXED' ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {data.count} kayıt
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* By Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Ödeme Durumu Analizi
              </CardTitle>
              <CardDescription>
                Ödeme durumlarına göre dağılım
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.byPaymentStatus.map((item) => {
                  const percentage = stats.summary.totalAmount > 0 
                    ? ((item.totalAmount / stats.summary.totalAmount) * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <div key={item.status} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                        <div className="text-right">
                          <div className="font-medium">₺{item.totalAmount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">%{percentage}</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.status === 'COMPLETED' ? 'bg-green-500' :
                            item.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.count} kayıt
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Kategori Bazlı Analiz</CardTitle>
            <CardDescription>
              En yüksek harcama yapılan kategoriler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byCategory
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .slice(0, 10)
                .map((category, index) => {
                  const percentage = stats.summary.totalAmount > 0 
                    ? ((category.totalAmount / stats.summary.totalAmount) * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <div key={category.categoryId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm w-6 text-center">
                            #{index + 1}
                          </span>
                          <span className="font-medium">{category.categoryName}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              category.categoryType === 'FIXED' 
                                ? 'border-red-200 text-red-700' 
                                : 'border-green-200 text-green-700'
                            }`}
                          >
                            {category.categoryType === 'FIXED' ? 'Sabit' : 'Değişken'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₺{category.totalAmount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            %{percentage} • {category.count} kayıt
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            category.categoryType === 'FIXED' ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Breakdown (if yearly view) */}
        {!selectedMonth && stats.monthlyBreakdown && stats.monthlyBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Aylık Dağılım</CardTitle>
              <CardDescription>
                {selectedYear} yılı aylık masraf dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stats.monthlyBreakdown.map((month) => {
                  const monthName = months.find(m => m.value === month.month)?.label || month.month;
                  
                  return (
                    <Card key={month.month} className="border">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="font-medium text-sm text-muted-foreground mb-2">
                            {monthName}
                          </div>
                          <div className="text-xl font-bold">
                            ₺{month.totalAmount.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {month.count} kayıt
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Son Masraflar</CardTitle>
            <CardDescription>
              En son eklenen masraf kayıtları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{expense.description}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          expense.categoryType === 'FIXED' 
                            ? 'border-red-200 text-red-700' 
                            : 'border-green-200 text-green-700'
                        }`}
                      >
                        {expense.categoryName}
                      </Badge>
                      <Badge className={getStatusColor(expense.paymentStatus)}>
                        {getStatusText(expense.paymentStatus)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString('tr-TR')}
                      {expense.supplierName && ` • ${expense.supplierName}`}
                    </div>
                  </div>
                  <div className="font-medium">
                    ₺{expense.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}