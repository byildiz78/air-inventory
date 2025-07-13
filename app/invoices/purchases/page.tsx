'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

// Mock purchase invoice data
const mockPurchaseInvoices = [
  {
    id: '1',
    invoiceNumber: 'ALF-2024-001',
    type: 'PURCHASE' as const,
    supplierName: 'Anadolu Et Pazarı',
    date: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    subtotalAmount: 1500,
    totalDiscountAmount: 75,
    totalTaxAmount: 285,
    totalAmount: 1710,
    status: 'APPROVED' as const,
    itemCount: 3
  },
  {
    id: '2',
    invoiceNumber: 'ALF-2024-002',
    type: 'PURCHASE' as const,
    supplierName: 'Taze Sebze Meyve',
    date: new Date('2024-01-16'),
    dueDate: new Date('2024-02-16'),
    subtotalAmount: 850,
    totalDiscountAmount: 42.5,
    totalTaxAmount: 8.075,
    totalAmount: 815.575,
    status: 'PENDING' as const,
    itemCount: 5
  }
];

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState(mockPurchaseInvoices);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
  const stats = {
    totalInvoices: filteredInvoices.length,
    pendingInvoices: filteredInvoices.filter(inv => inv.status === 'PENDING').length,
    totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    avgAmount: filteredInvoices.length > 0 ? filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / filteredInvoices.length : 0,
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Alış Faturaları</h1>
            <p className="text-muted-foreground">Tedarikçilerden alınan faturalar</p>
          </div>
          
          <Link href="/invoices/new?type=purchase">
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Alış Faturası
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Fatura</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">Alış faturası sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Faturalar</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground">Onay bekliyor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{stats.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Tüm alış faturaları</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Tutar</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{stats.avgAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Fatura başına</p>
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

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Alış Faturası Listesi</CardTitle>
            <CardDescription>
              {filteredInvoices.length} fatura gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Alış faturası bulunamadı</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Arama kriterinize uygun fatura bulunamadı.' 
                      : 'Henüz alış faturası eklenmemiş.'}
                  </p>
                  <Link href="/invoices/new?type=purchase">
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      <Plus className="w-4 h-4 mr-2" />
                      İlk Alış Faturasını Oluştur
                    </Button>
                  </Link>
                </div>
              ) : (
                filteredInvoices.map((invoice) => {
                  const statusBadge = getStatusBadge(invoice.status);
                  
                  return (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                            <Badge variant="outline" className="text-blue-600">
                              Alış
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
                            {invoice.dueDate && (
                              <span>Vade: {invoice.dueDate.toLocaleDateString('tr-TR')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">₺{invoice.totalAmount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            KDV Hariç: ₺{invoice.subtotalAmount.toLocaleString()}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}