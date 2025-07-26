import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { fetchWithAuth } from '@/hooks/useAuth';

interface SalesItem {
  id?: string;
  name: string;
  menuCode?: string;
  description?: string;
  basePrice?: number;
  taxPercent?: number;
  categoryId: string;
  groupId?: string;
  sortOrder?: number;
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
  categoryId: string;
  color?: string;
}

interface SalesItemFormProps {
  salesItem?: SalesItem;
  categories: Category[];
  groups: Group[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const SalesItemForm = ({ 
  salesItem, 
  categories, 
  groups, 
  onSuccess, 
  onCancel 
}: SalesItemFormProps) => {
  const [formData, setFormData] = useState<SalesItem>({
    name: salesItem?.name || '',
    menuCode: salesItem?.menuCode || '',
    description: salesItem?.description || '',
    basePrice: salesItem?.basePrice || undefined,
    taxPercent: salesItem?.taxPercent || 10,
    categoryId: salesItem?.categoryId || '',
    groupId: salesItem?.groupId || '',
    sortOrder: salesItem?.sortOrder || 0,
    isActive: salesItem?.isActive ?? true,
    isAvailable: salesItem?.isAvailable ?? true
  });
  const [loading, setLoading] = useState(false);

  // Filter groups based on selected category
  const availableGroups = formData.categoryId 
    ? groups.filter(group => group.categoryId === formData.categoryId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = salesItem?.id ? '/api/sales-items' : '/api/sales-items';
      const method = salesItem?.id ? 'PUT' : 'POST';
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        groupId: formData.groupId === 'none' || formData.groupId === '' ? null : formData.groupId,
        basePrice: formData.basePrice || null,
        menuCode: formData.menuCode || null,
        description: formData.description || null,
        ...(salesItem?.id && { id: salesItem.id })
      };

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        notify.success(
          salesItem?.id 
            ? 'Satış malı başarıyla güncellendi' 
            : 'Satış malı başarıyla oluşturuldu'
        );
        onSuccess();
      } else {
        notify.error(
          data.error || 
          (salesItem?.id ? 'Satış malı güncellenirken hata oluştu' : 'Satış malı eklenirken hata oluştu')
        );
      }
    } catch (error) {
      notify.error(
        salesItem?.id ? 'Satış malı güncellenirken hata oluştu' : 'Satış malı eklenirken hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SalesItem, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Clear group selection if category changes
      if (field === 'categoryId' && value !== prev.categoryId) {
        newData.groupId = '';
      }
      
      return newData;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="itemName">Ürün Adı *</Label>
          <Input
            id="itemName"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Örn: Kuşbaşılı Pilav"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="itemMenuCode">Menü Kodu</Label>
          <Input
            id="itemMenuCode"
            value={formData.menuCode}
            onChange={(e) => handleChange('menuCode', e.target.value)}
            placeholder="Örn: M001"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="itemDescription">Açıklama</Label>
        <Textarea
          id="itemDescription"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Ürün açıklaması..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="itemBasePrice">Temel Fiyat (₺)</Label>
          <Input
            id="itemBasePrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.basePrice || ''}
            onChange={(e) => handleChange('basePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0.00"
          />
        </div>
        
        <div>
          <Label htmlFor="itemTaxPercent">KDV Oranı (%)</Label>
          <Select 
            value={formData.taxPercent?.toString() || '10'} 
            onValueChange={(value) => handleChange('taxPercent', parseFloat(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">%0</SelectItem>
              <SelectItem value="1">%1</SelectItem>
              <SelectItem value="10">%10</SelectItem>
              <SelectItem value="20">%20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="itemCategory">Kategori *</Label>
          <Select 
            value={formData.categoryId} 
            onValueChange={(value) => handleChange('categoryId', value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="itemGroup">Grup</Label>
          <Select 
            value={formData.groupId || 'none'} 
            onValueChange={(value) => handleChange('groupId', value === 'none' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Grup seçin (opsiyonel)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Grup Yok</SelectItem>
              {availableGroups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    {group.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="itemSortOrder">Sıralama</Label>
        <Input
          id="itemSortOrder"
          type="number"
          min="0"
          value={formData.sortOrder || 0}
          onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
          placeholder="0"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="itemIsActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="itemIsActive">Aktif</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="itemIsAvailable"
            checked={formData.isAvailable}
            onChange={(e) => handleChange('isAvailable', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="itemIsAvailable">Satışta</Label>
        </div>
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button 
          type="submit" 
          className="bg-orange-500 hover:bg-orange-600"
          disabled={loading}
        >
          {loading ? 'Kaydediliyor...' : (salesItem?.id ? 'Güncelle' : 'Ekle')}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          İptal
        </Button>
      </div>
    </form>
  );
};