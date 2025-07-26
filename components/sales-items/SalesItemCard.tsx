import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChefHat } from 'lucide-react';

interface SalesItem {
  id: string;
  name: string;
  menuCode?: string;
  description?: string;
  basePrice?: number;
  taxPercent?: number;
  categoryId: string;
  groupId?: string;
  isActive: boolean;
  isAvailable: boolean;
}

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface Group {
  id: string;
  name: string;
  color?: string;
}

interface SalesItemCardProps {
  item: SalesItem;
  category?: Category;
  group?: Group;
  mappingsCount: number;
  onEdit: (item: SalesItem) => void;
  onDelete: (id: string) => void;
}

export const SalesItemCard = ({
  item,
  category,
  group,
  mappingsCount,
  onEdit,
  onDelete
}: SalesItemCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: category?.color || '#3B82F6' }}
            />
            <h3 className="font-semibold text-lg">{item.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            {item.menuCode && (
              <Badge variant="secondary" className="text-xs">
                {item.menuCode}
              </Badge>
            )}
            {!item.isActive && (
              <Badge variant="destructive" className="text-xs">
                Pasif
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {item.description && (
          <p className="text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {category && (
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ borderColor: category.color, color: category.color }}
            >
              {category.name}
            </Badge>
          )}
          {group && (
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ borderColor: group.color, color: group.color }}
            >
              {group.name}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Fiyat:</span>
            <div className="font-medium">
              {item.basePrice ? `${item.basePrice} ₺` : 'Belirtilmemiş'}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">KDV:</span>
            <div className="font-medium">
              {item.taxPercent ? `%${item.taxPercent}` : 'Belirtilmemiş'}
            </div>
          </div>
        </div>

        {mappingsCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ChefHat className="w-4 h-4" />
            <span>{mappingsCount} reçete eşleştirmesi</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Sil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};