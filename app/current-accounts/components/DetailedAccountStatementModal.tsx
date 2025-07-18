'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Loader2,
  Package,
  CreditCard,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface DetailedAccountStatementModalProps {
  account: any;
  isOpen: boolean;
  onClose: () => void;
}

export function DetailedAccountStatementModal({ account, isOpen, onClose }: DetailedAccountStatementModalProps) {
  const [loading, setLoading] = useState(false);
  const [statement, setStatement] = useState<any>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen && account) {
      loadStatement();
    }
  }, [isOpen, account, dateRange]);

  const loadStatement = async () => {
    try {
      setLoading(true);
      console.log('Loading detailed statement for account:', account.id, 'Date range:', dateRange);
      
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        detailed: 'true'
      });

      const response = await fetch(`/api/current-accounts/${account.id}/statement?${params}`);
      const data = await response.json();
      
      console.log('Detailed Statement API response:', data);

      if (data.success) {
        setStatement(data.data);
        console.log('Detailed statement data loaded:', data.data);
      } else {
        console.error('Error loading detailed statement:', data.error);
        alert(`Detaylı ekstre yüklenirken hata: ${data.error}`);
      }
    } catch (error) {
      console.error('Error loading detailed statement:', error);
      alert('Detaylı ekstre yüklenirken hata oluştu');
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
    if (amount > 0) return 'text-red-600';
    if (amount < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'DEBT': return 'Borç';
      case 'CREDIT': return 'Alacak';
      case 'PAYMENT': return 'Ödeme';
      case 'ADJUSTMENT': return 'Düzeltme';
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'DEBT': return 'bg-red-100 text-red-800';
      case 'CREDIT': return 'bg-green-100 text-green-800';
      case 'PAYMENT': return 'bg-blue-100 text-blue-800';
      case 'ADJUSTMENT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'CASH': return 'Nakit';
      case 'BANK_TRANSFER': return 'Havale/EFT';
      case 'CREDIT_CARD': return 'Kredi Kartı';
      case 'CHECK': return 'Çek';
      case 'PROMISSORY_NOTE': return 'Senet';
      default: return method;
    }
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detaylı Cari Hesap Ekstresi
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
              <span className="ml-2">Detaylı ekstre hazırlanıyor...</span>
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

              {/* Detailed Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Detaylı Hareket Listesi ({statement.summary.transactionCount} kayıt)</span>
                    <Button onClick={handlePrint} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Yazdır
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-auto">
                    {statement.operations.map((operation: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleExpanded(index)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {expandedItems.has(index) ? 
                                <ChevronDown className="w-4 h-4" /> : 
                                <ChevronRight className="w-4 h-4" />
                              }
                              <span className="font-medium">
                                {new Date(operation.date).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {operation.type === 'transaction' ? (
                                <Package className="w-4 h-4 text-blue-600" />
                              ) : (
                                <CreditCard className="w-4 h-4 text-green-600" />
                              )}
                              <span className="text-sm text-muted-foreground">
                                {operation.description}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className={`font-semibold ${getAmountColor(operation.amount)}`}>
                                {operation.amount > 0 ? '+' : ''}{formatCurrency(operation.amount)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Bakiye: {formatCurrency(operation.balance)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedItems.has(index) && operation.details && (
                          <div className="mt-4 pt-4 border-t bg-gray-50 -m-4 p-4 rounded-b-lg">
                            {operation.type === 'transaction' && operation.details.invoice && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge className={getTransactionTypeColor(operation.details.transactionType)}>
                                      {getTransactionTypeText(operation.details.transactionType)}
                                    </Badge>
                                    <span className="font-medium">
                                      Fatura: {operation.details.invoice.invoiceNumber}
                                    </span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    Kullanıcı: {operation.details.user?.name}
                                  </span>
                                </div>
                                
                                {operation.details.invoice.items && operation.details.invoice.items.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium mb-2">Fatura Kalemleri:</p>
                                    <div className="space-y-1">
                                      {operation.details.invoice.items.map((item: any, itemIndex: number) => (
                                        <div key={itemIndex} className="text-sm bg-white p-2 rounded border">
                                          <div className="flex justify-between">
                                            <span>{item.material?.name} ({item.quantity} {item.unit?.abbreviation})</span>
                                            <span className="font-medium">{formatCurrency(item.totalAmount)}</span>
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Birim Fiyat: {formatCurrency(item.unitPrice)} / {item.unit?.abbreviation}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {operation.type === 'payment' && operation.details && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-800">
                                      {getPaymentMethodText(operation.details.paymentMethod)}
                                    </Badge>
                                    <span className="font-medium">Ödeme</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    Kullanıcı: {operation.details.user?.name}
                                  </span>
                                </div>
                                
                                {operation.details.bankAccount && (
                                  <div className="text-sm">
                                    <span className="font-medium">Banka Hesabı:</span> {operation.details.bankAccount.accountName}
                                  </div>
                                )}
                              </div>
                            )}

                            {operation.referenceNumber && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                <span className="font-medium">Referans:</span> {operation.referenceNumber}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
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