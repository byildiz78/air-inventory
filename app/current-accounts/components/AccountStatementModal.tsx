'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Loader2
} from 'lucide-react';

interface AccountStatementModalProps {
  account: any;
  isOpen: boolean;
  onClose: () => void;
}

export function AccountStatementModal({ account, isOpen, onClose }: AccountStatementModalProps) {
  const [loading, setLoading] = useState(false);
  const [statement, setStatement] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Bu ayın ilk günü
    endDate: new Date().toISOString().split('T')[0] // Bugün
  });

  useEffect(() => {
    if (isOpen && account) {
      loadStatement();
    }
  }, [isOpen, account, dateRange]);

  const loadStatement = async () => {
    try {
      setLoading(true);
      console.log('Loading statement for account:', account.id, 'Date range:', dateRange);
      
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        detailed: 'false'
      });

      const response = await fetch(`/api/current-accounts/${account.id}/statement?${params}`);
      const data = await response.json();
      
      console.log('Statement API response:', data);

      if (data.success) {
        setStatement(data.data);
        console.log('Statement data loaded:', data.data);
      } else {
        console.error('Error loading statement:', data.error);
        alert(`Ekstre yüklenirken hata: ${data.error}`);
      }
    } catch (error) {
      console.error('Error loading statement:', error);
      alert('Ekstre yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-red-600'; // Borç
    if (amount < 0) return 'text-green-600'; // Alacak/Ödeme
    return 'text-gray-600';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Cari Hesap Ekstresi
          </DialogTitle>
          <DialogDescription>
            {account?.name} - {account?.code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tarih Aralığı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Bitiş Tarihi</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Ekstre hazırlanıyor...</span>
            </div>
          ) : statement ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Açılış Bakiyesi</p>
                        <p className={`text-lg font-bold ${getAmountColor(statement.summary.openingBalance)}`}>
                          {formatCurrency(statement.summary.openingBalance)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium">Toplam Borç</p>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(statement.summary.totalDebit)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Toplam Alacak</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(statement.summary.totalCredit)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">Kapanış Bakiyesi</p>
                        <p className={`text-lg font-bold ${getAmountColor(statement.summary.closingBalance)}`}>
                          {formatCurrency(statement.summary.closingBalance)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Operations Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Hareket Listesi ({statement.summary.transactionCount} kayıt)</span>
                    <Button onClick={handlePrint} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Yazdır
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-60">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Tarih</th>
                          <th className="text-left py-2">Açıklama</th>
                          <th className="text-left py-2">Ref. No</th>
                          <th className="text-right py-2">Borç</th>
                          <th className="text-right py-2">Alacak</th>
                          <th className="text-right py-2">Bakiye</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statement.operations.map((operation: any, index: number) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-2">
                              {new Date(operation.date).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="py-2">{operation.description}</td>
                            <td className="py-2">{operation.referenceNumber || '-'}</td>
                            <td className="py-2 text-right">
                              {operation.amount > 0 ? formatCurrency(operation.amount) : '-'}
                            </td>
                            <td className="py-2 text-right">
                              {operation.amount < 0 ? formatCurrency(Math.abs(operation.amount)) : '-'}
                            </td>
                            <td className={`py-2 text-right font-medium ${getAmountColor(operation.balance)}`}>
                              {formatCurrency(operation.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}