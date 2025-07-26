import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
}

interface GroupCardProps {
  group: Group;
  category?: Category;
  itemsCount: number;
  onEdit: (group: Group) => void;
  onDelete: (id: string) => void;
}

export const GroupCard = ({
  group,
  category,
  itemsCount,
  onEdit,
  onDelete
}: GroupCardProps) => {
  const canDelete = itemsCount === 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: group.color || '#3B82F6' }}
            />
            <h3 className="font-semibold text-lg">{group.name}</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(group)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(group.id)}
              disabled={!canDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {category && (
            <Badge variant="outline" className="text-xs">
              {category.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {group.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {group.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {itemsCount} ürün
          </Badge>
        </div>

        {!canDelete && (
          <p className="text-xs text-muted-foreground mt-2">
            Bu grubu silmek için önce bağlı ürünleri kaldırın
          </p>
        )}
      </CardContent>
    </Card>
  );
};