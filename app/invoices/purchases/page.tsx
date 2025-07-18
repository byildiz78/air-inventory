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
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Package,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';
import Link from 'next/link';

// Invoice type definition
type Invoice = {
  id: string;
  invoiceNumber: string;
  type: 'PURCHASE' | 'SALE' | 'RETURN';
  supplierName: string;
  date: Date;
  dueDate?: Date | null;
  subtotalAmount: number;
  totalDiscountAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  itemCount: number;
  userName?: string;
};

interface ApiResponse {
  success: boolean;
  data: Invoice[];
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  error?: string;
}

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch invoices from API
  useEffect(() => {
    fetchInvoices();
  }, [searchTerm, statusFilter, sortBy, sortOrder, currentPage, pageSize]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('type', 'PURCHASE');
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await fetch(`/api/invoices?${params}`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        // Convert date strings to Date objects
        const formattedInvoices = data.data.map((invoice: any) => ({
          ...invoice,
          date: new Date(invoice.date),
          dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null
        }));
        setInvoices(formattedInvoices);
        
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.totalCount);
        }
      } else {
        console.error('Error fetching purchase invoices:', data.error);
      }
    } catch (error) {
      console.error('Error fetching purchase invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': 
        return { 
          variant: 'secondary' as const, 
          text: 'Beklemede', 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock
        };
      case 'APPROVED': 
        return { 
          variant: 'default' as const, 
          text: 'Onaylandı', 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: CheckCircle
        };
      case 'PAID': 
        return { 
          variant: 'default' as const, 
          text: 'Ödendi', 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle
        };
      case 'CANCELLED': 
        return { 
          variant: 'destructive' as const, 
          text: 'İptal', 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle
        };
      default: 
        return { 
          variant: 'outline' as const, 
          text: status, 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock
        };
    }
  };

  const getSortingOptions = () => [
    { value: 'date', label: 'Tarih' },
    { value: 'invoiceNumber', label: 'Fatura No' },
    { value: 'supplierName', label: 'Tedarikçi' },
    { value: 'totalAmount', label: 'Tutar' },
    { value: 'status', label: 'Durum' }
  ];

  // Calculate stats
  const stats = {
    totalInvoices: totalCount,
    pendingInvoices: invoices.filter(inv => inv.status === 'PENDING').length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    avgAmount: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length : 0,
  };

  const getDaysUntilDue = (dueDate: Date | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Alış faturaları yükleniyor...</p>
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
          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Fatura</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">Alış faturası sayısı</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Faturalar</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground">Onay bekliyor</p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₺{stats.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Tüm alış faturaları</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Tutar</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">₺{stats.avgAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Fatura başına</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtreler
                </CardTitle>
                <CardDescription>
                  Faturalarınızı filtreleyerek görüntüleyin
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Temizle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sıralama" />
                </SelectTrigger>
                <SelectContent>
                  {getSortingOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {sortOrder === 'asc' ? 'Artan' : 'Azalan'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalCount} fatura bulundu
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sayfa başı:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enhanced Invoice Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alış Faturası Listesi</CardTitle>
            <CardDescription>
              Sayfa {currentPage} / {totalPages} - {totalCount} fatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.length === 0 ? (
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
                <>
                  {/* Table Header */}
                  <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg font-medium text-sm text-gray-600">
                    <div className="col-span-3">Fatura Bilgileri</div>
                    <div className="col-span-2">Tedarikçi</div>
                    <div className="col-span-2">Tarih/Vade</div>
                    <div className="col-span-2">Tutar</div>
                    <div className="col-span-2">Durum</div>
                    <div className="col-span-1">İşlemler</div>
                  </div>

                  {/* Table Rows */}
                  {invoices.map((invoice) => {
                    const statusBadge = getStatusBadge(invoice.status);
                    const StatusIcon = statusBadge.icon;
                    const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                    
                    return (
                      <div key={invoice.id} className="border rounded-lg hover:shadow-md transition-all duration-200">
                        {/* Mobile View */}
                        <div className="md:hidden p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                                <p className="text-sm text-muted-foreground">{invoice.supplierName}</p>
                              </div>
                            </div>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusBadge.text}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {invoice.date.toLocaleDateString('tr-TR')}
                              </div>
                              {invoice.dueDate && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  Vade: {invoice.dueDate.toLocaleDateString('tr-TR')}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">₺{invoice.totalAmount.toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">
                                {invoice.itemCount} kalem
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Link href={`/invoices/detail?id=${invoice.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                <Eye className="w-4 h-4 mr-2" />
                                Görüntüle
                              </Button>
                            </Link>
                            <Link href={`/invoices/edit?id=${invoice.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                <Edit className="w-4 h-4 mr-2" />
                                Düzenle
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center">
                          <div className="col-span-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Package className="w-3 h-3" />
                                  {invoice.itemCount} kalem
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{invoice.supplierName}</span>
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="w-3 h-3" />
                                {invoice.date.toLocaleDateString('tr-TR')}
                              </div>
                              {invoice.dueDate && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Clock className="w-3 h-3" />
                                  <span className={daysUntilDue !== null && daysUntilDue < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                                    {invoice.dueDate.toLocaleDateString('tr-TR')}
                                    {daysUntilDue !== null && daysUntilDue < 0 && ' (Gecikmiş)'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="col-span-2">
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
                          </div>
                          
                          <div className="col-span-2">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusBadge.text}
                            </div>
                          </div>
                          
                          <div className="col-span-1">
                            <div className="flex gap-1">
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
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Sayfa {currentPage} / {totalPages} - Toplam {totalCount} fatura
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Önceki
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Sonraki
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}