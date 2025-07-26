import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Tag, 
  Layers, 
  ShoppingBag, 
  Download,
  Server,
  Database,
  Zap,
  TrendingUp,
  Package,
  Plus,
  Edit,
  Minus
} from 'lucide-react';

interface SyncPreview {
  categories: Array<{
    name: string;
    action: 'create' | 'update' | 'skip';
  }>;
  groups: Array<{
    name: string;
    categoryName: string;
    action: 'create' | 'update' | 'skip';
  }>;
  items: Array<{
    name: string;
    code: string;
    categoryName: string;
    groupName?: string;
    action: 'create' | 'update' | 'skip';
  }>;
}

interface POSSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncLoading: boolean;
  connectionStatus: 'checking' | 'connected' | 'error';
  syncPreview: SyncPreview | null;
  onSync: () => void;
}

export const POSSyncModal = ({
  isOpen,
  onClose,
  syncLoading,
  connectionStatus,
  syncPreview,
  onSync
}: POSSyncModalProps) => {
  const handleClose = () => {
    if (!syncLoading) {
      onClose();
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5 animate-pulse" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            POS Sistemi Senkronizasyonu
          </DialogTitle>
          <DialogDescription className="text-base">
            POS sisteminden alınan veriler önizleme aşamasında. Değişiklikleri gözden geçirin ve onaylayın.
          </DialogDescription>
        </DialogHeader>

        {syncLoading ? (
          <div className="flex items-center justify-center py-12">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                    <Server className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">POS Bağlantısı Kontrol Ediliyor</h3>
                    <p className="text-muted-foreground text-sm">Veriler yükleniyor ve analiz ediliyor...</p>
                    <Progress value={undefined} className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connection Status Card */}
            <Card className={`border-2 ${getConnectionStatusColor()}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  {getConnectionStatusIcon()}
                  <span>POS Bağlantı Durumu</span>
                  <div className="ml-auto flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-normal">
                      {connectionStatus === 'checking' && 'Kontrol Ediliyor...'}
                      {connectionStatus === 'connected' && 'Başarıyla Bağlandı'}
                      {connectionStatus === 'error' && 'Bağlantı Başarısız'}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {syncPreview && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Tag className="w-4 h-4" />
                        KATEGORİLER
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{syncPreview.categories.length}</div>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-green-600">
                          <Plus className="w-3 h-3" />
                          {syncPreview.categories.filter(c => c.action === 'create').length} yeni
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Edit className="w-3 h-3" />
                          {syncPreview.categories.filter(c => c.action === 'update').length} güncelleme
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Layers className="w-4 h-4" />
                        GRUPLAR
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{syncPreview.groups.length}</div>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-green-600">
                          <Plus className="w-3 h-3" />
                          {syncPreview.groups.filter(g => g.action === 'create').length} yeni
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Edit className="w-3 h-3" />
                          {syncPreview.groups.filter(g => g.action === 'update').length} güncelleme
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <ShoppingBag className="w-4 h-4" />
                        SATIŞ MALLARI
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{syncPreview.items.length}</div>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-green-600">
                          <Plus className="w-3 h-3" />
                          {syncPreview.items.filter(i => i.action === 'create').length} yeni
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Edit className="w-3 h-3" />
                          {syncPreview.items.filter(i => i.action === 'update').length} güncelleme
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Categories Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-blue-500" />
                      Kategoriler ({syncPreview.categories.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {syncPreview.categories.map((cat, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {cat.action === 'create' && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <Plus className="w-3 h-3 mr-1" />
                                Yeni
                              </Badge>
                            )}
                            {cat.action === 'update' && (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                <Edit className="w-3 h-3 mr-1" />
                                Güncelle
                              </Badge>
                            )}
                            {cat.action === 'skip' && (
                              <Badge variant="outline">
                                <Minus className="w-3 h-3 mr-1" />
                                Değişiklik Yok
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Groups Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-500" />
                      Gruplar ({syncPreview.groups.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {syncPreview.groups.map((group, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <div>
                              <span className="font-medium">{group.name}</span>
                              <div className="text-sm text-muted-foreground">Kategori: {group.categoryName}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {group.action === 'create' && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <Plus className="w-3 h-3 mr-1" />
                                Yeni
                              </Badge>
                            )}
                            {group.action === 'update' && (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                <Edit className="w-3 h-3 mr-1" />
                                Güncelle
                              </Badge>
                            )}
                            {group.action === 'skip' && (
                              <Badge variant="outline">
                                <Minus className="w-3 h-3 mr-1" />
                                Değişiklik Yok
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Items Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-orange-500" />
                      Satış Malları ({syncPreview.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {syncPreview.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.name}</span>
                                <Badge variant="outline" className="text-xs px-2 py-0">{item.code}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  {item.categoryName}
                                </span>
                                {item.groupName && (
                                  <span className="inline-flex items-center gap-1 ml-2">
                                    <Layers className="w-3 h-3" />
                                    {item.groupName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.action === 'create' && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <Plus className="w-3 h-3 mr-1" />
                                Yeni
                              </Badge>
                            )}
                            {item.action === 'update' && (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                <Edit className="w-3 h-3 mr-1" />
                                Güncelle
                              </Badge>
                            )}
                            {item.action === 'skip' && (
                              <Badge variant="outline">
                                <Minus className="w-3 h-3 mr-1" />
                                Değişiklik Yok
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Final Summary */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <TrendingUp className="w-5 h-5" />
                      Senkronizasyon Özeti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-green-700 flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Yeni Ekleme
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Kategoriler:</span>
                            <span className="font-medium">{syncPreview.categories.filter(c => c.action === 'create').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gruplar:</span>
                            <span className="font-medium">{syncPreview.groups.filter(g => g.action === 'create').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Satış Malları:</span>
                            <span className="font-medium">{syncPreview.items.filter(i => i.action === 'create').length}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium text-yellow-700 flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Güncelleme
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Kategoriler:</span>
                            <span className="font-medium">{syncPreview.categories.filter(c => c.action === 'update').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gruplar:</span>
                            <span className="font-medium">{syncPreview.groups.filter(g => g.action === 'update').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Satış Malları:</span>
                            <span className="font-medium">{syncPreview.items.filter(i => i.action === 'update').length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Toplam <span className="font-medium text-blue-600">
                          {syncPreview.categories.filter(c => c.action !== 'skip').length + 
                           syncPreview.groups.filter(g => g.action !== 'skip').length + 
                           syncPreview.items.filter(i => i.action !== 'skip').length}
                        </span> değişiklik yapılacak
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {syncPreview && (
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {syncPreview.categories.length + syncPreview.groups.length + syncPreview.items.length} öğe hazır
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={syncLoading}
                  className="px-6"
                >
                  İptal
                </Button>
                {syncPreview && connectionStatus === 'connected' && (
                  <Button 
                    onClick={onSync}
                    disabled={syncLoading}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-6"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {syncLoading ? 'Senkronize Ediliyor...' : 'Senkronizasyonu Başlat'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};