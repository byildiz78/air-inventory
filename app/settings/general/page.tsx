'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database,
  Globe,
  DollarSign,
  Calculator,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { notify } from '@/lib/notifications';
import { fetchWithAuth } from '@/hooks/useAuth';

interface Setting {
  id: string;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  createdAt: string;
  updatedAt: string;
}

interface SettingCategory {
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  settings: {
    key: string;
    label: string;
    description?: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'SELECT';
    options?: { value: string; label: string }[];
    placeholder?: string;
  }[];
}

const settingCategories: SettingCategory[] = [
  {
    title: 'Genel Ayarlar',
    icon: Globe,
    description: 'Sistem genelinde kullanılan temel ayarlar',
    settings: [
      {
        key: 'company_name',
        label: 'Şirket Adı',
        description: 'Raporlarda ve belgelerde görünecek şirket adı',
        type: 'STRING',
        placeholder: 'Şirket adınızı girin'
      },
      {
        key: 'company_address',
        label: 'Şirket Adresi',
        type: 'STRING',
        placeholder: 'Şirket adresini girin'
      },
      {
        key: 'company_phone',
        label: 'Şirket Telefonu',
        type: 'STRING',
        placeholder: '+90 (xxx) xxx xx xx'
      },
      {
        key: 'company_email',
        label: 'Şirket E-posta',
        type: 'STRING',
        placeholder: 'info@sirket.com'
      },
      {
        key: 'app_language',
        label: 'Uygulama Dili',
        type: 'SELECT',
        options: [
          { value: 'tr', label: 'Türkçe' },
          { value: 'en', label: 'English' }
        ]
      },
      {
        key: 'app_timezone',
        label: 'Saat Dilimi',
        type: 'SELECT',
        options: [
          { value: 'Europe/Istanbul', label: 'İstanbul (GMT+3)' },
          { value: 'UTC', label: 'UTC (GMT+0)' }
        ]
      }
    ]
  },
  {
    title: 'Para Birimi ve Vergi',
    icon: DollarSign,
    description: 'Finansal işlemler için temel ayarlar',
    settings: [
      {
        key: 'default_currency',
        label: 'Ana Para Birimi',
        type: 'SELECT',
        options: [
          { value: 'TRY', label: 'Türk Lirası (₺)' },
          { value: 'USD', label: 'US Dollar ($)' },
          { value: 'EUR', label: 'Euro (€)' }
        ]
      },
      {
        key: 'currency_symbol',
        label: 'Para Birimi Sembolü',
        type: 'STRING',
        placeholder: '₺'
      },
      {
        key: 'default_tax_rate',
        label: 'Varsayılan KDV Oranı (%)',
        type: 'NUMBER',
        placeholder: '20'
      },
      {
        key: 'tax_calculation_method',
        label: 'KDV Hesaplama Yöntemi',
        type: 'SELECT',
        options: [
          { value: 'inclusive', label: 'KDV Dahil' },
          { value: 'exclusive', label: 'KDV Hariç' }
        ]
      }
    ]
  },
  {
    title: 'Maliyet ve Fiyatlandırma',
    icon: Calculator,
    description: 'Maliyet hesaplama ve fiyatlandırma ayarları',
    settings: [
      {
        key: 'default_profit_margin',
        label: 'Varsayılan Kar Marjı (%)',
        type: 'NUMBER',
        placeholder: '30'
      },
      {
        key: 'cost_calculation_method',
        label: 'Maliyet Hesaplama Yöntemi',
        type: 'SELECT',
        options: [
          { value: 'fifo', label: 'FIFO (İlk Giren İlk Çıkar)' },
          { value: 'lifo', label: 'LIFO (Son Giren İlk Çıkar)' },
          { value: 'average', label: 'Ağırlıklı Ortalama' }
        ]
      },
      {
        key: 'auto_update_recipe_costs',
        label: 'Reçete Maliyetlerini Otomatik Güncelle',
        description: 'Malzeme fiyatları değiştiğinde reçete maliyetleri otomatik güncellensin',
        type: 'BOOLEAN'
      }
    ]
  },
  {
    title: 'POS Entegrasyonu',
    icon: Database,
    description: 'POS sistemi bağlantı ayarları',
    settings: [
      {
        key: 'pos_api_url',
        label: 'POS API URL',
        type: 'STRING',
        placeholder: 'https://pos-integration.robotpos.com/realtimeapi/api/query'
      },
      {
        key: 'pos_api_token',
        label: 'POS API Token',
        type: 'STRING',
        placeholder: 'API anahtarınızı girin'
      },
      {
        key: 'pos_sync_query',
        label: 'POS Sorgusu',
        type: 'STRING',
        placeholder: 'SELECT ProductKey, StokKodu, StokAdi...'
      },
      {
        key: 'pos_auto_sync',
        label: 'Otomatik POS Senkronizasyonu',
        description: 'POS verileri günlük otomatik olarak senkronize edilsin',
        type: 'BOOLEAN'
      }
    ]
  },
  {
    title: 'Sistem Ayarları',
    icon: AlertTriangle,
    description: 'Sistem performansı ve uyarı ayarları',
    settings: [
      {
        key: 'low_stock_threshold',
        label: 'Düşük Stok Uyarı Eşiği',
        type: 'NUMBER',
        placeholder: '10'
      },
      {
        key: 'enable_stock_alerts',
        label: 'Stok Uyarılarını Etkinleştir',
        type: 'BOOLEAN'
      },
      {
        key: 'session_timeout_minutes',
        label: 'Oturum Zaman Aşımı (Dakika)',
        type: 'NUMBER',
        placeholder: '60'
      },
      {
        key: 'audit_log_retention_days',
        label: 'Denetim Kayıtları Saklama Süresi (Gün)',
        type: 'NUMBER',
        placeholder: '365'
      }
    ]
  }
];

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changedSettings, setChangedSettings] = useState<Set<string>>(new Set());

  // Load settings from database
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/settings');
      const data = await response.json();
      
      if (data.success) {
        const settingsMap: Record<string, string> = {};
        data.data.forEach((setting: Setting) => {
          settingsMap[setting.key] = setting.value;
        });
        setSettings(settingsMap);
        setChangedSettings(new Set());
      } else {
        notify.error('Ayarlar yüklenemedi');
      }
    } catch (error) {
      console.error('Settings load error:', error);
      notify.error('Ayarlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Save settings to database
  const saveSettings = async () => {
    if (changedSettings.size === 0) {
      notify.info('Kaydedilecek değişiklik yok');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare settings to save
      const settingsToSave = Array.from(changedSettings).map(key => {
        const settingDef = settingCategories
          .flatMap(cat => cat.settings)
          .find(s => s.key === key);
        
        return {
          key,
          value: settings[key] || '',
          type: settingDef?.type === 'SELECT' ? 'STRING' : settingDef?.type || 'STRING'
        };
      });

      const response = await fetchWithAuth('/api/settings/bulk', {
        method: 'POST',
        body: JSON.stringify({ settings: settingsToSave })
      });

      const data = await response.json();
      
      if (data.success) {
        notify.success(`${changedSettings.size} ayar başarıyla kaydedildi`);
        setChangedSettings(new Set());
      } else {
        notify.error(data.error || 'Ayarlar kaydedilemedi');
      }
    } catch (error) {
      console.error('Settings save error:', error);
      notify.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Handle setting value change
  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setChangedSettings(prev => new Set([...prev, key]));
  };

  // Render setting input based on type
  const renderSettingInput = (settingDef: SettingCategory['settings'][0]) => {
    const value = settings[settingDef.key] || '';
    
    switch (settingDef.type) {
      case 'BOOLEAN':
        return (
          <Switch
            checked={value === 'true'}
            onCheckedChange={(checked) => handleSettingChange(settingDef.key, checked.toString())}
          />
        );
      
      case 'SELECT':
        return (
          <Select 
            value={value} 
            onValueChange={(newValue) => handleSettingChange(settingDef.key, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seçin..." />
            </SelectTrigger>
            <SelectContent>
              {settingDef.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'NUMBER':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(settingDef.key, e.target.value)}
            placeholder={settingDef.placeholder}
          />
        );
      
      default: // STRING
        return settingDef.key.includes('query') || settingDef.key.includes('address') ? (
          <Textarea
            value={value}
            onChange={(e) => handleSettingChange(settingDef.key, e.target.value)}
            placeholder={settingDef.placeholder}
            rows={3}
          />
        ) : (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(settingDef.key, e.target.value)}
            placeholder={settingDef.placeholder}
          />
        );
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ayarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Settings className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Genel Ayarlar</h1>
            <p className="text-muted-foreground">Sistem genelinde kullanılan temel ayarları düzenleyin</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadSettings}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          
          <Button 
            onClick={saveSettings}
            disabled={saving || changedSettings.size === 0}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Kaydediliyor...' : `Kaydet ${changedSettings.size > 0 ? `(${changedSettings.size})` : ''}`}
          </Button>
        </div>
      </div>

      {/* Changed Settings Info */}
      {changedSettings.size > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {changedSettings.size} ayarda değişiklik yapıldı. Kaydetmeyi unutmayın!
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Categories */}
      <div className="space-y-6">
        {settingCategories.map((category, categoryIndex) => {
          const CategoryIcon = category.icon;
          
          return (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CategoryIcon className="w-5 h-5 text-blue-600" />
                  {category.title}
                </CardTitle>
                {category.description && (
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.settings.map((settingDef, settingIndex) => {
                    const isChanged = changedSettings.has(settingDef.key);
                    
                    return (
                      <div 
                        key={settingIndex}
                        className={`space-y-2 p-3 rounded-lg border transition-colors ${
                          isChanged ? 'border-orange-200 bg-orange-50' : 'border-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Label 
                            htmlFor={settingDef.key}
                            className={`font-medium ${isChanged ? 'text-orange-700' : ''}`}
                          >
                            {settingDef.label}
                            {isChanged && <span className="ml-1 text-orange-500">•</span>}
                          </Label>
                          {settingDef.type === 'BOOLEAN' && (
                            <div className="flex items-center gap-2">
                              {renderSettingInput(settingDef)}
                            </div>
                          )}
                        </div>
                        
                        {settingDef.description && (
                          <p className="text-xs text-muted-foreground">{settingDef.description}</p>
                        )}
                        
                        {settingDef.type !== 'BOOLEAN' && (
                          <div className="w-full">
                            {renderSettingInput(settingDef)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-center pt-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Ayarlar otomatik olarak kaydedilmez</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Değişiklikleri kalıcı hale getirmek için "Kaydet" butonunu kullanın
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}