'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Package,
  Warehouse,
  AlertTriangle
} from 'lucide-react';

interface StockDataTableProps {
  materials: any[];
  warehouses: any[];
  materialStocks: any[];
  getWarehouseById: (id: string) => any;
  getMaterialById: (id: string) => any;
  getWarehouseTypeColor: (type: string) => string;
  loading: boolean;
}

type SortField = 'warehouseName' | 'materialName' | 'stockInPurchaseUnit' | 'lastPurchasePrice' | 'totalValue';
type SortDirection = 'asc' | 'desc';

export function StockDataTable({
  materials,
  warehouses,
  materialStocks,
  getWarehouseById,
  getMaterialById,
  getWarehouseTypeColor,
  loading
}: StockDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('warehouseName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Prepare data for table
  const tableData = useMemo(() => {
    return materialStocks.map(stock => {
      const warehouse = getWarehouseById(stock.warehouseId);
      const material = getMaterialById(stock.materialId);
      const isLowStock = stock.currentStock < (stock.minimumStock || 0);

      // Debug log to catch object rendering issues
      console.log('Material object:', material);
      console.log('Warehouse object:', warehouse);

      // Get unit information from material
      const consumptionUnit = typeof material?.consumptionUnit === 'string' ? 
        { name: material.consumptionUnit } : 
        material?.consumptionUnit;
      const purchaseUnit = typeof material?.purchaseUnit === 'string' ? 
        { name: material.purchaseUnit } : 
        material?.purchaseUnit;
      
      // Get conversion factor from material (how many consumption units = 1 purchase unit)
      const unitConversion = material?.unitConversion || 1;
      
      // Debug unit conversion
      console.log(`🔍 UNIT DEBUG ${material?.name}: material.unitConversion=${material?.unitConversion}, using=${unitConversion}`);
      
      // Use stock values directly from MaterialStock table (no unit conversion needed)
      const stockInPurchaseUnit = stock.currentStock;
      
      // Use averageCost from MaterialStock table (more accurate and up-to-date)
      const lastPurchasePrice = stock.averageCost || 0;
      
      // Calculate total value directly
      const totalValue = stockInPurchaseUnit * lastPurchasePrice;
      
      console.log(`📊 Stock calculation for ${material?.name}:`, {
        currentStock: stock.currentStock,
        stockInPurchaseUnit,
        lastPurchasePrice,
        totalValue
      });

      return {
        id: stock.id,
        warehouseId: stock.warehouseId,
        materialId: stock.materialId,
        warehouseName: warehouse?.name || 'Bilinmeyen Depo',
        warehouseType: warehouse?.type || 'GENERAL',
        materialName: material?.name || 'Bilinmeyen Malzeme',
        materialCategory: typeof material?.category === 'string' ? material.category : material?.category?.name || 'Kategori Yok',
        currentStock: stock.currentStock, // Keep original for internal use
        availableStock: stock.availableStock,
        reservedStock: stock.reservedStock,
        minimumStock: stock.minimumStock || 0,
        stockInPurchaseUnit, // Display quantity directly from materialStock
        lastPurchasePrice, // Use lastPurchasePrice from Material table
        totalValue, // Total value calculated with lastPurchasePrice
        unitConversion,
        consumptionUnitName: consumptionUnit?.name || 'birim',
        purchaseUnitName: purchaseUnit?.name || 'birim',
        location: stock.location || '',
        isLowStock
      };
    });
  }, [materialStocks, getWarehouseById, getMaterialById]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = tableData.filter(item => {
      const matchesSearch = 
        item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouseName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesWarehouse = warehouseFilter === 'all' || item.warehouseId === warehouseFilter;
      
      return matchesSearch && matchesWarehouse;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tableData, searchTerm, warehouseFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stok Tablosu</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Stok Tablosu
        </CardTitle>
        <CardDescription>
          Depo bazlı malzeme stok durumu ({filteredAndSortedData.length} kayıt)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Depo veya malzeme ara..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Depo filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Depolar</SelectItem>
                {warehouses.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-32">
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
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
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[200px]">
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('warehouseName')}
                  >
                    <Warehouse className="w-4 h-4 mr-2" />
                    Depo Adı
                    {getSortIcon('warehouseName')}
                  </Button>
                </TableHead>
                <TableHead className="w-[200px]">
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('materialName')}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Malzeme Adı
                    {getSortIcon('materialName')}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px] text-right">
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('stockInPurchaseUnit')}
                  >
                    Miktar
                    {getSortIcon('stockInPurchaseUnit')}
                  </Button>
                </TableHead>
                <TableHead className="w-[80px] text-center">Birim</TableHead>
                <TableHead className="w-[120px] text-right">
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('lastPurchasePrice')}
                  >
                    Ort. Birim Fiyat
                    {getSortIcon('lastPurchasePrice')}
                  </Button>
                </TableHead>
                <TableHead className="w-[120px] text-right">
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('totalValue')}
                  >
                    Toplam Tutar
                    {getSortIcon('totalValue')}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Sonuç bulunamadı</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${getWarehouseTypeColor(item.warehouseType)}`} />
                        <div>
                          <div className="font-medium">{item.warehouseName}</div>
                          <div className="text-xs text-muted-foreground">{item.warehouseType}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.materialName}</div>
                        <div className="text-xs text-muted-foreground">{item.materialCategory}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`font-medium ${item.isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                        {item.stockInPurchaseUnit.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {item.consumptionUnitName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        ₺{item.lastPurchasePrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ort. Maliyet
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        ₺{item.totalValue.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.stockInPurchaseUnit.toLocaleString()} × ₺{item.lastPurchasePrice.toFixed(2)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} / {filteredAndSortedData.length} kayıt
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2);
                const pageNum = startPage + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}