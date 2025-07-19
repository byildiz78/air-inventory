'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, AlertCircle, PieChart } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

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
      const data = await apiClient.get(`/api/financial/analysis?timeRange=${timeRange}`);

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
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Toplam Gelir</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(financialData.totalRevenue)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Toplam Gider</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(financialData.totalExpenses)}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Net Kar</p>
                <div className="flex items-center gap-2">
                  <p className={`text-3xl font-bold ${getProfitColor(financialData.netProfit)}`}>
                    {formatCurrency(financialData.netProfit)}
                  </p>
                  {getProfitIcon(financialData.netProfit)}
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Kar Marjı</p>
                <p className={`text-3xl font-bold ${getProfitColor(financialData.profitMargin)}`}>
                  {formatPercentage(financialData.profitMargin)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <PieChart className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow and Account Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-white border-t-4 border-t-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Nakit Akışı</p>
                <p className={`text-2xl font-bold ${getProfitColor(financialData.cashFlow)}`}>
                  {formatCurrency(financialData.cashFlow)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <CreditCard className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-orange-50 to-white border-t-4 border-t-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Alacaklar</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(financialData.accountsReceivable)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp className="h-7 w-7 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-red-50 to-white border-t-4 border-t-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Borçlar</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(financialData.accountsPayable)}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingDown className="h-7 w-7 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Expense Categories */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-gradient-to-r from-gray-50 to-white">
        <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <PieChart className="h-6 w-6" />
            En Büyük Gider Kategorileri
          </CardTitle>
          <CardDescription className="text-red-100">
            {getTimeRangeText()} döneminde en çok harcama yapılan kategoriler
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {financialData.topExpenseCategories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="bg-gray-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <PieChart className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-lg">Gider kategorisi bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-4">
              {financialData.topExpenseCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-red-50 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-red-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-lg font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">{category.category}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        Toplam giderin {formatPercentage(category.percentage)}'si
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl text-red-600">{formatCurrency(category.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-gradient-to-r from-gray-50 to-white">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Aylık Trend
          </CardTitle>
          <CardDescription className="text-blue-100">
            Son 6 ayın finansal performansı
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {financialData.monthlyTrend.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="bg-gray-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-lg">Aylık trend verisi bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-4">
              {financialData.monthlyTrend.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-blue-50 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-blue-100">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg mb-2">{month.month}</p>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600">
                          Gelir: {formatCurrency(month.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-600">
                          Gider: {formatCurrency(month.expenses)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-2xl ${getProfitColor(month.profit)}`}>
                      {formatCurrency(month.profit)}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {getProfitIcon(month.profit)}
                      <span className={`text-sm font-medium ${getProfitColor(month.profit)}`}>
                        {month.profit >= 0 ? 'Kâr' : 'Zarar'}
                      </span>
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