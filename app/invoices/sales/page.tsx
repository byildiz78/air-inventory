'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

// Mock sales and return invoice data
const mockSalesInvoices = [
  {
    id: '3',
    invoiceNumber: 'SAT-2024-001',
    type: 'SALE' as const,
    supplierName: 'Perakende Satış',
    date: new Date('2024-01-16'),
    subtotalAmount: 2400,
    totalDiscountAmount: 120,
    totalTaxAmount: 456,
    totalAmount: 2736,
    status: 'PAID' as const,
    itemCount: 8
  },
  {
    id: '4',
    invoiceNumber: 'SAT-2024-002',
    type: 'SALE' as const,
    supplierName: 'Kurumsal Müşteri',
    date: new Date('2024-01-17'),
    subtotalAmount: 1800,
    totalDiscountAmount: 90,
    totalTaxAmount: 342,
    totalAmount: 2052,
    status: 'APPROVED' as const,
    itemCount: 5
  }
];

const mockReturnInvoices = [
  {
    id: '5',
    invoiceNumber: 'IAD-2024-001',
    type: 'RETURN' as const,
    supplierName: 'Müşteri İadesi',
    date: new Date('2024-01-18'),
    subtotalAmount: -500,
    totalDiscountAmount: 0,
    totalTaxAmount: -95,
    totalAmount: -595,
    status: 'APPROVED' as const,
    itemCount: 2
  }
];

export default function SalesInvoicesPage() {
  const [salesInvoices, setSalesInvoices] = useState(mockSalesInvoices);
  const [returnInvoices, setReturnInvoices] = useState(mockReturnInvoices);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter functions
  const filterInvoices = (invoices: any[]) => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const filteredSalesInvoices = filterInvoices(salesInvoices);
  const filteredReturnInvoices = filterInvoices(returnInvoices);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return { variant: 'secondary' as const, text: 'Beklemede', color: 'text-yellow-600' };
      case 'APPROVED': return { variant: 'default' as const, text: 'Onaylandı', color: 'text-blue-600' };
      case 'PAID': return { variant: 'default' as const, text: 'Ödendi', color: 'text-green-600' };
      case 'CANCELLED': return { variant: 'destructive' as const, text: 'İptal', color: 'text-red-600' };
      default: return { variant: 'outline' as const, text: status, color: 'text-gray-600' };
    }
  };

  // Calculate stats
  const salesStats = {
    totalInvoices: filteredSalesInvoices.length,
    pendingInvoices: filteredSalesInvoices.filter(inv => inv.status === 'PENDING').length,
    totalAmount: filteredSalesInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    avgAmount: filteredSalesInvoices.length > 0 ? filteredSalesInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / filteredSalesInvoices.length : 0,
  };

  const returnStats = {
    totalInvoices: filteredReturnInvoices.length,
    totalAmount: Math.abs(filteredReturnInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)),
  };

  const renderInvoiceList = (invoices: any[], type: 'SALE' | 'RETURN') => {
    const typeConfig = {
      SALE: { 
        color: 'text-green-600', 
        bgColor: 'bg-green-100', 
        iconColor: 'text-green-600',
        badge: 'Satış',
        badgeColor: 'text-green-600'
      },
      RETURN: { 
        color: 'text-red-600', 
        bgColor: 'bg-red-100', 
        iconColor: 'text-red-600',
        badge: 'İade',
        badgeColor: 'text-red-600'
      }
    };

    const config = typeConfig[type];

    return (
      <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {type === 'SALE' ? 'Satış faturası' : 'İade faturası'} bulunamadı
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Arama kriterinize uygun fatura bulunamadı.' 
                : `Henüz ${type === 'SALE' ? 'satış' : 'iade'} faturası eklenmemiş.`}
            </p>
            <Link href={`/invoices/new?type=${type.toLowerCase()}`}>
              <Button className={type === 'SALE' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                <Plus className="w-4 h-4 mr-2" />
                {type === 'SALE' ? 'İlk Satış Faturasını Oluştur' : 'İlk İade Faturasını Oluştur'}
              </Button>
            </Link>
          </div>
        ) : (
          invoices.map((invoice) => {
            const statusBadge = getStatusBadge(invoice.status);
            
            return (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                    {type === 'SALE' ? (
                      <FileText className={`w-6 h-6 ${config.iconColor}`} />
                    ) : (
                      <RotateCcw className={`w-6 h-6 ${config.iconColor}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                      <Badge variant="outline" className={config.badgeColor}>
                        {config.badge}
                      </Badge>
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.text}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invoice.supplierName} • {invoice.itemCount} kalem
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {invoice.date.toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`font-bold text-lg ${type === 'RETURN' ? 'text-red-600' : ''}`}>
                      ₺{Math.abs(invoice.totalAmount).toLocaleString()}
                      {type === 'RETURN' && ' (İade)'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      KDV Hariç: ₺{Math.abs(invoice.subtotalAmount).toLocaleString()}
                    </div>
                    {invoice.totalDiscountAmount > 0 && (
                      <div className="text-xs text-green-600">
                        İndirim: ₺{invoice.totalDiscountAmount.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/invoices/detail?id=${invoice.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/invoices/edit?id=${invoice.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-600">Satış Faturaları</h1>
            <p className="text-muted-foreground">Müşterilere kesilen faturalar ve iadeler</p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/invoices/new?type=sale">
              <Button className="bg-green-500 hover:bg-green-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Satış Faturası
              </Button>
            </Link>
            <Link href="/invoices/new?type=return">
              <Button className="bg-red-500 hover:bg-red-600">
                <Plus className="w-4 h-4 mr-2" />
                İade Faturası
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satış Faturaları</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">Toplam satış</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">İade Faturaları</CardTitle>
              <RotateCcw className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{returnStats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">Toplam iade</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satış Tutarı</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{salesStats.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Toplam satış</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">İade Tutarı</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₺{returnStats.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Toplam iade</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Fatura ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="PENDING">Beklemede</SelectItem>
                  <SelectItem value="APPROVED">Onaylandı</SelectItem>
                  <SelectItem value="PAID">Ödendi</SelectItem>
                  <SelectItem value="CANCELLED">İptal</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Excel'e Aktar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Tabs */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales" className="text-green-600">
              Satış Faturaları ({filteredSalesInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="returns" className="text-red-600">
              İade Faturaları ({filteredReturnInvoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Satış Faturası Listesi</CardTitle>
                <CardDescription>
                  {filteredSalesInvoices.length} satış faturası gösteriliyor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderInvoiceList(filteredSalesInvoices, 'SALE')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="returns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">İade Faturası Listesi</CardTitle>
                <CardDescription>
                  {filteredReturnInvoices.length} iade faturası gösteriliyor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderInvoiceList(filteredReturnInvoices, 'RETURN')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}