'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  Building2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { EditPaymentModal } from './EditPaymentModal';

interface PaymentListProps {
  payments: any[];
  loading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  onPaymentUpdated: () => void;
  onPaymentDeleted: () => void;
}

export function PaymentList({
  payments,
  loading,
  pagination,
  onPageChange,
  onPaymentUpdated,
  onPaymentDeleted
}: PaymentListProps) {
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [deletingPayment, setDeletingPayment] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Beklemede';
      case 'COMPLETED': return 'Tamamlandı';
      case 'CANCELLED': return 'İptal';
      case 'FAILED': return 'Başarısız';
      default: return status;
    }
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case 'CASH': return 'Nakit';
      case 'BANK_TRANSFER': return 'Havale/EFT';
      case 'CREDIT_CARD': return 'Kredi Kartı';
      case 'CHECK': return 'Çek';
      case 'PROMISSORY_NOTE': return 'Senet';
      default: return method;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH': return '💰';
      case 'BANK_TRANSFER': return '🏦';
      case 'CREDIT_CARD': return '💳';
      case 'CHECK': return '📄';
      case 'PROMISSORY_NOTE': return '📜';
      default: return '💳';
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Bu ödemeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setDeletingPayment(paymentId);
      
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onPaymentDeleted();
      } else {
        const error = await response.json();
        alert(error.error || 'Ödeme silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Ödeme silinirken hata oluştu');
    } finally {
      setDeletingPayment(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ödemeler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ödemeler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Ödeme bulunamadı</h3>
            <p className="text-muted-foreground">
              Henüz ödeme kaydı eklenmemiş veya arama kriterlerine uygun ödeme bulunamadı.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ödemeler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">{getMethodIcon(payment.paymentMethod)}</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg">{payment.paymentNumber}</h4>
                          <Badge className={getStatusColor(payment.status)}>
                            {getStatusText(payment.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{payment.currentAccount.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(payment.paymentDate).toLocaleDateString('tr-TR')}
                          </span>
                          <span>{getMethodText(payment.paymentMethod)}</span>
                          {payment.referenceNumber && (
                            <span>Ref: {payment.referenceNumber}</span>
                          )}
                        </div>
                        
                        {payment.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {payment.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ₺{payment.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.currency}
                        </div>
                        {payment.bankAccount && (
                          <div className="text-xs text-gray-400">
                            {payment.bankAccount.accountName}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPayment(payment)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(payment.id)}
                          disabled={deletingPayment === payment.id || payment.status === 'COMPLETED'}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} kayıt
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const startPage = Math.max(1, pagination.page - 2);
                  const pageNum = startPage + i;
                  if (pageNum > pagination.pages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.pages)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Modal */}
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onPaymentUpdated={onPaymentUpdated}
        />
      )}
    </>
  );
}