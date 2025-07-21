'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { confirm } from '@/lib/confirm';
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
  FileBarChart,
  Grid3X3,
  List
} from 'lucide-react';
import Link from 'next/link';
import { EditCurrentAccountModal } from './EditCurrentAccountModal';
import { AccountStatementModal } from './AccountStatementModal';
import { DetailedAccountStatementModal } from './DetailedAccountStatementModal';
import { AccountListView } from './AccountListView';
import { ViewToggle } from './ViewToggle';
import { Pagination } from './Pagination';
import { useViewMode, ViewMode } from '../hooks/useViewMode';

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
  
  // View mode hook
  const { viewMode, toggleViewMode } = useViewMode();

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
    const confirmed = await confirm.delete(MESSAGES.CONFIRM.DELETE_ACCOUNT);
    if (!confirmed) return;

    try {
      setDeletingAccount(accountId);
      
      const response = await fetch(`/api/current-accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        notify.success(MESSAGES.SUCCESS.ACCOUNT_DELETED);
        onAccountDeleted();
      } else {
        const error = await response.json();
        notify.error(error.error || MESSAGES.ERROR.ACCOUNT_DELETE_ERROR);
      }
    } catch (error) {
      console.error('Delete error:', error);
      notify.error(MESSAGES.ERROR.ACCOUNT_DELETE_ERROR);
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
          <div className="flex items-center justify-between">
            <CardTitle>Cari Hesaplar</CardTitle>
            <ViewToggle viewMode={viewMode} onToggle={toggleViewMode} />
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === ViewMode.LIST ? (
            <AccountListView
              accounts={accounts}
              onEdit={setEditingAccount}
              onDelete={handleDelete}
              onShowStatement={setStatementAccount}
              onShowDetailedStatement={setDetailedStatementAccount}
              deletingAccount={deletingAccount}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <Card key={account.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <Badge className={getTypeColor(account.type)}>
                        {getTypeText(account.type)}
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-bold text-lg mb-1">{account.name}</h4>
                      <span className="text-sm text-gray-500">({account.code})</span>
                    </div>
                    
                    {account.contactName && (
                      <p className="text-sm text-gray-600 mb-2">{account.contactName}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{account._count.transactions} hareket</span>
                      <span>{account._count.payments} ödeme</span>
                    </div>
                    
                    <div className="text-center mb-3">
                      <div className={`text-lg font-bold ${getBalanceColor(account.currentBalance)}`}>
                        {getBalanceText(account.currentBalance)}
                      </div>
                      {account.creditLimit > 0 && (
                        <div className="text-xs text-gray-500">
                          Limit: ₺{account.creditLimit.toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatementAccount(account)}
                        className="flex-1 text-xs"
                      >
                        <FileText className="w-3 h-3" />
                      </Button>
                      <Link href={`/current-accounts/${account.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingAccount(account)}
                        className="text-xs"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
        </CardContent>
      </Card>
      
      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPageChange={onPageChange}
      />
      
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