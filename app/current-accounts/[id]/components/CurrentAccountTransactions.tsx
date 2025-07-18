'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

interface CurrentAccountTransactionsProps {
  accountId: string;
  onTransactionAdded: () => void;
}

export function CurrentAccountTransactions({ accountId, onTransactionAdded }: CurrentAccountTransactionsProps) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  useEffect(() => {
    loadTransactions();
  }, [accountId, page]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/current-accounts/${accountId}/transactions?page=${page}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEBT': return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'CREDIT': return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'PAYMENT': return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'ADJUSTMENT': return <Receipt className="w-4 h-4 text-purple-600" />;
      default: return <Receipt className="w-4 h-4" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'DEBT': return 'Borç';
      case 'CREDIT': return 'Alacak';
      case 'PAYMENT': return 'Ödeme';
      case 'ADJUSTMENT': return 'Düzeltme';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEBT': return 'bg-red-100 text-red-800';
      case 'CREDIT': return 'bg-green-100 text-green-800';
      case 'PAYMENT': return 'bg-blue-100 text-blue-800';
      case 'ADJUSTMENT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Son Hareketler
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {pagination.total} hareket
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Henüz hareket bulunmuyor</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {transactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{transaction.description}</span>
                        <Badge className={getTypeColor(transaction.type)} variant="outline">
                          {getTypeText(transaction.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(transaction.transactionDate).toLocaleDateString('tr-TR')}
                        {transaction.referenceNumber && (
                          <span>• {transaction.referenceNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${getAmountColor(transaction.amount)}`}>
                      {transaction.amount > 0 ? '+' : ''}₺{transaction.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Bakiye: ₺{transaction.balanceAfter.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Sayfa {page} / {pagination.pages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.pages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}