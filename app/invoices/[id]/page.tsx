'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Edit,
  Download,
  Trash2,
  ArrowLeft,
  Building2,
  Calendar,
  Package,
  Receipt,
  Warehouse,
  Scale,
  DollarSign,
  Percent,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

// Mock invoice detail data
const mockInvoiceDetail = {
  id: '1',
  invoiceNumber: 'ALF-2024-001',
  type: 'PURCHASE' as const,
  supplierName: 'Anadolu Et Pazarı',
  supplierInfo: {
    contactName: 'Mehmet Yılmaz',
    phone: '+90 212 555 0101',
    email: 'info@anadoluet.com',
    taxNumber: '1234567890'
  },
  date: new Date('2024-01-15'),
  dueDate: new Date('2024-02-15'),
  subtotalAmount: 1500,
  totalDiscountAmount: 75,
  totalTaxAmount: 285,
  totalAmount: 1710,
  status: 'APPROVED' as const,
  notes: 'Aylık et tedariki',
  items: [
    {
      id: '1',
      materialName: 'Dana Kuşbaşı',
      quantity: 10,
      unitName: 'kg',
      unitPrice: 180,
      discount1Rate: 5,
      discount2Rate: 0,
      totalDiscountAmount: 90,
      subtotalAmount: 1710,
      taxRate: 20,
      taxAmount: 342,
      totalAmount: 2052,
      warehouseName: 'Soğuk Hava Deposu'
    }
  ]
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState(mockInvoiceDetail);
  const [loading, setLoading] = useState(true);

  // Load real invoice data
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/invoices/${invoiceId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoice');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Convert date strings to Date objects
          const invoiceWithDates = {
            ...data.data,
            date: new Date(data.data.date),
            dueDate: data.data.dueDate ? new Date(data.data.dueDate) : null
          };
          setInvoice(invoiceWithDates);
        } else {
          console.error('Error fetching invoice:', data.error);
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return { variant: 'secondary' as const, text: 'Beklemede', icon: Clock, color: 'text-yellow-600' };
      case 'APPROVED': return { variant: 'default' as const, text: 'Onaylandı', icon: CheckCircle, color: 'text-blue-600' };
      case 'PAID': return { variant: 'default' as const, text: 'Ödendi', icon: CheckCircle, color: 'text-green-600' };
      case 'CANCELLED': return { variant: 'destructive' as const, text: 'İptal', icon: AlertTriangle, color: 'text-red-600' };
      default: return { variant: 'outline' as const, text: status, icon: Clock, color: 'text-gray-600' };
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

  const statusBadge = getStatusBadge(invoice.status);
  const typeBadge = getTypeBadge(invoice.type);
  const StatusIcon = statusBadge.icon;

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Fatura yükleniyor...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!invoiceId) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Fatura ID bulunamadı</h3>
            <p className="text-muted-foreground">Lütfen geçerli bir fatura ID'si ile tekrar deneyin.</p>
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
          <div className="flex items-center gap-4">
            <Link href="/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Fatura Listesi
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
                <Badge variant={typeBadge.variant}>
                  {typeBadge.text}
                </Badge>
                <Badge variant={statusBadge.variant}>
                  <StatusIcon className="w-4 h-4 mr-1" />
                  {statusBadge.text}
                </Badge>
              </div>
              <p className="text-muted-foreground">{invoice.supplierName}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/invoices/edit?id=${invoice.id}`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Düzenle
              </Button>
            </Link>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              PDF İndir
            </Button>
            <Button variant="outline">
              <Trash2 className="w-4 h-4 mr-2" />
              Sil
            </Button>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">₺{invoice.subtotalAmount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">KDV Hariç</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₺{invoice.totalDiscountAmount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Toplam İndirim</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₺{invoice.totalTaxAmount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Toplam KDV</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">₺{invoice.totalAmount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Genel Toplam</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Fatura Kalemleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoice.items.map((item, index) => (
                    <Card key={item.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{item.materialName}</h4>
                              <p className="text-sm text-muted-foreground">{item.warehouseName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">₺{item.totalAmount.toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Miktar:</span>
                            <div className="font-medium">{item.quantity} {item.unitName}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Birim Fiyat:</span>
                            <div className="font-medium">₺{item.unitPrice}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">İndirim:</span>
                            <div className="font-medium text-green-600">%{item.discount1Rate}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">KDV:</span>
                            <div className="font-medium">%{item.taxRate}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            
            {/* Supplier Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Tedarikçi Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium">{invoice.supplierName}</h4>
                  {invoice.supplierInfo?.contactName && (
                    <p className="text-sm text-muted-foreground">{invoice.supplierInfo.contactName}</p>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {invoice.supplierInfo?.phone && (
                    <div>Tel: {invoice.supplierInfo.phone}</div>
                  )}
                  {invoice.supplierInfo?.email && (
                    <div>E-posta: {invoice.supplierInfo.email}</div>
                  )}
                  {invoice.supplierInfo?.taxNumber && (
                    <div>Vergi No: {invoice.supplierInfo.taxNumber}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Fatura Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Fatura Tarihi:</span>
                  <div className="font-medium">
                    {invoice.date instanceof Date ? invoice.date.toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </div>
                </div>
                {invoice.dueDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">Vade Tarihi:</span>
                    <div className="font-medium">
                      {invoice.dueDate instanceof Date ? invoice.dueDate.toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                    </div>
                  </div>
                )}
                {invoice.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">Notlar:</span>
                    <div className="font-medium">{invoice.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}