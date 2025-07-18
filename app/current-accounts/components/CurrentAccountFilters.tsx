'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface CurrentAccountFiltersProps {
  filters: {
    search: string;
    type: string;
    page: number;
    limit: number;
  };
  onFilterChange: (filters: any) => void;
}

export function CurrentAccountFilters({ filters, onFilterChange }: CurrentAccountFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ search: value });
  };

  const handleTypeChange = (value: string) => {
    onFilterChange({ type: value });
  };

  const handleLimitChange = (value: string) => {
    onFilterChange({ limit: parseInt(value) });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      type: 'all',
      page: 1,
      limit: 10
    });
  };

  const hasActiveFilters = filters.search || filters.type !== 'all';

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
                placeholder="Cari hesap ara..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <Select value={filters.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="SUPPLIER">Tedarikçi</SelectItem>
                <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                <SelectItem value="BOTH">Her İkisi</SelectItem>
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