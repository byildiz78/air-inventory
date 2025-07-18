'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ChefHat, AlertCircle, ArrowUpDown, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

// Import modular components
import { RecipeStatsCards } from '@/components/recipes/RecipeStatsCards';
import { RecipeSelectionCard } from '@/components/recipes/RecipeSelectionCard';
import { DetailedCostAnalysis } from '@/components/recipes/DetailedCostAnalysis';

interface ApiResponse {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    categories: string[];
    profitabilityOptions: Array<{
      value: string;
      label: string;
      count: number;
    }>;
  };
  error?: string;
}

export default function CostAnalysisPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProfitability, setSelectedProfitability] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter options
  const [categories, setCategories] = useState<string[]>([]);
  const [profitabilityOptions, setProfitabilityOptions] = useState<Array<{value: string; label: string; count: number}>>([]);

  useEffect(() => {
    fetchRecipeAnalysis();
  }, [currentPage, pageSize, searchTerm, selectedCategory, selectedProfitability, sortBy, sortOrder]);

  const fetchRecipeAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedProfitability && selectedProfitability !== 'all') params.append('profitability', selectedProfitability);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      
      const response = await fetch(`/api/recipes/cost-analysis?${params}`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setRecipes(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
        setCategories(data.filters.categories);
        setProfitabilityOptions(data.filters.profitabilityOptions);
      } else {
        setError(data.error || 'Reçete maliyet analizi yüklenemedi');
      }
    } catch (err) {
      console.error('Cost analysis fetch error:', err);
      setError('Reçete maliyet analizi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedProfitability('all');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const getSortingOptions = () => [
    { value: 'name', label: 'Ad (A-Z)' },
    { value: 'profitMargin', label: 'Kâr Marjı (Yüksek-Düşük)' },
    { value: 'profitAmount', label: 'Kâr Tutarı (Yüksek-Düşük)' },
    { value: 'costPerServing', label: 'Maliyet (Düşük-Yüksek)' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Maliyet analizi yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Hata</span>
              </div>
              <p className="text-red-600 mt-2">{error}</p>
              <Button 
                onClick={fetchRecipeAnalysis}
                className="mt-4"
                variant="outline"
              >
                Tekrar Dene
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Maliyet Analizi</h1>
            <p className="text-muted-foreground">Reçete maliyet analizi ve karlılık hesaplamaları</p>
          </div>
          <Button 
            onClick={fetchRecipeAnalysis}
            variant="outline"
            size="sm"
          >
            Yenile
          </Button>
        </div>

        {/* Stats Cards */}
        <RecipeStatsCards recipes={recipes} />

        {selectedRecipe ? (
          // Show detailed cost analysis for selected recipe
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedRecipe.name}</CardTitle>
                    <CardDescription>
                      {selectedRecipe.category} • {selectedRecipe.servingSize} porsiyon • 
                      {selectedRecipe.preparationTime} dakika
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedRecipe(null)}>
                    Geri Dön
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <DetailedCostAnalysis recipe={selectedRecipe} />
          </div>
        ) : (
          // Show recipe selection with filters
          <div className="space-y-6">
            
            {/* Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filtreler
                    </CardTitle>
                    <CardDescription>
                      Reçetelerinizi filtreleyerek analiz edin
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Temizle
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Reçete ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={selectedCategory || undefined} onValueChange={(value) => setSelectedCategory(value || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Profitability Filter */}
                  <Select value={selectedProfitability || undefined} onValueChange={(value) => setSelectedProfitability(value || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kârlılık" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kârlılık</SelectItem>
                      {profitabilityOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} ({option.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort Options */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sıralama" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSortingOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort Order */}
                  <Button
                    variant="outline"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortOrder === 'asc' ? 'Artan' : 'Azalan'}
                  </Button>
                </div>

                {/* Active Filters */}
                {(searchTerm || (selectedCategory && selectedCategory !== 'all') || (selectedProfitability && selectedProfitability !== 'all')) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {searchTerm && (
                      <Badge variant="secondary">
                        Arama: {searchTerm}
                      </Badge>
                    )}
                    {selectedCategory && selectedCategory !== 'all' && (
                      <Badge variant="secondary">
                        Kategori: {selectedCategory}
                      </Badge>
                    )}
                    {selectedProfitability && selectedProfitability !== 'all' && (
                      <Badge variant="secondary">
                        Kârlılık: {profitabilityOptions.find(o => o.value === selectedProfitability)?.label}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalCount} reçete bulundu
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sayfa başı:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recipe List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeSelectionCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={setSelectedRecipe}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Önceki
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {recipes.length === 0 && (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Reçete bulunamadı</h3>
                <p className="text-muted-foreground">
                  Arama kriterinize uygun reçete bulunamadı. Filtreleri değiştirmeyi deneyin.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}