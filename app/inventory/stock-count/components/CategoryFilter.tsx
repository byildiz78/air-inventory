'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  subcategories?: Category[];
}

interface CategoryFilterProps {
  selectedMainCategories: string[];
  selectedSubCategories: string[];
  onMainCategoryChange: (categoryIds: string[]) => void;
  onSubCategoryChange: (categoryIds: string[]) => void;
  disabled?: boolean;
}

export function CategoryFilter({
  selectedMainCategories,
  selectedSubCategories,
  onMainCategoryChange,
  onSubCategoryChange,
  disabled = false,
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load subcategories when main categories change
  useEffect(() => {
    if (selectedMainCategories.length > 0) {
      loadSubCategories(selectedMainCategories);
    } else {
      setSubCategories([]);
      onSubCategoryChange([]);
    }
  }, [selectedMainCategories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/categories?parentOnly=true');
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubCategories = async (mainCategoryIds: string[]) => {
    try {
      setLoading(true);
      
      if (mainCategoryIds.length === 0) {
        setSubCategories([]);
        return;
      }
      
      // Load subcategories for each main category and combine them
      const allSubCategories: Category[] = [];
      
      const promises = mainCategoryIds.map(async (categoryId) => {
        try {
          const response = await apiClient.get(`/api/categories/${categoryId}/subcategories`);
          if (response.success && response.data) {
            return response.data;
          }
          return [];
        } catch (error) {
          console.error(`Error loading subcategories for ${categoryId}:`, error);
          return [];
        }
      });
      
      const results = await Promise.all(promises);
      results.forEach(subcategories => {
        allSubCategories.push(...subcategories);
      });
      
      setSubCategories(allSubCategories);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMainCategoryToggle = (categoryId: string) => {
    const newSelected = selectedMainCategories.includes(categoryId)
      ? selectedMainCategories.filter(id => id !== categoryId)
      : [...selectedMainCategories, categoryId];
    
    onMainCategoryChange(newSelected);
  };

  const handleSubCategoryToggle = (categoryId: string) => {
    const newSelected = selectedSubCategories.includes(categoryId)
      ? selectedSubCategories.filter(id => id !== categoryId)
      : [...selectedSubCategories, categoryId];
    
    onSubCategoryChange(newSelected);
  };

  const clearAllFilters = () => {
    onMainCategoryChange([]);
    onSubCategoryChange([]);
  };

  const getSelectedCategoryNames = () => {
    const mainNames = categories
      .filter(cat => selectedMainCategories.includes(cat.id))
      .map(cat => cat.name);
    
    const subNames = subCategories
      .filter(cat => selectedSubCategories.includes(cat.id))
      .map(cat => cat.name);
    
    return [...mainNames, ...subNames];
  };

  const totalSelected = selectedMainCategories.length + selectedSubCategories.length;

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex space-x-2">
        {/* Ana Kategoriler */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              disabled={disabled || loading}
              className="justify-between min-w-[150px]"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Ana Kategori
                {selectedMainCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedMainCategories.length}
                  </Badge>
                )}
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            {loading ? (
              <div className="p-2 text-sm text-muted-foreground">Yükleniyor...</div>
            ) : categories.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">Kategori bulunamadı</div>
            ) : (
              <>
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={selectedMainCategories.includes(category.id)}
                    onCheckedChange={() => handleMainCategoryToggle(category.id)}
                  >
                    {category.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Alt Kategoriler */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              disabled={disabled || loading || selectedMainCategories.length === 0}
              className="justify-between min-w-[150px]"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Alt Kategori
                {selectedSubCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedSubCategories.length}
                  </Badge>
                )}
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            {selectedMainCategories.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                Önce ana kategori seçin
              </div>
            ) : loading ? (
              <div className="p-2 text-sm text-muted-foreground">Yükleniyor...</div>
            ) : subCategories.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">Alt kategori bulunamadı</div>
            ) : (
              <>
                {subCategories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={selectedSubCategories.includes(category.id)}
                    onCheckedChange={() => handleSubCategoryToggle(category.id)}
                  >
                    {category.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Temizle butonu */}
        {totalSelected > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Temizle
          </Button>
        )}
      </div>

      {/* Seçilen kategoriler gösterimi */}
      {totalSelected > 0 && (
        <div className="flex flex-wrap gap-1">
          {getSelectedCategoryNames().map((name, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}