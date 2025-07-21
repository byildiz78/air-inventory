'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  Plus, 
  FileText, 
  Search, 
  Eye,
  Edit,
  Calendar,
  Calculator,
  Trash2
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { confirm } from '@/lib/confirm';

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
  user: {
    id: string;
    name: string;
  };
  items: {
    id: string;
    description: string;
    amount: number;
    expenseItem: {
      name: string;
      subCategory: {
        name: string;
        mainCategory: {
          name: string;
        };
      };
    };
  }[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function ExpenseBatchListPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<ExpenseBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Filters
  const currentDate = new Date();
  const [filters, setFilters] = useState({
    year: currentDate.getFullYear(),
    month: null as number | null,
    status: '',
    page: 1
  });

  useEffect(() => {
    loadBatches();
  }, [filters]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: filters.page.toString(),
        year: filters.year.toString()
      });

      if (filters.month) {
        params.append('month', filters.month.toString());
      }

      if (filters.status) {
        params.append('status', filters.status);
      }

      const response = await apiClient.get(`/api/expenses/batches?${params.toString()}`);
      
      if (response.success) {
        setBatches(response.data);
        setPagination(response.pagination ? {
          ...response.pagination,
          hasPreviousPage: response.pagination.hasPrevPage
        } : null);
      } else {
        toast.error('Masraf fişleri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      toast.error('Masraf fişleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Taslak', variant: 'secondary' as const },
      SUBMITTED: { label: 'Gönderildi', variant: 'outline' as const },
      APPROVED: { label: 'Onaylandı', variant: 'default' as const },
      REJECTED: { label: 'Reddedildi', variant: 'destructive' as const },
      PROCESSED: { label: 'İşlendi', variant: 'default' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return monthNames[month - 1];
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteBatch = async (batch: ExpenseBatch) => {
    if (batch.status !== 'DRAFT') {
      toast.error('Sadece taslak durumundaki fişler silinebilir');
      return;
    }

    const confirmed = await confirm.delete(`"${batch.name}" adlı masraf fişini silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`);
    if (!confirmed) return;

    try {
      const response = await apiClient.delete(`/api/expenses/batches/${batch.id}`);
      
      if (response.success) {
        toast.success('Masraf fişi başarıyla silindi');
        loadBatches(); // Reload the list
      } else {
        toast.error(response.error || 'Masraf fişi silinirken hata oluştu');
      }
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      toast.error('Masraf fişi silinirken hata oluştu');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Masraf Fişleri</h1>
            <p className="text-muted-foreground">Toplu masraf girişlerini yönetin</p>
          </div>
     
          <Button
            onClick={() => router.push('/expenses/new')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Tekil Fiş Oluştur
          </Button>
          <Button
            onClick={() => router.push('/expenses/batch/new')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Çoklu Fiş Oluştur
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Yıl</Label>
                <Select
                  value={filters.year.toString()}
                  onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, year: parseInt(value), page: 1 }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = currentDate.getFullYear() - 2 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ay</Label>
                <Select
                  value={filters.month?.toString() || 'all'}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      month: value === 'all' ? null : parseInt(value), 
                      page: 1 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Aylar</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      return (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Durum</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value, page: 1 }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm Durumlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="DRAFT">Taslak</SelectItem>
                    <SelectItem value="SUBMITTED">Gönderildi</SelectItem>
                    <SelectItem value="APPROVED">Onaylandı</SelectItem>
                    <SelectItem value="REJECTED">Reddedildi</SelectItem>
                    <SelectItem value="PROCESSED">İşlendi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
                  variant="outline"
                  className="w-full"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Filtrele
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Masraf Fişleri
              {pagination && (
                <Badge variant="secondary">
                  {pagination.totalCount} Fiş
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {filters.month 
                ? `${getMonthName(filters.month)} ${filters.year}` 
                : `${filters.year}`} dönemine ait masraf fişleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Masraf fişleri yükleniyor...
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Henüz masraf fişi bulunmuyor.</p>
                <Button 
                  onClick={() => router.push('/expenses/batch/new')}
                  className="mt-4"
                  variant="outline"
                >
                  İlk Fişi Oluştur
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fiş No</TableHead>
                      <TableHead>Fiş Adı</TableHead>
                      <TableHead>Dönem</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Kalem Sayısı</TableHead>
                      <TableHead>Toplam Tutar</TableHead>
                      <TableHead>Oluşturan</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-mono">
                          {batch.batchNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{batch.name}</div>
                            {batch.description && (
                              <div className="text-sm text-muted-foreground">
                                {batch.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {getMonthName(batch.periodMonth)} {batch.periodYear}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(batch.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calculator className="w-4 h-4" />
                            {batch.items.length}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₺{batch.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {batch.user.name}
                        </TableCell>
                        <TableCell>
                          {new Date(batch.entryDate).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/expenses/batch/${batch.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {batch.status === 'DRAFT' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/expenses/batch/${batch.id}/edit`)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteBatch(batch)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Sayfa {pagination.page} / {pagination.totalPages} 
                      ({pagination.totalCount} toplam fiş)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPreviousPage}
                      >
                        Önceki
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        Sonraki
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}