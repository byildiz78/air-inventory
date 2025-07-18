'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, AlertCircle, PieChart } from 'lucide-react';

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: number;
  accountsReceivable: number;
  accountsPayable: number;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

interface FinancialAnalysisProps {
  timeRange?: 'month' | 'quarter' | 'year';
}

export function FinancialAnalysis({ timeRange = 'month' }: FinancialAnalysisProps) {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, [timeRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/financial/analysis?timeRange=${timeRange}`);
      const data = await response.json();

      if (data.success) {
        setFinancialData(data.data);
      } else {
        setError(data.error || 'Finansal veriler yüklenemedi');
      }
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Finansal veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTimeRangeText = () => {
    switch (timeRange) {
      case 'month': return 'Bu Ay';
      case 'quarter': return 'Bu Çeyrek';
      case 'year': return 'Bu Yıl';
      default: return 'Bu Ay';
    }
  };

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getProfitIcon = (profit: number) => {
    return profit >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Finansal Analiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Finansal Analiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!financialData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Finansal Analiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Finansal veri bulunmuyor</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialData.totalRevenue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Gider</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(financialData.totalExpenses)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Kar</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${getProfitColor(financialData.netProfit)}`}>
                    {formatCurrency(financialData.netProfit)}
                  </p>
                  {getProfitIcon(financialData.netProfit)}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kar Marjı</p>
                <p className={`text-2xl font-bold ${getProfitColor(financialData.profitMargin)}`}>
                  {formatPercentage(financialData.profitMargin)}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow and Account Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nakit Akışı</p>
                <p className={`text-xl font-bold ${getProfitColor(financialData.cashFlow)}`}>
                  {formatCurrency(financialData.cashFlow)}
                </p>
              </div>
              <CreditCard className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alacaklar</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(financialData.accountsReceivable)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Borçlar</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(financialData.accountsPayable)}
                </p>
              </div>
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Expense Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">En Büyük Gider Kategorileri</CardTitle>
          <CardDescription>{getTimeRangeText()} döneminde en çok harcama yapılan kategoriler</CardDescription>
        </CardHeader>
        <CardContent>
          {financialData.topExpenseCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Gider kategorisi bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {financialData.topExpenseCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-red-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{category.category}</p>
                      <p className="text-sm text-gray-600">
                        Toplam giderin {formatPercentage(category.percentage)}'si
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(category.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aylık Trend</CardTitle>
          <CardDescription>Son 6 ayın finansal performansı</CardDescription>
        </CardHeader>
        <CardContent>
          {financialData.monthlyTrend.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aylık trend verisi bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {financialData.monthlyTrend.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{month.month}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-green-600">
                        Gelir: {formatCurrency(month.revenue)}
                      </span>
                      <span className="text-sm text-red-600">
                        Gider: {formatCurrency(month.expenses)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getProfitColor(month.profit)}`}>
                      {formatCurrency(month.profit)}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {getProfitIcon(month.profit)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}