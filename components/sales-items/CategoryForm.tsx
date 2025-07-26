import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { notify } from '@/lib/notifications';
import { MESSAGES } from '@/lib/messages';
import { fetchWithAuth } from '@/hooks/useAuth';

interface CategoryFormData {
  id?: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
}

interface CategoryFormProps {
  category?: CategoryFormData;
  onSuccess: () => void;
  onCancel: () => void;
}

const predefinedColors = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
];

export const CategoryForm = ({ category, onSuccess, onCancel }: CategoryFormProps) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || predefinedColors[0],
    isActive: category?.isActive ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = category?.id ? '/api/sales-item-categories' : '/api/sales-item-categories';
      const method = category?.id ? 'PUT' : 'POST';
      const body = category?.id ? { ...formData, id: category.id } : formData;

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        notify.success(
          category?.id 
            ? MESSAGES.SUCCESS.CATEGORY_UPDATED 
            : MESSAGES.SUCCESS.CATEGORY_CREATED
        );
        onSuccess();
      } else {
        notify.error(
          data.error || 
          (category?.id ? 'Kategori güncellenirken hata oluştu' : 'Kategori eklenirken hata oluştu')
        );
      }
    } catch (error) {
      notify.error(
        category?.id ? 'Kategori güncellenirken hata oluştu' : 'Kategori eklenirken hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="categoryName">Kategori Adı *</Label>
        <Input
          id="categoryName"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Örn: Ana Yemek"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="categoryDescription">Açıklama</Label>
        <Textarea
          id="categoryDescription"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Kategori açıklaması..."
          rows={2}
        />
      </div>
      
      <div>
        <Label htmlFor="categoryColor">Renk</Label>
        <div className="space-y-3">
          <Input
            id="categoryColor"
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
          id="categoryIsActive"
          checked={formData.isActive}
          onChange={(e) => handleChange('isActive', e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="categoryIsActive">Aktif</Label>
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button 
          type="submit" 
          className="bg-orange-500 hover:bg-orange-600"
          disabled={loading}
        >
          {loading ? 'Kaydediliyor...' : (category?.id ? 'Güncelle' : 'Ekle')}
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