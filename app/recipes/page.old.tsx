'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { Material, Unit } from '@prisma/client';
import { RecipeWithRelations } from './types';
import { RecipeForm } from './components/RecipeForm';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeStats } from './components/RecipeStats';
import { RecipeFilters } from './components/RecipeFilters';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeWithRelations[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
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
      const [recipesRes, materialsRes, unitsRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/materials'),
        fetch('/api/units'),
      ]);

      const [recipesData, materialsData, unitsData] = await Promise.all([
        recipesRes.json(),
        materialsRes.json(),
        unitsRes.json(),
      ]);

      const materials = materialsData.data || [];
      const units = unitsData.data || [];
      const recipes = recipesData.data || [];
      
      // Reçetelerin maliyetlerini dönüşüm katsayısını hesaba katarak güncelle
      const updatedRecipes = recipes.map((recipe: RecipeWithRelations) => {
        // Her bir reçete için maliyeti yeniden hesapla
        const totalCost = recipe.ingredients.reduce((total: number, ingredient: any) => {
          const material = materials.find((m: any) => m.id === ingredient.materialId);
          if (material && material.averageCost && ingredient.quantity > 0) {
            // Satın alma birimi ile tüketim birimi arasındaki dönüşümü hesapla
            const purchaseUnit = units.find((u: any) => u.id === material.purchaseUnitId);
            const consumptionUnit = units.find((u: any) => u.id === material.consumptionUnitId);
            
            if (purchaseUnit && consumptionUnit) {
              let conversionRate = 1;
              
              // Aynı birim tipi ve aynı temel birime sahiplerse (kg ve g gibi)
              if (purchaseUnit.type === consumptionUnit.type) {
                // Her iki birim de kendi temel birimine göre dönüşüm faktörüne sahip
                conversionRate = purchaseUnit.conversionFactor / consumptionUnit.conversionFactor;
              }
              
              // Satın alma birimindeki maliyeti tüketim birimine dönüştür
              const costInConsumptionUnit = material.averageCost / conversionRate;
              return total + (costInConsumptionUnit * ingredient.quantity);
            }
            
            // Birim bilgisi eksikse, dönüşüm yapmadan devam et
            return total + (material.averageCost * ingredient.quantity);
          }
          return total;
        }, 0);
        
        // Porsiyon başı maliyet (porsiyon sayısı her zaman 1)
        const costPerServing = totalCost;
        
        // Önerilen fiyat ve kar marjını güncelle
        const suggestedPrice = costPerServing * 1.4; // %40 kar marjı
        const profitMargin = ((suggestedPrice - costPerServing) / costPerServing) * 100;
        
        return {
          ...recipe,
          costPerServing,
          suggestedPrice,
          profitMargin
        };
      });
      
      setRecipes(updatedRecipes);
      setMaterials(materials);
      setUnits(units);
    } catch (error) {
      console.error('Recipe data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
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

  const getMaterialById = (id: string) => materials.find(m => m.id === id);
  const getUnitById = (id: string) => units.find(u => u.id === id);

  const getProfitabilityBadge = (profitMargin?: number) => {
    if (!profitMargin) return { variant: 'outline' as const, text: 'Bilinmiyor', color: 'text-gray-500' };
    if (profitMargin >= 40) return { variant: 'default' as const, text: 'Yüksek', color: 'text-green-600' };
    if (profitMargin >= 20) return { variant: 'secondary' as const, text: 'Orta', color: 'text-yellow-600' };
    return { variant: 'destructive' as const, text: 'Düşük', color: 'text-red-600' };
  };

  const calculateFormCost = () => {
    return recipeForm.ingredients.reduce((total, ingredient) => {
      const material = getMaterialById(ingredient.materialId);
      if (material && material.averageCost && ingredient.quantity > 0) {
        // Satın alma birimi ile tüketim birimi arasındaki dönüşümü hesapla
        const purchaseUnit = units.find(u => u.id === material.purchaseUnitId);
        const consumptionUnit = units.find(u => u.id === material.consumptionUnitId);
        
        if (purchaseUnit && consumptionUnit) {
          let conversionRate = 1;
          
          // Aynı birim tipi ve aynı temel birime sahiplerse (kg ve g gibi)
          if (purchaseUnit.type === consumptionUnit.type) {
            // Her iki birim de kendi temel birimine göre dönüşüm faktörüne sahip
            // Örneğin: 1 kg = 1000 g ise, kg için conversionFactor=1000, g için conversionFactor=1
            conversionRate = purchaseUnit.conversionFactor / consumptionUnit.conversionFactor;
          }
          
          // Satın alma birimindeki maliyeti tüketim birimine dönüştür
          const costInConsumptionUnit = material.averageCost / conversionRate;
          return total + (costInConsumptionUnit * ingredient.quantity);
        }
        
        // Birim bilgisi eksikse, dönüşüm yapmadan devam et
        return total + (material.averageCost * ingredient.quantity);
      }
      return total;
    }, 0);
  };

  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))];

  const openEditModal = (recipe: RecipeWithRelations) => {
    setSelectedRecipe(recipe);
    setRecipeForm({
      name: recipe.name,
      description: recipe.description || '',
      category: recipe.category || '',
      servingSize: recipe.servingSize,
      preparationTime: recipe.preparationTime,
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

      let response;
      if (selectedRecipe && isEditRecipeOpen) {
        // Update existing recipe
        response = await fetch(`/api/recipes/${selectedRecipe.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recipeData)
        });
      } else {
        // Create new recipe
        response = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recipeData)
        });
      }

      if (response.ok) {
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
      servingSize: recipe.servingSize,
      preparationTime: recipe.preparationTime,
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
              />
            </DialogContent>
          </Dialog>

          {/* Edit Recipe Modal */}
          <Dialog open={isEditRecipeOpen} onOpenChange={setIsEditRecipeOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <RecipeStats recipes={recipes} categories={categories} />

        {/* Filters */}
        <RecipeFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          profitabilityFilter={profitabilityFilter}
          onProfitabilityChange={setProfitabilityFilter}
          categories={categories}
        />

        {/* Recipes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
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
