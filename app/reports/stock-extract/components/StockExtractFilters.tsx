'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Calendar, 
  Warehouse, 
  Package, 
  Play,
  ChevronDown,
  ChevronRight,
  X,
  Filter
} from 'lucide-react';

interface Filters {
  startDate: string;
  endDate: string;
  warehouseIds: string[];
  categoryIds: string[];
  reportType: 'quantity' | 'amount' | 'amount_with_vat';
}

interface StockExtractFiltersProps {
  filters: Filters;
  warehouses: any[];
  categories: any[];
  onChange: (filters: Partial<Filters>) => void;
  onGenerate: () => void;
  loading: boolean;
}

export function StockExtractFilters({
  filters,
  warehouses,
  categories,
  onChange,
  onGenerate,
  loading
}: StockExtractFiltersProps) {
  const [warehouseFilterOpen, setWarehouseFilterOpen] = useState(false);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);

  const handleWarehouseChange = (warehouseId: string, checked: boolean) => {
    const newWarehouseIds = checked
      ? [...filters.warehouseIds, warehouseId]
      : filters.warehouseIds.filter(id => id !== warehouseId);
    
    onChange({ warehouseIds: newWarehouseIds });
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategoryIds = checked
      ? [...filters.categoryIds, categoryId]
      : filters.categoryIds.filter(id => id !== categoryId);
    
    onChange({ categoryIds: newCategoryIds });
  };

  const clearWarehouseFilters = () => {
    onChange({ warehouseIds: [] });
  };

  const clearCategoryFilters = () => {
    onChange({ categoryIds: [] });
  };

  const selectAllWarehouses = () => {
    onChange({ warehouseIds: warehouses.map(w => w.id) });
  };

  const selectAllCategories = () => {
    onChange({ categoryIds: categories.map(c => c.id) });
  };

  const getSelectedWarehouseNames = () => {
    return warehouses
      .filter(w => filters.warehouseIds.includes(w.id))
      .map(w => w.name);
  };

  const getSelectedCategoryNames = () => {
    return categories
      .filter(c => filters.categoryIds.includes(c.id))
      .map(c => c.name);
  };

  // Quick date presets
  const setDatePreset = (preset: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (preset) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'yesterday':
        startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'thisWeek':
        startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        endDate = new Date();
        break;
      case 'lastWeek':
        const lastWeekStart = new Date(today.setDate(today.getDate() - today.getDay() - 7));
        const lastWeekEnd = new Date(today.setDate(today.getDate() - today.getDay() - 1));
        startDate = lastWeekStart;
        endDate = lastWeekEnd;
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date();
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    onChange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-8">
      
      {/* Main Filters Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calendar className="w-5 h-5" />
            Rapor Parametreleri
          </CardTitle>
          <CardDescription>
            Stok ekstresi için tarih aralığı ve rapor tipi seçiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="startDate" className="flex items-center gap-2 mb-3 text-blue-800 font-medium">
                <Calendar className="w-4 h-4" />
                Başlangıç Tarihi *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
                className="border-blue-300 focus:border-blue-500"
              />
            </div>
            
            <div>
              <Label htmlFor="endDate" className="flex items-center gap-2 mb-3 text-blue-800 font-medium">
                <Calendar className="w-4 h-4" />
                Bitiş Tarihi *
              </Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => onChange({ endDate: e.target.value })}
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-3 text-blue-800 font-medium">
                <Filter className="w-4 h-4" />
                Rapor Tipi *
              </Label>
              <Select 
                value={filters.reportType} 
                onValueChange={(value: 'quantity' | 'amount' | 'amount_with_vat') => onChange({ reportType: value })}
              >
                <SelectTrigger className="border-blue-300 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">📊 Miktar Bazlı</SelectItem>
                  <SelectItem value="amount">💰 Tutar Bazlı (KDV Hariç)</SelectItem>
                  <SelectItem value="amount_with_vat">💰 Tutar Bazlı (KDV Dahil)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="mt-6">
            <Label className="text-sm font-medium mb-3 block text-blue-800">Hızlı Tarih Seçimi</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'today', label: '📅 Bugün' },
                { key: 'yesterday', label: '📅 Dün' },
                { key: 'thisWeek', label: '📅 Bu Hafta' },
                { key: 'lastWeek', label: '📅 Geçen Hafta' },
                { key: 'thisMonth', label: '📅 Bu Ay' },
                { key: 'lastMonth', label: '📅 Geçen Ay' }
              ].map(preset => (
                <Button
                  key={preset.key}
                  variant="outline"
                  size="sm"
                  onClick={() => setDatePreset(preset.key)}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warehouse Filter */}
      <div>
        <Collapsible open={warehouseFilterOpen} onOpenChange={setWarehouseFilterOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 hover:from-purple-100 hover:to-violet-100 hover:border-purple-300"
            >
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">🏢 Depo Filtreleri</span>
                {filters.warehouseIds.length > 0 && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                    {filters.warehouseIds.length} seçili
                  </Badge>
                )}
              </div>
              {warehouseFilterOpen ? 
                <ChevronDown className="w-4 h-4 text-purple-600" /> : 
                <ChevronRight className="w-4 h-4 text-purple-600" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-purple-900 flex items-center gap-2">
                    <Warehouse className="w-4 h-4" />
                    Depo Seçimi
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAllWarehouses}
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                    >
                      ✅ Tümünü Seç
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearWarehouseFilters}
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                    >
                      🗑️ Temizle
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {warehouses.map(warehouse => (
                    <div 
                      key={warehouse.id} 
                      className="flex items-center space-x-3 p-2 rounded-lg bg-white/70 border border-purple-200 hover:bg-white hover:shadow-sm transition-all"
                    >
                      <Checkbox
                        id={`warehouse-${warehouse.id}`}
                        checked={filters.warehouseIds.includes(warehouse.id)}
                        onCheckedChange={(checked) => 
                          handleWarehouseChange(warehouse.id, checked as boolean)
                        }
                        className="border-purple-400 data-[state=checked]:bg-purple-600"
                      />
                      <Label 
                        htmlFor={`warehouse-${warehouse.id}`}
                        className="text-sm cursor-pointer text-purple-900 font-medium"
                      >
                        🏢 {warehouse.name}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {filters.warehouseIds.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <Label className="text-sm text-purple-800 mb-2 block font-medium">📋 Seçili Depolar:</Label>
                    <div className="flex flex-wrap gap-2">
                      {getSelectedWarehouseNames().map(name => (
                        <Badge 
                          key={name} 
                          className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200"
                        >
                          🏢 {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Category Filter */}
      <div>
        <Collapsible open={categoryFilterOpen} onOpenChange={setCategoryFilterOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 hover:border-green-300"
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">📦 Kategori Filtreleri</span>
                {filters.categoryIds.length > 0 && (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    {filters.categoryIds.length} seçili
                  </Badge>
                )}
              </div>
              {categoryFilterOpen ? 
                <ChevronDown className="w-4 h-4 text-green-600" /> : 
                <ChevronRight className="w-4 h-4 text-green-600" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-900 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Kategori Seçimi
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAllCategories}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      ✅ Tümünü Seç
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearCategoryFilters}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      🗑️ Temizle
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map(category => (
                    <div 
                      key={category.id} 
                      className="flex items-center space-x-3 p-2 rounded-lg bg-white/70 border border-green-200 hover:bg-white hover:shadow-sm transition-all"
                    >
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={filters.categoryIds.includes(category.id)}
                        onCheckedChange={(checked) => 
                          handleCategoryChange(category.id, checked as boolean)
                        }
                        className="border-green-400 data-[state=checked]:bg-green-600"
                      />
                      <Label 
                        htmlFor={`category-${category.id}`}
                        className="text-sm cursor-pointer text-green-900 font-medium"
                      >
                        📂 {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {filters.categoryIds.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <Label className="text-sm text-green-800 mb-2 block font-medium">📋 Seçili Kategoriler:</Label>
                    <div className="flex flex-wrap gap-2">
                      {getSelectedCategoryNames().map(name => (
                        <Badge 
                          key={name} 
                          className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                        >
                          📂 {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Generate Button */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <h3 className="text-orange-900 font-semibold mb-2">📊 Rapor Oluşturma</h3>
              <p className="text-orange-700 text-sm">
                Seçtiğiniz kriterlere göre detaylı stok ekstresi raporu oluşturun
              </p>
            </div>
            <Button 
              onClick={onGenerate}
              disabled={loading || !filters.startDate || !filters.endDate}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-8 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              {loading ? '⏳ Rapor Oluşturuluyor...' : '🚀 Rapor Oluştur'}
            </Button>
            {(!filters.startDate || !filters.endDate) && (
              <p className="text-orange-600 text-xs">
                ⚠️ Rapor oluşturmak için başlangıç ve bitiş tarihi gereklidir
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}