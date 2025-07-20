'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Calendar, 
  User, 
  Calculator,
  Package,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface ExpenseBatch {
  id: string;
  batchNumber: string;
  name: string;
  description: string | null;
  periodYear: number;
  periodMonth: number;
  status: string;
  totalAmount: number;
  entryDate: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: {
    id: string;
    description: string;
    amount: number;
    paymentStatus: string;
    paymentDate: string | null;
    invoiceNumber: string | null;
    notes: string | null;
    expenseItem: {
      id: string;
      name: string;
      code: string;
      subCategory: {
        id: string;
        name: string;
        code: string;
        mainCategory: {
          id: string;
          name: string;
          code: string;
          color: string;
        };
      };
    };
  }[];
}

export default function ExpenseBatchDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [batch, setBatch] = useState<ExpenseBatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatch();
  }, [params.id]);

  const loadBatch = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/expenses/batches/${params.id}`);
      
      if (response.success) {
        setBatch(response.data);
      } else {
        toast.error('Masraf fişi bulunamadı');
        router.push('/expenses/batch');
      }
    } catch (error: any) {
      console.error('Error loading batch:', error);
      toast.error('Masraf fişi yüklenirken hata oluştu');
      router.push('/expenses/batch');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Taslak', variant: 'secondary' as const, icon: Clock },
      SUBMITTED: { label: 'Gönderildi', variant: 'outline' as const, icon: Package },
      APPROVED: { label: 'Onaylandı', variant: 'default' as const, icon: CheckCircle },
      REJECTED: { label: 'Reddedildi', variant: 'destructive' as const, icon: XCircle },
      PROCESSED: { label: 'İşlendi', variant: 'default' as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'secondary' as const, 
      icon: Clock 
    };

    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center gap-2">
        <IconComponent className="w-4 h-4" />
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Beklemede', variant: 'outline' as const },
      COMPLETED: { label: 'Ödendi', variant: 'default' as const },
      CANCELLED: { label: 'İptal', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'secondary' as const 
    };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return monthNames[month - 1];
  };

  const groupItemsByCategory = () => {
    if (!batch) return {};

    const grouped: { [key: string]: any[] } = {};
    
    batch.items.forEach(item => {
      const mainCategoryId = item.expenseItem.subCategory.mainCategory.id;
      if (!grouped[mainCategoryId]) {
        grouped[mainCategoryId] = [];
      }
      grouped[mainCategoryId].push(item);
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Masraf fişi yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            Masraf fişi bulunamadı
          </div>
        </div>
      </div>
    );
  }

  const groupedItems = groupItemsByCategory();

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Masraf Fişi Detayı</h1>
              <p className="text-muted-foreground">Fiş No: {batch.batchNumber}</p>
            </div>
          </div>
          {batch.status === 'DRAFT' && (
            <Button
              onClick={() => router.push(`/expenses/batch/${batch.id}/edit`)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </Button>
          )}
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fiş Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Fiş Adı</Label>
                <div className="mt-1 text-lg font-semibold">{batch.name}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Dönem</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-lg font-semibold">
                    {getMonthName(batch.periodMonth)} {batch.periodYear}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Durum</Label>
                <div className="mt-1">
                  {getStatusBadge(batch.status)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Toplam Tutar</Label>
                <div className="mt-1 text-lg font-bold text-green-600">
                  ₺{batch.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Kalem Sayısı</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span className="text-lg font-semibold">{batch.items.length}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Oluşturan</Label>
                <div className="mt-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-lg font-semibold">{batch.user.name}</span>
                </div>
              </div>
            </div>

            {batch.description && (
              <div className="mt-6">
                <Label className="text-sm font-medium text-muted-foreground">Açıklama</Label>
                <div className="mt-1 p-3 bg-muted/50 rounded-md">
                  {batch.description}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
              <div>Oluşturulma: {new Date(batch.entryDate).toLocaleString('tr-TR')}</div>
              <div>Son Güncelleme: {new Date(batch.updatedAt).toLocaleString('tr-TR')}</div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Masraf Kalemleri
              <Badge variant="secondary">{batch.items.length}</Badge>
            </CardTitle>
            <CardDescription>
              Kategoriler halinde gruplandırılmış masraf kalemleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([mainCategoryId, items]) => {
                const mainCategory = items[0].expenseItem.subCategory.mainCategory;
                const categoryTotal = items.reduce((sum, item) => sum + item.amount, 0);
                
                return (
                  <div key={mainCategoryId} className="border rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <div className="bg-muted/30 p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: mainCategory.color }}
                          />
                          <h3 className="font-semibold">{mainCategory.name}</h3>
                          <Badge variant="outline">{items.length} kalem</Badge>
                        </div>
                        <div className="font-semibold text-green-600">
                          ₺{categoryTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Masraf Kalemi</TableHead>
                          <TableHead>Alt Kategori</TableHead>
                          <TableHead>Tutar</TableHead>
                          <TableHead>Ödeme Durumu</TableHead>
                          <TableHead>Ödeme Tarihi</TableHead>
                          <TableHead>Fatura No</TableHead>
                          <TableHead>Notlar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.description}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.expenseItem.code}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.expenseItem.subCategory.name}
                            </TableCell>
                            <TableCell className="font-medium">
                              ₺{item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              {getPaymentStatusBadge(item.paymentStatus)}
                            </TableCell>
                            <TableCell>
                              {item.paymentDate 
                                ? new Date(item.paymentDate).toLocaleDateString('tr-TR')
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              {item.invoiceNumber || '-'}
                            </TableCell>
                            <TableCell>
                              {item.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}