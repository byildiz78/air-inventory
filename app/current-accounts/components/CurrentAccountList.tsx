'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Eye, 
  Edit, 
  Trash2,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  FileBarChart
} from 'lucide-react';
import Link from 'next/link';
import { EditCurrentAccountModal } from './EditCurrentAccountModal';
import { AccountStatementModal } from './AccountStatementModal';
import { DetailedAccountStatementModal } from './DetailedAccountStatementModal';

interface CurrentAccountListProps {
  accounts: any[];
  loading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  onAccountUpdated: () => void;
  onAccountDeleted: () => void;
}

export function CurrentAccountList({
  accounts,
  loading,
  pagination,
  onPageChange,
  onAccountUpdated,
  onAccountDeleted
}: CurrentAccountListProps) {
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [deletingAccount, setDeletingAccount] = useState<string | null>(null);
  const [statementAccount, setStatementAccount] = useState<any>(null);
  const [detailedStatementAccount, setDetailedStatementAccount] = useState<any>(null);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SUPPLIER': return 'bg-blue-100 text-blue-800';
      case 'CUSTOMER': return 'bg-green-100 text-green-800';
      case 'BOTH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'SUPPLIER': return 'Tedarikçi';
      case 'CUSTOMER': return 'Müşteri';
      case 'BOTH': return 'Her İkisi';
      default: return type;
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-red-600'; // Borç
    if (balance < 0) return 'text-green-600'; // Alacak
    return 'text-gray-600'; // Sıfır
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) return `₺${balance.toLocaleString()} Borç`;
    if (balance < 0) return `₺${Math.abs(balance).toLocaleString()} Alacak`;
    return '₺0 Sıfır';
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Bu cari hesabı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setDeletingAccount(accountId);
      
      const response = await fetch(`/api/current-accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onAccountDeleted();
      } else {
        const error = await response.json();
        alert(error.error || 'Cari hesap silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Cari hesap silinirken hata oluştu');
    } finally {
      setDeletingAccount(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cari Hesaplar</CardTitle>
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

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cari Hesaplar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Cari hesap bulunamadı</h3>
            <p className="text-muted-foreground">
              Henüz cari hesap eklenmemiş veya arama kriterlerine uygun hesap bulunamadı.
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
          <CardTitle>Cari Hesaplar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg">{account.name}</h4>
                          <Badge className={getTypeColor(account.type)}>
                            {getTypeText(account.type)}
                          </Badge>
                          <span className="text-sm text-gray-500">({account.code})</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {account.contactName && (
                            <span>{account.contactName}</span>
                          )}
                          {account.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {account.phone}
                            </span>
                          )}
                          {account.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {account.email}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>{account._count.transactions} hareket</span>
                          <span>{account._count.payments} ödeme</span>
                          {account.lastTransactionDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Son: {new Date(account.lastTransactionDate).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getBalanceColor(account.currentBalance)}`}>
                          {getBalanceText(account.currentBalance)}
                        </div>
                        {account.creditLimit > 0 && (
                          <div className="text-sm text-gray-500">
                            Limit: ₺{account.creditLimit.toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStatementAccount(account)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Ekstre
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailedStatementAccount(account)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                        >
                          <FileBarChart className="w-4 h-4 mr-1" />
                          Detaylı
                        </Button>
                        <Link href={`/current-accounts/${account.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Detay
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAccount(account)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
                          disabled={deletingAccount === account.id}
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
      {editingAccount && (
        <EditCurrentAccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onAccountUpdated={onAccountUpdated}
        />
      )}

      {/* Statement Modal */}
      {statementAccount && (
        <AccountStatementModal
          account={statementAccount}
          isOpen={!!statementAccount}
          onClose={() => setStatementAccount(null)}
        />
      )}

      {/* Detailed Statement Modal */}
      {detailedStatementAccount && (
        <DetailedAccountStatementModal
          account={detailedStatementAccount}
          isOpen={!!detailedStatementAccount}
          onClose={() => setDetailedStatementAccount(null)}
        />
      )}
    </>
  );
}