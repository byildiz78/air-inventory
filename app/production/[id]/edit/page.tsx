'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Save,
  AlertTriangle,
  Factory,
  Package,
  Calendar,
  ChefHat,
  Users,
  Warehouse as WarehouseIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';

export default function ProductionEditPage() {
  const Toaster = dynamic(() => import('react-hot-toast').then((mod) => mod.Toaster), { ssr: false });
  const router = useRouter();
  const params = useParams();
  const productionId = params.id as string;

  const [production, setProduction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    loadProduction();
  }, [productionId]);

  const loadProduction = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/api/production/${productionId}`);
      
      if (response.success) {
        const prod = response.data;
        setProduction(prod);
        setFormData({
          date: new Date(prod.date).toISOString().split('T')[0],
          quantity: prod.quantity,
          notes: prod.notes || '',
        });
      } else {
        setError(response.error || 'Üretim kaydı bulunamadı');
      }
    } catch (error) {
      console.error('Error loading production:', error);
      setError('Üretim kaydı yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      const updateData = {
        date: new Date(formData.date).toISOString(),
        quantity: formData.quantity,
        notes: formData.notes,
      };

      const response = await apiClient.put(`/api/production/${productionId}`, updateData);
      
      if (response.success) {
        toast.success('Üretim kaydı başarıyla güncellendi!');
        router.push('/production');
      } else {
        toast.error(response.error || 'Güncelleme sırasında bir hata oluştu');
      }
    } catch (error) {
      console.error('Error updating production:', error);
      toast.error('Güncelleme sırasında bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/production');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Üretim kaydı yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium mb-2">Hata Oluştu</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push('/production')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  if (!production) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Üretim Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">Bu üretim kaydı mevcut değil.</p>
          <Button onClick={() => router.push('/production')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Üretim Kaydı Düzenle</h1>
              <p className="text-muted-foreground">
                {production.materialName} üretim kaydını düzenleyin
              </p>
            </div>
          </div>
        </div>

        {/* Production Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-blue-600" />
              Üretim Bilgileri
            </CardTitle>
            <CardDescription>
              Mevcut üretim kaydı bilgileri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Üretilen Ürün</span>
                </div>
                <div className="text-lg font-bold">{production.materialName}</div>
                <div className="text-sm text-blue-600">
                  {production.producedQuantity} birim üretildi
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ChefHat className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Kullanılan Reçete</span>
                </div>
                <div className="text-lg font-bold">{production.recipeName}</div>
                <div className="text-sm text-green-600">
                  {production.quantity} porsiyon
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <WarehouseIcon className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Depo</span>
                </div>
                <div className="text-lg font-bold">{production.warehouse?.name || 'Varsayılan'}</div>
                <div className="text-sm text-purple-600">
                  Üretim lokasyonu
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">Önemli Not</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Üretim kaydını düzenlemek sadece kayıt bilgilerini günceller. 
                    Stok hareketleri otomatik olarak düzeltilmez. Stok düzeltmeleri 
                    için ayrı işlem yapmanız gerekebilir.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Düzenlenebilir Alanlar</CardTitle>
            <CardDescription>
              Aşağıdaki alanları güvenli bir şekilde düzenleyebilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Üretim Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Package className="w-4 h-4 inline mr-1" />
                    Üretim Miktarı (Porsiyon)
                  </label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Miktarı değiştirirseniz, üretilen birim miktarı da orantılı olarak güncellenir
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Üretim Notları
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Üretim ile ilgili notlar..."
                  rows={4}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Audit Info */}
        <Card>
          <CardHeader>
            <CardTitle>Kayıt Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Oluşturan:</span>
                <div className="font-medium flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {production.user?.name || 'Bilinmeyen'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Oluşturma Tarihi:</span>
                <div className="font-medium">
                  {new Date(production.createdAt).toLocaleString('tr-TR')}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Son Güncelleme:</span>
                <div className="font-medium">
                  {new Date(production.updatedAt).toLocaleString('tr-TR')}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Kayıt ID:</span>
                <div className="font-mono text-xs">{production.id}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}