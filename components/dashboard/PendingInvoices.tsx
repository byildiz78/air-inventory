'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface PendingInvoice {
  id: string;
  invoiceNumber: string;
  type: 'PURCHASE' | 'SALE';
  supplierName: string;
  totalAmount: number;
  date: string;
  status: string;
  daysOverdue?: number;
}

interface PendingInvoicesProps {
  maxItems?: number;
  showViewAllButton?: boolean;
}

export function PendingInvoices({ maxItems = 5, showViewAllButton = true }: PendingInvoicesProps) {
  const [invoices, setInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingInvoices();
  }, []);

  const fetchPendingInvoices = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/api/invoices?status=PENDING&sortBy=date&sortOrder=desc&page=1&limit=50');

      if (data.success && Array.isArray(data.data)) {
        // Calculate days overdue and sort by urgency
        const processedInvoices = data.data.map((invoice: any) => {
          const dueDate = new Date(invoice.dueDate);
          const today = new Date();
          const daysOverdue = invoice.dueDate ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          
          return {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            type: invoice.type,
            supplierName: invoice.supplierName || invoice.currentAccountName || 'Belirtilmemiş',
            totalAmount: invoice.totalAmount,
            date: invoice.date,
            status: invoice.status,
            daysOverdue: daysOverdue > 0 ? daysOverdue : undefined
          };
        }).sort((a: any, b: any) => {
          // Sort by overdue first, then by total amount
          if (a.daysOverdue && !b.daysOverdue) return -1;
          if (!a.daysOverdue && b.daysOverdue) return 1;
          if (a.daysOverdue && b.daysOverdue) return b.daysOverdue - a.daysOverdue;
          return b.totalAmount - a.totalAmount;
        });

        setInvoices(processedInvoices.slice(0, maxItems));
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error('Error fetching pending invoices:', err);
      setError('Bekleyen faturalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'PURCHASE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bekleyen Faturalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
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
            <FileText className="h-5 w-5" />
            Bekleyen Faturalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-500" />
          Bekleyen Faturalar
        </CardTitle>
        <CardDescription>
          {invoices.length > 0 ? `${invoices.length} bekleyen fatura` : 'Bekleyen fatura yok'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Bekleyen fatura bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link 
                      href={`/invoices/${invoice.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <Badge className={getTypeColor(invoice.type)}>
                      {invoice.type === 'PURCHASE' ? 'Alış' : 'Satış'}
                    </Badge>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                    {invoice.daysOverdue && (
                      <Badge className="bg-red-100 text-red-800">
                        <Clock className="h-3 w-3 mr-1" />
                        {invoice.daysOverdue} gün gecikmiş
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {invoice.supplierName} • {formatDate(invoice.date)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-lg">
                    {formatCurrency(invoice.totalAmount)}
                  </div>
                </div>
              </div>
            ))}
            
            {showViewAllButton && (
              <div className="pt-4 border-t">
                <Link href="/invoices">
                  <Button variant="outline" className="w-full">
                    Tüm Faturaları Görüntüle
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}