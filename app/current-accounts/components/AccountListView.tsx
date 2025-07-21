'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  Phone,
  Mail,
  FileText,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import Link from 'next/link';

interface AccountListViewProps {
  accounts: any[];
  onEdit: (account: any) => void;
  onDelete: (accountId: string) => void;
  onShowStatement: (account: any) => void;
  onShowDetailedStatement: (account: any) => void;
  deletingAccount: string | null;
}

export function AccountListView({
  accounts,
  onEdit,
  onDelete,
  onShowStatement,
  onShowDetailedStatement,
  deletingAccount
}: AccountListViewProps) {
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

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (balance < 0) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <Card key={account.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-lg truncate">{account.name}</h4>
                    <Badge className={`${getTypeColor(account.type)} flex-shrink-0`}>
                      {getTypeText(account.type)}
                    </Badge>
                    <span className="text-sm text-gray-500 flex-shrink-0">({account.code})</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                    {account.contactName && (
                      <span className="truncate">{account.contactName}</span>
                    )}
                    {account.phone && (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Phone className="w-3 h-3" />
                        {account.phone}
                      </span>
                    )}
                    {account.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {account.email}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {account._count.transactions} hareket
                    </span>
                    <span className="flex items-center gap-1">
                      <FileBarChart className="w-3 h-3" />
                      {account._count.payments} ödeme
                    </span>
                    {account.lastTransactionDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Son: {new Date(account.lastTransactionDate).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    {getBalanceIcon(account.currentBalance)}
                    <span className={`text-lg font-bold ${getBalanceColor(account.currentBalance)}`}>
                      {getBalanceText(account.currentBalance)}
                    </span>
                  </div>
                  {account.creditLimit > 0 && (
                    <div className="text-sm text-gray-500">
                      Limit: ₺{account.creditLimit.toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onShowStatement(account)}
                      className="h-8 px-2"
                      title="Ekstre"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onShowDetailedStatement(account)}
                      className="h-8 px-2"
                      title="Detaylı Ekstre"
                    >
                      <FileBarChart className="w-4 h-4" />
                    </Button>
                    <Link href={`/current-accounts/${account.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2" title="Detay">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(account)}
                      className="h-8 px-2"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(account.id)}
                      disabled={deletingAccount === account.id}
                      className="h-8 px-2"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {accounts.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Cari hesap bulunamadı</h3>
          <p className="text-muted-foreground">
            Filtre kriterlerine uygun cari hesap bulunamadı.
          </p>
        </div>
      )}
    </div>
  );
}