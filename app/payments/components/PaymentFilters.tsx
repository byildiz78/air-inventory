'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface PaymentFiltersProps {
  filters: {
    search: string;
    status: string;
    method: string;
    currentAccountId: string;
    page: number;
    limit: number;
  };
  onFilterChange: (filters: any) => void;
}

export function PaymentFilters({ filters, onFilterChange }: PaymentFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ search: value });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ status: value });
  };

  const handleMethodChange = (value: string) => {
    onFilterChange({ method: value });
  };

  const handleLimitChange = (value: string) => {
    onFilterChange({ limit: parseInt(value) });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      status: 'all',
      method: 'all',
      currentAccountId: '',
      page: 1,
      limit: 10
    });
  };

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.method !== 'all';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtreler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ödeme ara..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="PENDING">Beklemede</SelectItem>
                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                <SelectItem value="CANCELLED">İptal</SelectItem>
                <SelectItem value="FAILED">Başarısız</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <Select value={filters.method} onValueChange={handleMethodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Yöntem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Yöntemler</SelectItem>
                <SelectItem value="CASH">Nakit</SelectItem>
                <SelectItem value="BANK_TRANSFER">Havale/EFT</SelectItem>
                <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                <SelectItem value="CHECK">Çek</SelectItem>
                <SelectItem value="PROMISSORY_NOTE">Senet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-32">
            <Select value={filters.limit.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / sayfa</SelectItem>
                <SelectItem value="25">25 / sayfa</SelectItem>
                <SelectItem value="50">50 / sayfa</SelectItem>
                <SelectItem value="100">100 / sayfa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="w-full md:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Temizle
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}