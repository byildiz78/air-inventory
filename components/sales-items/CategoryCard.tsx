import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface CategoryCardProps {
  category: Category;
  groupsCount: number;
  itemsCount: number;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export const CategoryCard = ({
  category,
  groupsCount,
  itemsCount,
  onEdit,
  onDelete
}: CategoryCardProps) => {
  const canDelete = groupsCount === 0 && itemsCount === 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: category.color || '#3B82F6' }}
            />
            <h3 className="font-semibold text-lg">{category.name}</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category.id)}
              disabled={!canDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {category.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {category.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {groupsCount} grup
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {itemsCount} ürün
          </Badge>
        </div>

        {!canDelete && (
          <p className="text-xs text-muted-foreground mt-2">
            Bu kategoriyi silmek için önce bağlı grupları ve ürünleri kaldırın
          </p>
        )}
      </CardContent>
    </Card>
  );
};