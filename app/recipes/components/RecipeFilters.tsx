import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface RecipeFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  profitabilityFilter: string;
  onProfitabilityChange: (value: string) => void;
  categories: string[];
}

export function RecipeFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  profitabilityFilter,
  onProfitabilityChange,
  categories
}: RecipeFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtreler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Reçete ara..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
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

          <Select value={profitabilityFilter} onValueChange={onProfitabilityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Karlılık" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Karlılık</SelectItem>
              <SelectItem value="high">Yüksek (%40+)</SelectItem>
              <SelectItem value="medium">Orta (%20-40)</SelectItem>
              <SelectItem value="low">Düşük (%20-)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
