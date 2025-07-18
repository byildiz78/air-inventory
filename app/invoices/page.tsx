'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Settings,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';

// Invoice type definition
type Invoice = {
  id: string;
  invoiceNumber: string;
  type: 'PURCHASE' | 'SALE' | 'RETURN';
  supplierName: string; // Keep for backward compatibility
  currentAccountId?: string;
  currentAccountName?: string;
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/invoices?search=${searchTerm}&status=${statusFilter !== 'all' ? statusFilter : ''}&type=${typeFilter !== 'all' ? typeFilter : ''}`);
        const data = await response.json();
        
        if (data.success) {
          // Convert date strings to Date objects
          const formattedInvoices = data.data.map((invoice: any) => ({
            ...invoice,
            date: new Date(invoice.date),
            dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null
          }));
          setInvoices(formattedInvoices);
        } else {
          console.error('Error fetching invoices:', data.error);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [searchTerm, statusFilter, typeFilter]);

  // No need to filter invoices here as we're filtering on the API side
  const filteredInvoices = invoices;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return { variant: 'secondary' as const, text: 'Beklemede', color: 'text-yellow-600' };
      case 'APPROVED': return { variant: 'default' as const, text: 'Onaylandı', color: 'text-blue-600' };
      case 'PAID': return { variant: 'default' as const, text: 'Ödendi', color: 'text-green-600' };
      case 'CANCELLED': return { variant: 'destructive' as const, text: 'İptal', color: 'text-red-600' };
      default: return { variant: 'outline' as const, text: status, color: 'text-gray-600' };
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PURCHASE': return { variant: 'outline' as const, text: 'Alış', color: 'text-blue-600' };
      case 'SALE': return { variant: 'outline' as const, text: 'Satış', color: 'text-green-600' };
      case 'RETURN': return { variant: 'outline' as const, text: 'İade', color: 'text-red-600' };
      default: return { variant: 'outline' as const, text: type, color: 'text-gray-600' };
    }
  };

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      { value: 'PENDING', label: 'Beklemede', color: 'text-yellow-600' },
      { value: 'APPROVED', label: 'Onaylandı', color: 'text-blue-600' },
      { value: 'PAID', label: 'Ödendi', color: 'text-green-600' },
      { value: 'CANCELLED', label: 'İptal', color: 'text-red-600' }
    ];
    
    return allStatuses.filter(status => status.value !== currentStatus);
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          userId: '1' // Current user ID
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update the invoice in the list
          setInvoices(prev => prev.map(invoice => 
            invoice.id === invoiceId 
              ? { ...invoice, status: newStatus as Invoice['status'] }
              : invoice
          ));
          setIsStatusModalOpen(false);
          setSelectedInvoice(null);
        } else {
          alert(result.error || 'Durum güncellenirken hata oluştu');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Durum güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Durum güncellenirken hata oluştu');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Calculate stats
  const stats = {
    totalInvoices: filteredInvoices.length,
    pendingInvoices: filteredInvoices.filter((inv: Invoice) => inv.status === 'PENDING').length,
    totalAmount: filteredInvoices.reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0),
    purchaseAmount: filteredInvoices.filter((inv: Invoice) => inv.type === 'PURCHASE').reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0),
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fatura Yönetimi</h1>
            <p className="text-muted-foreground">Alış ve satış faturalarını yönetin</p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/invoices/new?type=purchase">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Alış Faturası
              </Button>
            </Link>
            <Link href="/invoices/new?type=sale">
              <Button className="bg-green-500 hover:bg-green-600">
                <Plus className="w-4 h-4 mr-2" />
                Satış Faturası
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
              <CardTitle className="text-sm font-medium">Toplam Fatura</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">Filtrelenmiş fatura sayısı</p>
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
              <p className="text-xs text-muted-foreground">Tüm faturalar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alış Tutarı</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{stats.purchaseAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Alış faturaları</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Fatura ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Fatura Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Faturalar</SelectItem>
                  <SelectItem value="PURCHASE">Alış Faturaları</SelectItem>
                  <SelectItem value="SALE">Satış Faturaları</SelectItem>
                </SelectContent>
              </Select>

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
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Fatura Listesi
            </CardTitle>
            <CardDescription>
              {filteredInvoices.length} fatura gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium mb-2">Faturalar yükleniyor...</h3>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Fatura bulunamadı</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                      ? 'Arama kriterinize uygun fatura bulunamadı.' 
                      : 'Henüz fatura eklenmemiş.'}
                  </p>
                  <Link href="/invoices/new">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="w-4 h-4 mr-2" />
                      İlk Faturayı Oluştur
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredInvoices.map((invoice: Invoice) => {
                    const statusBadge = getStatusBadge(invoice.status);
                    const typeBadge = getTypeBadge(invoice.type);
                    
                    return (
                      <Card key={invoice.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 ${typeBadge.color === 'text-blue-600' ? 'bg-blue-100' : typeBadge.color === 'text-green-600' ? 'bg-green-100' : 'bg-red-100'} rounded-xl flex items-center justify-center shadow-sm`}>
                                <FileText className={`w-8 h-8 ${typeBadge.color}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-bold text-lg text-gray-900">{invoice.invoiceNumber}</h4>
                                  <Badge variant={typeBadge.variant} className={`${typeBadge.color} font-medium`}>
                                    {typeBadge.text}
                                  </Badge>
                                  <Badge variant={statusBadge.variant} className={`${statusBadge.color} font-medium`}>
                                    {statusBadge.text}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 font-medium mb-2">
                                  {invoice.currentAccountName || invoice.supplierName}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {invoice.date.toLocaleDateString('tr-TR')}
                                  </span>
                                  {invoice.dueDate && (
                                    <span className="flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4" />
                                      Vade: {invoice.dueDate.toLocaleDateString('tr-TR')}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    {invoice.itemCount} kalem
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <div className="font-bold text-2xl text-gray-900 mb-1">₺{invoice.totalAmount.toLocaleString()}</div>
                                <div className="text-sm text-gray-500 mb-1">
                                  KDV Hariç: ₺{invoice.subtotalAmount.toLocaleString()}
                                </div>
                                {invoice.totalDiscountAmount > 0 && (
                                  <div className="text-sm text-green-600 font-medium">
                                    İndirim: ₺{invoice.totalDiscountAmount.toLocaleString()}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <Link href={`/invoices/${invoice.id}`}>
                                    <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300">
                                      <Eye className="w-4 h-4 mr-1" />
                                      Görüntüle
                                    </Button>
                                  </Link>
                                  <Link href={`/invoices/edit?id=${invoice.id}`}>
                                    <Button variant="outline" size="sm" className="hover:bg-orange-50 hover:border-orange-300">
                                      <Edit className="w-4 h-4 mr-1" />
                                      Düzenle
                                    </Button>
                                  </Link>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="hover:bg-purple-50 hover:border-purple-300"
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setIsStatusModalOpen(true);
                                    }}
                                  >
                                    <Settings className="w-4 h-4 mr-1" />
                                    Durum
                                  </Button>
                                  <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-300">
                                    <Download className="w-4 h-4 mr-1" />
                                    İndir
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Change Modal */}
        <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Fatura Durumunu Değiştir</DialogTitle>
              <DialogDescription>
                {selectedInvoice?.invoiceNumber} numaralı faturanın durumunu değiştirin.
              </DialogDescription>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Mevcut Durum:</span>
                    <Badge variant={getStatusBadge(selectedInvoice.status).variant} className={getStatusBadge(selectedInvoice.status).color}>
                      {getStatusBadge(selectedInvoice.status).text}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedInvoice.currentAccountName || selectedInvoice.supplierName} • ₺{selectedInvoice.totalAmount.toLocaleString()}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Yeni Durum Seçin:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {getStatusOptions(selectedInvoice.status).map((status) => (
                      <Button
                        key={status.value}
                        variant="outline"
                        className="justify-start h-auto p-4 hover:bg-gray-50"
                        onClick={() => handleStatusChange(selectedInvoice.id, status.value)}
                        disabled={updatingStatus}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            status.value === 'PENDING' ? 'bg-yellow-500' :
                            status.value === 'APPROVED' ? 'bg-blue-500' :
                            status.value === 'PAID' ? 'bg-green-500' :
                            'bg-red-500'
                          }`} />
                          <span className={`font-medium ${status.color}`}>{status.label}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsStatusModalOpen(false)}
                    disabled={updatingStatus}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}