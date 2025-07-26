import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { fetchWithAuth } from '@/hooks/useAuth';

interface GroupFormData {
  id?: string;
  name: string;
  description?: string;
  color: string;
  categoryId: string;
  isActive: boolean;
}

interface CategoryData {
  id: string;
  name: string;
  color?: string;
}

interface GroupFormProps {
  group?: GroupFormData;
  categories: CategoryData[];
  onSuccess: () => void;
  onCancel: () => void;
}

const predefinedColors = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
];

export const GroupForm = ({ group, categories, onSuccess, onCancel }: GroupFormProps) => {
  const [formData, setFormData] = useState<GroupFormData>({
    name: group?.name || '',
    description: group?.description || '',
    color: group?.color || predefinedColors[1],
    categoryId: group?.categoryId || '',
    isActive: group?.isActive ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = group?.id ? '/api/sales-item-groups' : '/api/sales-item-groups';
      const method = group?.id ? 'PUT' : 'POST';
      const body = group?.id ? { ...formData, id: group.id } : formData;

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        notify.success(
          group?.id 
            ? 'Grup başarıyla güncellendi' 
            : 'Grup başarıyla oluşturuldu'
        );
        onSuccess();
      } else {
        notify.error(
          data.error || 
          (group?.id ? 'Grup güncellenirken hata oluştu' : 'Grup eklenirken hata oluştu')
        );
      }
    } catch (error) {
      notify.error(
        group?.id ? 'Grup güncellenirken hata oluştu' : 'Grup eklenirken hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof GroupFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="groupName">Grup Adı *</Label>
        <Input
          id="groupName"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Örn: Et Yemekleri"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="groupCategory">Kategori *</Label>
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
        <Label htmlFor="groupDescription">Açıklama</Label>
        <Textarea
          id="groupDescription"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Grup açıklaması..."
          rows={2}
        />
      </div>
      
      <div>
        <Label htmlFor="groupColor">Renk</Label>
        <div className="space-y-3">
          <Input
            id="groupColor"
            type="color"
            value={formData.color}
            onChange={(e) => handleChange('color', e.target.value)}
            className="w-20 h-10"
          />
          <div className="grid grid-cols-8 gap-2">
            {predefinedColors.map(color => (
              <button
                key={color}
                type="button"
                className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: color }}
                onClick={() => handleChange('color', color)}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="groupIsActive"
          checked={formData.isActive}
          onChange={(e) => handleChange('isActive', e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="groupIsActive">Aktif</Label>
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button 
          type="submit" 
          className="bg-orange-500 hover:bg-orange-600"
          disabled={loading}
        >
          {loading ? 'Kaydediliyor...' : (group?.id ? 'Güncelle' : 'Ekle')}
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