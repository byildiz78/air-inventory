import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  categoryId: string;
}

interface SalesItemsFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedGroup: string;
  setSelectedGroup: (value: string) => void;
  categories: Category[];
  groups: Group[];
}

export const SalesItemsFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedGroup,
  setSelectedGroup,
  categories,
  groups
}: SalesItemsFiltersProps) => {
  // Filter groups based on selected category
  const filteredGroups = selectedCategory === 'all' 
    ? groups 
    : groups.filter(group => group.categoryId === selectedCategory);

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
              placeholder="Satış malı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Grup seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Gruplar</SelectItem>
              {filteredGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};