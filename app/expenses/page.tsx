'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Plus, 
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  ArrowRight
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

export default function ExpensesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ExpenseStats>({
    totalBatches: 0,
    totalAmount: 0,
    averageBatchAmount: 0,
    monthlyStats: []
  });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    loadStats();
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
      console.error('Error loading expense stats:', error);
      toast.error('İstatistikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
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

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Masraf Yönetimi</h1>
            <p className="text-muted-foreground">Masraf fişleri ve analizleri</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/expenses/new')}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tekil Masraf Fişi
            </Button>
            <Button
              onClick={() => router.push('/expenses/batch/new')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <FileText className="w-4 h-4 mr-2" />
              Çoklu Masraf Fişi
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dönem Seçimi
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Masraf Fişi</CardTitle>
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
              <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedMonth ? getMonthName(selectedMonth) : 'Yıllık'} toplam masraf
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Fiş Tutarı</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.averageBatchAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Fiş başına ortalama tutar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => router.push('/expenses/batch')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" />
                  Masraf Fişleri
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Tüm masraf girişleri (toplu ve tekil) ve fiş yönetimi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Toplam {stats.totalBatches} fiş
                </div>
                <Button variant="outline" size="sm">
                  Görüntüle
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => router.push('/expenses/hierarchy')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Masraf Hiyerarşisi
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Kategori ve masraf kalemlerini yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Kategori ve kalem yönetimi
                </div>
                <Button variant="outline" size="sm">
                  Yönet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Breakdown */}
        {!selectedMonth && stats.monthlyStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Aylık Dağılım ({selectedYear})
              </CardTitle>
              <CardDescription>
                Ay bazında masraf analizi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stats.monthlyStats.map((monthStat) => (
                  <div 
                    key={monthStat.month}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedMonth(monthStat.month)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{getMonthName(monthStat.month)}</h4>
                      <Badge variant="outline">{monthStat.batchCount} fiş</Badge>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(monthStat.totalAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ortalama: {formatCurrency(monthStat.batchCount > 0 ? monthStat.totalAmount / monthStat.batchCount : 0)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create New Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Yeni Masraf Girişi</CardTitle>
            <CardDescription>
              Masraf türüne göre uygun giriş yöntemini seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => router.push('/expenses/batch/new')}
                className="h-auto p-6 flex-col items-start bg-orange-500 hover:bg-orange-600"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5" />
                  <span className="font-semibold">Çoklu Masraf Fişi</span>
                </div>
                <div className="text-sm text-left opacity-90">
                  Çoklu masraf girişi için Excel benzeri interface
                </div>
              </Button>

              <Button
                onClick={() => router.push('/expenses/new')}
                variant="outline"
                className="h-auto p-6 flex-col items-start"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Tekil Masraf</span>
                </div>
                <div className="text-sm text-left text-muted-foreground">
                  Tek kalemli masraf fişi oluştur
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}