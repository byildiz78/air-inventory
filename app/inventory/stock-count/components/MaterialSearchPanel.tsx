'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CategoryFilter } from './CategoryFilter';
import { MaterialSearchResults } from './MaterialSearchResults';
import { apiClient } from '@/lib/api-client';
import { MaterialSearchResult } from '@/lib/services/historical-stock-service';
import { useDebounce } from '@/hooks/useDebounce';

interface MaterialSearchPanelProps {
  warehouseId: string;
  excludeIds: string[];
  onAddMaterial: (material: MaterialSearchResult) => void;
  onClose: () => void;
}

export function MaterialSearchPanel({
  warehouseId,
  excludeIds,
  onAddMaterial,
  onClose,
}: MaterialSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCategories, setSelectedMainCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<MaterialSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Perform search when debounced query or filters change
  useEffect(() => {
    if (debouncedSearchQuery.trim() || selectedMainCategories.length > 0 || selectedSubCategories.length > 0) {
      performSearch();
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [debouncedSearchQuery, selectedMainCategories, selectedSubCategories]);

  const performSearch = useCallback(async () => {
    if (!warehouseId) return;

    try {
      setLoading(true);
      setHasSearched(true);

      const params = new URLSearchParams({
        warehouseId,
        query: debouncedSearchQuery.trim(),
      });

      if (selectedMainCategories.length > 0) {
        params.append('categoryIds', selectedMainCategories.join(','));
      }

      if (selectedSubCategories.length > 0) {
        params.append('subCategoryIds', selectedSubCategories.join(','));
      }

      if (excludeIds.length > 0) {
        params.append('excludeIds', excludeIds.join(','));
      }

      const response = await apiClient.get(`/api/materials/search-for-count?${params.toString()}`);

      if (response.success) {
        setSearchResults(response.data.materials || []);
      } else {
        console.error('Search failed:', response.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, debouncedSearchQuery, selectedMainCategories, selectedSubCategories, excludeIds]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedMainCategories([]);
    setSelectedSubCategories([]);
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleAddMaterial = async (material: MaterialSearchResult) => {
    await onAddMaterial(material);
    // Remove the added material from results
    setSearchResults(prev => prev.filter(m => m.id !== material.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sayıma Ürün Ekle</h2>
          <p className="text-sm text-muted-foreground">
            Sayım listesine eklemek istediğiniz ürünleri arayabilirsiniz.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search Controls */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Ürün adı, kodu veya barkod ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Category Filters */}
          <CategoryFilter
            selectedMainCategories={selectedMainCategories}
            selectedSubCategories={selectedSubCategories}
            onMainCategoryChange={setSelectedMainCategories}
            onSubCategoryChange={setSelectedSubCategories}
            disabled={loading}
          />

          {/* Clear All Button */}
          {(searchQuery || selectedMainCategories.length > 0 || selectedSubCategories.length > 0) && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleClearSearch}>
                Tümünü Temizle
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <MaterialSearchResults
          results={searchResults}
          loading={loading}
          onAddMaterial={handleAddMaterial}
          excludeIds={excludeIds}
        />
      )}

      {/* Search Instructions */}
      {!hasSearched && (
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Ürün aramak için yukarıdaki arama kutusunu kullanın veya kategori filtrelerini seçin.</p>
            <div className="mt-4 text-sm space-y-1">
              <p>• Ürün adı, kodu veya barkod ile arama yapabilirsiniz</p>
              <p>• Ana kategori ve alt kategori filtrelerini kullanabilirsiniz</p>
              <p>• Zaten sayım listesindeki ürünler sonuçlarda görünmez</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}