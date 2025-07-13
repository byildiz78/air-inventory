'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Scale, 
  Plus, 
  Edit,
  Trash2,
  ArrowRightLeft,
  Calculator
} from 'lucide-react';
import { 
  unitService 
} from '@/lib/data-service';
import { 
  MockUnit 
} from '@/lib/mock-data';

export default function UnitsPage() {
  const [units, setUnits] = useState<MockUnit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<MockUnit | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    type: 'WEIGHT' as MockUnit['type'],
    isBaseUnit: false,
    baseUnitId: '',
    conversionFactor: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const unitsData = await unitService.getAll();
      setUnits(unitsData);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      abbreviation: '',
      type: 'WEIGHT',
      isBaseUnit: false,
      baseUnitId: '',
      conversionFactor: 1
    });
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const processedData = {
        ...formData,
        baseUnitId: formData.isBaseUnit ? undefined : formData.baseUnitId,
        conversionFactor: formData.isBaseUnit ? 1 : formData.conversionFactor
      };
      // await unitService.create(processedData);
      await loadData();
      setIsAddUnitOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding unit:', error);
    }
  };

  const handleEditUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    
    try {
      const processedData = {
        ...formData,
        baseUnitId: formData.isBaseUnit ? undefined : formData.baseUnitId,
        conversionFactor: formData.isBaseUnit ? 1 : formData.conversionFactor
      };
      // await unitService.update(editingUnit.id, processedData);
      await loadData();
      setEditingUnit(null);
      resetForm();
    } catch (error) {
      console.error('Error updating unit:', error);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (confirm('Bu birimi silmek istediğinizden emin misiniz?')) {
      try {
        // await unitService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting unit:', error);
      }
    }
  };

  const openEditDialog = (unit: MockUnit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      abbreviation: unit.abbreviation,
      type: unit.type,
      isBaseUnit: unit.isBaseUnit,
      baseUnitId: unit.baseUnitId || '',
      conversionFactor: unit.conversionFactor
    });
  };

  const closeEditDialog = () => {
    setEditingUnit(null);
    resetForm();
  };

  const getBaseUnits = () => units.filter(u => u.isBaseUnit);
  const getBaseUnitsForType = (type: MockUnit['type']) => 
    units.filter(u => u.isBaseUnit && u.type === type);
  const getDerivedUnits = (baseUnitId: string) => 
    units.filter(u => u.baseUnitId === baseUnitId);

  const getUnitTypeText = (type: MockUnit['type']) => {
    switch (type) {
      case 'WEIGHT': return 'Ağırlık';
      case 'VOLUME': return 'Hacim';
      case 'PIECE': return 'Adet';
      case 'LENGTH': return 'Uzunluk';
      default: return type;
    }
  };

  const getUnitTypeColor = (type: MockUnit['type']) => {
    switch (type) {
      case 'WEIGHT': return 'bg-blue-500';
      case 'VOLUME': return 'bg-green-500';
      case 'PIECE': return 'bg-orange-500';
      case 'LENGTH': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Birimler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Birim Yönetimi</h1>
            <p className="text-muted-foreground">Satın alma ve tüketim birimlerini yönetin</p>
          </div>
          
          <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Birim
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Birim Ekle</DialogTitle>
                <DialogDescription>
                  Yeni ölçü birimi tanımlayın
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUnit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Birim Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Örn: Kilogram"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="abbreviation">Kısaltma *</Label>
                    <Input
                      id="abbreviation"
                      value={formData.abbreviation}
                      onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value }))}
                      placeholder="Örn: kg"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="type">Birim Tipi *</Label>
                  <Select value={formData.type} onValueChange={(value: MockUnit['type']) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Birim tipi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEIGHT">Ağırlık</SelectItem>
                      <SelectItem value="VOLUME">Hacim</SelectItem>
                      <SelectItem value="PIECE">Adet</SelectItem>
                      <SelectItem value="LENGTH">Uzunluk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isBaseUnit"
                    checked={formData.isBaseUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, isBaseUnit: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isBaseUnit">Bu bir temel birim mi?</Label>
                </div>

                {!formData.isBaseUnit && (
                  <>
                    <div>
                      <Label htmlFor="baseUnit">Temel Birim</Label>
                      <Select value={formData.baseUnitId} onValueChange={(value) => setFormData(prev => ({ ...prev, baseUnitId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Temel birim seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Temel birim seçin</SelectItem>
                          {getBaseUnitsForType(formData.type).map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name} ({unit.abbreviation})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="conversionFactor">Çevrim Katsayısı</Label>
                      <Input
                        id="conversionFactor"
                        type="number"
                        step="0.001"
                        value={formData.conversionFactor}
                        onChange={(e) => setFormData(prev => ({ ...prev, conversionFactor: parseFloat(e.target.value) || 1 }))}
                        placeholder="1.0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        1 {formData.abbreviation} = {formData.conversionFactor} temel birim
                      </p>
                    </div>
                  </>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    Birim Ekle
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddUnitOpen(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Birim</CardTitle>
              <Scale className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{units.length}</div>
              <p className="text-xs text-muted-foreground">Tanımlı birim sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temel Birimler</CardTitle>
              <Calculator className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getBaseUnits().length}</div>
              <p className="text-xs text-muted-foreground">Ana ölçü birimleri</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Türetilmiş Birimler</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{units.filter(u => !u.isBaseUnit).length}</div>
              <p className="text-xs text-muted-foreground">Çevrim katsayılı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Birim Tipleri</CardTitle>
              <Scale className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(units.map(u => u.type)).size}</div>
              <p className="text-xs text-muted-foreground">Farklı tip sayısı</p>
            </CardContent>
          </Card>
        </div>

        {/* Units by Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(['WEIGHT', 'VOLUME', 'PIECE', 'LENGTH'] as MockUnit['type'][]).map(type => {
            const typeUnits = units.filter(u => u.type === type);
            const baseUnits = typeUnits.filter(u => u.isBaseUnit);
            
            return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${getUnitTypeColor(type)}`} />
                    {getUnitTypeText(type)} Birimleri
                  </CardTitle>
                  <CardDescription>
                    {typeUnits.length} birim tanımlı
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {baseUnits.map(baseUnit => {
                      const derivedUnits = getDerivedUnits(baseUnit.id);
                      
                      return (
                        <div key={baseUnit.id} className="space-y-2">
                          {/* Base Unit */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="default">Temel</Badge>
                              <div>
                                <h4 className="font-medium">{baseUnit.name}</h4>
                                <p className="text-sm text-muted-foreground">{baseUnit.abbreviation}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditDialog(baseUnit)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteUnit(baseUnit.id)}
                                disabled={derivedUnits.length > 0}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Derived Units */}
                          {derivedUnits.map(unit => (
                            <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg ml-6">
                              <div className="flex items-center gap-3">
                                <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <h4 className="font-medium">{unit.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    1 {unit.abbreviation} = {unit.conversionFactor} {baseUnit.abbreviation}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openEditDialog(unit)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteUnit(unit.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Edit Unit Dialog */}
        <Dialog open={!!editingUnit} onOpenChange={closeEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Birim Düzenle</DialogTitle>
              <DialogDescription>
                Birim bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUnit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Birim Adı *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Örn: Kilogram"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-abbreviation">Kısaltma *</Label>
                  <Input
                    id="edit-abbreviation"
                    value={formData.abbreviation}
                    onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value }))}
                    placeholder="Örn: kg"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-type">Birim Tipi *</Label>
                <Select value={formData.type} onValueChange={(value: MockUnit['type']) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Birim tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEIGHT">Ağırlık</SelectItem>
                    <SelectItem value="VOLUME">Hacim</SelectItem>
                    <SelectItem value="PIECE">Adet</SelectItem>
                    <SelectItem value="LENGTH">Uzunluk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isBaseUnit"
                  checked={formData.isBaseUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, isBaseUnit: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-isBaseUnit">Bu bir temel birim mi?</Label>
              </div>

              {!formData.isBaseUnit && (
                <>
                  <div>
                    <Label htmlFor="edit-baseUnit">Temel Birim</Label>
                    <Select value={formData.baseUnitId} onValueChange={(value) => setFormData(prev => ({ ...prev, baseUnitId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Temel birim seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {getBaseUnitsForType(formData.type).map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-conversionFactor">Çevrim Katsayısı</Label>
                    <Input
                      id="edit-conversionFactor"
                      type="number"
                      step="0.001"
                      value={formData.conversionFactor}
                      onChange={(e) => setFormData(prev => ({ ...prev, conversionFactor: parseFloat(e.target.value) || 1 }))}
                      placeholder="1.0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      1 {formData.abbreviation} = {formData.conversionFactor} temel birim
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Güncelle
                </Button>
                <Button type="button" variant="outline" onClick={closeEditDialog}>
                  İptal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}