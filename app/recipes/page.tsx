'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { Material, Unit, Tax } from '@prisma/client';
import { apiClient } from '@/lib/api-client';
import { RecipeWithRelations } from './types';
import { RecipeForm } from './components/RecipeForm';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeStats } from './components/RecipeStats';
import { RecipeFilters } from './components/RecipeFilters';
import { RecipeListView } from './components/RecipeListView';
import { ViewToggle } from './components/ViewToggle';
import { Pagination } from './components/Pagination';
import { useViewMode, ViewMode } from './hooks/useViewMode';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeWithRelations[]>([]);
  const [materials, setMaterials] = useState<(Material & { defaultTax?: Tax | null })[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View mode hook
  const { viewMode, toggleViewMode } = useViewMode();
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [profitabilityFilter, setProfitabilityFilter] = useState<string>('all');

  // Modal states
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
  const [isEditRecipeOpen, setIsEditRecipeOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithRelations | null>(null);
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState(false);

  // Recipe form state
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    description: '',
    category: '',
    servingSize: 1,
    preparationTime: 30,
    ingredients: [] as Array<{
      materialId: string;
      unitId: string;
      quantity: number;
      notes: string;
    }>
  });

  useEffect(() => {
    loadRecipeData();
  }, []);

  const loadRecipeData = async () => {
    try {
      setLoading(true);
      const [recipesData, materialsData, unitsData] = await Promise.all([
        apiClient.get('/api/recipes'),
        apiClient.get('/api/materials'),
        apiClient.get('/api/units'),
      ]);

      setRecipes(recipesData.data || []);
      setMaterials(materialsData.data || []);
      setUnits(unitsData.data || []);
    } catch (error) {
      console.error('Recipe data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate recipes
  const { filteredRecipes, paginatedRecipes, totalPages } = useMemo(() => {
    const filtered = recipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
      
      let matchesProfitability = true;
      if (profitabilityFilter === 'high') {
        matchesProfitability = (recipe.profitMargin || 0) >= 40;
      } else if (profitabilityFilter === 'medium') {
        matchesProfitability = (recipe.profitMargin || 0) >= 20 && (recipe.profitMargin || 0) < 40;
      } else if (profitabilityFilter === 'low') {
        matchesProfitability = (recipe.profitMargin || 0) < 20;
      }

      return matchesSearch && matchesCategory && matchesProfitability;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      filteredRecipes: filtered,
      paginatedRecipes: paginated,
      totalPages
    };
  }, [recipes, searchTerm, selectedCategory, profitabilityFilter, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, profitabilityFilter]);

  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getUnitById = (id: string) => units.find(u => u.id === id);

  const getProfitabilityBadge = (profitMargin?: number | null) => {
    if (!profitMargin) return { variant: 'outline' as const, text: 'Bilinmiyor', color: 'text-gray-500' };
    if (profitMargin >= 40) return { variant: 'default' as const, text: 'Yüksek', color: 'text-green-600' };
    if (profitMargin >= 20) return { variant: 'secondary' as const, text: 'Orta', color: 'text-yellow-600' };
    return { variant: 'destructive' as const, text: 'Düşük', color: 'text-red-600' };
  };

  const calculateFormCost = () => {
    return recipeForm.ingredients.reduce((total, ingredient) => {
      const material = getMaterialById(ingredient.materialId);
      if (material && material.averageCost && ingredient.quantity > 0) {
        return total + (material.averageCost * ingredient.quantity);
      }
      return total;
    }, 0);
  };

  const calculateFormCostWithVAT = () => {
    return recipeForm.ingredients.reduce((total, ingredient) => {
      const material = getMaterialById(ingredient.materialId);
      if (material && material.averageCost && ingredient.quantity > 0) {
        const baseCost = material.averageCost * ingredient.quantity;
        // Add VAT if material has defaultTax
        if (material.defaultTax?.rate) {
          const vatMultiplier = 1 + (material.defaultTax.rate / 100);
          return total + (baseCost * vatMultiplier);
        }
        return total + baseCost;
      }
      return total;
    }, 0);
  };

  // Helper function to calculate recipe cost with VAT
  const calculateRecipeCostWithVAT = (recipe: RecipeWithRelations) => {
    if (!recipe.ingredients) return recipe.totalCost || 0;
    
    return recipe.ingredients.reduce((total, ingredient) => {
      if (ingredient.material && ingredient.material.averageCost && ingredient.quantity > 0) {
        const baseCost = ingredient.material.averageCost * ingredient.quantity;
        // Get material with tax info from materials array
        const materialWithTax = materials.find(m => m.id === ingredient.material?.id);
        if (materialWithTax?.defaultTax?.rate) {
          const vatMultiplier = 1 + (materialWithTax.defaultTax.rate / 100);
          return total + (baseCost * vatMultiplier);
        }
        return total + baseCost;
      }
      return total;
    }, 0);
  };

  // Helper function to calculate recipe cost per serving with VAT
  const calculateRecipeCostPerServingWithVAT = (recipe: RecipeWithRelations) => {
    const totalCostWithVAT = calculateRecipeCostWithVAT(recipe);
    return totalCostWithVAT / (recipe.servingSize || 1);
  };

  // Helper function to calculate VAT amount for recipe
  const calculateRecipeVATAmount = (recipe: RecipeWithRelations) => {
    const totalCostWithVAT = calculateRecipeCostWithVAT(recipe);
    const totalCostWithoutVAT = recipe.totalCost || 0;
    return totalCostWithVAT - totalCostWithoutVAT;
  };

  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))] as string[];

  const openEditModal = (recipe: RecipeWithRelations) => {
    setSelectedRecipe(recipe);
    setRecipeForm({
      name: recipe.name,
      description: recipe.description || '',
      category: recipe.category || '',
      servingSize: recipe.servingSize || 0,
      preparationTime: recipe.preparationTime || 0,
      ingredients: recipe.ingredients?.map(ing => ({
        materialId: ing.materialId,
        unitId: ing.unitId,
        quantity: ing.quantity,
        notes: ing.notes || ''
      })) || []
    });
    setIsEditRecipeOpen(true);
  };

  const resetForm = () => {
    setRecipeForm({
      name: '',
      description: '',
      category: '',
      servingSize: 1,
      preparationTime: 30,
      ingredients: []
    });
  };

  const handleFormChange = (field: string, value: any) => {
    setRecipeForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveRecipe = async () => {
    try {
      const recipeData = {
        ...recipeForm,
        suggestedPrice: (calculateFormCost() / recipeForm.servingSize) * 1.4,
        profitMargin: 40
      };

      let result;
      if (selectedRecipe && isEditRecipeOpen) {
        // Update existing recipe
        result = await apiClient.put(`/api/recipes/${selectedRecipe.id}`, recipeData);
      } else {
        // Create new recipe
        result = await apiClient.post('/api/recipes', recipeData);
      }

      if (result.success) {
        await loadRecipeData();
        setIsAddRecipeOpen(false);
        setIsEditRecipeOpen(false);
        resetForm();
        setSelectedRecipe(null);
      } else {
        console.error('Failed to save recipe');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const handleCopyRecipe = (recipe: RecipeWithRelations) => {
    setSelectedRecipe(null);
    setRecipeForm({
      name: `${recipe.name} - Kopya`,
      description: recipe.description || '',
      category: recipe.category || '',
      servingSize: recipe.servingSize || 0,
      preparationTime: recipe.preparationTime || 0,
      ingredients: recipe.ingredients?.map(ing => ({
        materialId: ing.materialId,
        unitId: ing.unitId,
        quantity: ing.quantity,
        notes: ing.notes || ''
      })) || []
    });
    setIsAddRecipeOpen(true);
  };

  const handleViewDetails = (recipe: RecipeWithRelations) => {
    setSelectedRecipe(recipe);
    setIsRecipeDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Reçeteler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <Dialog open={isAddRecipeOpen} onOpenChange={setIsAddRecipeOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => {
                  resetForm();
                  setSelectedRecipe(null);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Reçete
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Reçete Ekle</DialogTitle>
                <DialogDescription>
                  Yeni bir reçete oluşturun ve malzemelerini ekleyin
                </DialogDescription>
              </DialogHeader>
              <RecipeForm
                materials={materials}
                units={units}
                recipeForm={recipeForm}
                onFormChange={handleFormChange}
                onSave={handleSaveRecipe}
                onCancel={() => {
                  setIsAddRecipeOpen(false);
                  resetForm();
                }}
                calculateFormCost={calculateFormCost}
                calculateFormCostWithVAT={calculateFormCostWithVAT}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Recipe Modal */}
          <Dialog open={isEditRecipeOpen} onOpenChange={setIsEditRecipeOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Reçete Düzenle</DialogTitle>
                <DialogDescription>
                  {selectedRecipe?.name} reçetesini düzenleyin
                </DialogDescription>
              </DialogHeader>
              <RecipeForm
                isEdit={true}
                materials={materials}
                units={units}
                recipeForm={recipeForm}
                onFormChange={handleFormChange}
                onSave={handleSaveRecipe}
                onCancel={() => {
                  setIsEditRecipeOpen(false);
                  resetForm();
                  setSelectedRecipe(null);
                }}
                calculateFormCost={calculateFormCost}
                calculateFormCostWithVAT={calculateFormCostWithVAT}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <RecipeStats recipes={recipes} categories={categories} />

        {/* Filters and View Toggle */}
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <RecipeFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            profitabilityFilter={profitabilityFilter}
            onProfitabilityChange={setProfitabilityFilter}
            categories={categories}
          />
          <ViewToggle viewMode={viewMode} onToggle={toggleViewMode} />
        </div>

        {/* Recipes Display */}
        {viewMode === ViewMode.LIST ? (
          <RecipeListView
            recipes={paginatedRecipes}
            onViewDetails={handleViewDetails}
            onEdit={openEditModal}
            onCopy={handleCopyRecipe}
            getProfitabilityBadge={getProfitabilityBadge}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onViewDetails={handleViewDetails}
                onEdit={openEditModal}
                onCopy={handleCopyRecipe}
                getProfitabilityBadge={getProfitabilityBadge}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredRecipes.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage);
            setCurrentPage(1);
          }}
        />

        {/* Recipe Detail Modal */}
        <Dialog open={isRecipeDetailOpen} onOpenChange={setIsRecipeDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedRecipe && (
              <RecipeDetail
                recipe={selectedRecipe}
                getMaterialById={getMaterialById}
                getUnitById={getUnitById}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
