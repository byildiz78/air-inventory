'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Warehouse, 
  FileText, 
  TrendingUp,
  BarChart3,
  Calculator
} from 'lucide-react';

interface StockSummaryProps {
  summary: {
    totalMaterials: number;
    totalWarehouses: number;
    totalRecords: number;
    reportType: string;
    period: { startDate: string; endDate: string };
  };
  reportType: 'quantity' | 'amount' | 'amount_with_vat';
}

export function StockSummary({ summary, reportType }: StockSummaryProps) {
  const formatDateRange = () => {
    const startDate = new Date(summary.period.startDate).toLocaleDateString('tr-TR');
    const endDate = new Date(summary.period.endDate).toLocaleDateString('tr-TR');
    return `${startDate} - ${endDate}`;
  };

  const getReportTypeText = () => {
    return reportType === 'quantity' ? 'Miktar Bazlı' : 
           reportType === 'amount' ? 'Tutar Bazlı' : 'Tutar Bazlı (KDV Dahil)';
  };

  const getReportTypeIcon = () => {
    return reportType === 'quantity' ? (
      <BarChart3 className="w-4 h-4 text-blue-600" />
    ) : (
      <Calculator className="w-4 h-4 text-green-600" />
    );
  };

  const summaryCards = [
    {
      title: 'Toplam Malzeme',
      value: summary.totalMaterials.toLocaleString('tr-TR'),
      description: 'Raporlanan farklı malzeme türü',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Toplam Depo',
      value: summary.totalWarehouses.toLocaleString('tr-TR'),
      description: 'Hareket kaydedilen depo sayısı',
      icon: Warehouse,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Toplam Kayıt',
      value: summary.totalRecords.toLocaleString('tr-TR'),
      description: 'Malzeme-depo kombinasyon sayısı',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Rapor Tipi',
      value: getReportTypeText(),
      description: formatDateRange(),
      icon: reportType === 'quantity' ? BarChart3 : Calculator,
      color: reportType === 'quantity' ? 'text-blue-600' : 'text-green-600',
      bgColor: reportType === 'quantity' ? 'bg-blue-50' : 'bg-green-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryCards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
          
          {/* Background decoration */}
          <div className={`absolute top-0 right-0 w-32 h-32 ${card.bgColor} opacity-10 rounded-full -mr-16 -mt-16`} />
        </Card>
      ))}
    </div>
  );
}