import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Tag, Layers, ChefHat } from 'lucide-react';

interface SalesItemsStatsProps {
  salesItemsCount: number;
  categoriesCount: number;
  groupsCount: number;
  mappingsCount: number;
}

export const SalesItemsStats = ({
  salesItemsCount,
  categoriesCount,
  groupsCount,
  mappingsCount
}: SalesItemsStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Satış Malı</CardTitle>
          <ShoppingBag className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{salesItemsCount}</div>
          <p className="text-xs text-muted-foreground">Aktif ve pasif tüm ürünler</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kategoriler</CardTitle>
          <Tag className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{categoriesCount}</div>
          <p className="text-xs text-muted-foreground">Satış malı kategorisi</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gruplar</CardTitle>
          <Layers className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{groupsCount}</div>
          <p className="text-xs text-muted-foreground">Alt gruplar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reçete Eşleştirmeleri</CardTitle>
          <ChefHat className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mappingsCount}</div>
          <p className="text-xs text-muted-foreground">Toplam eşleştirme</p>
        </CardContent>
      </Card>
    </div>
  );
};