'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  ChefHat,
  Package,
  TrendingUp,
  DollarSign,
  Warehouse,
  ArrowRightLeft
} from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Raporlar</h1>
            <p className="text-muted-foreground">Kapsamlı analiz ve raporlama araçları</p>
          </div>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Excel'e Aktar
          </Button>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/reports/inventory">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle>Stok Raporları</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Mevcut stok durumu, stok hareketleri ve stok değeri analizleri
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Stok Seviyesi</Badge>
                  <Badge variant="outline">Stok Değeri</Badge>
                  <Badge variant="outline">Stok Hareketleri</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports/recipes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-green-600" />
                  </div>
                  <CardTitle>Reçete Analizleri</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Reçete kullanım sıklığı, maliyet değişimleri ve karlılık analizleri
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Kullanım Sıklığı</Badge>
                  <Badge variant="outline">Maliyet Değişimi</Badge>
                  <Badge variant="outline">Karlılık</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports/financial">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <CardTitle>Finansal Raporlar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Gelir-gider analizi, kar marjı raporları ve maliyet dağılımları
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Gelir-Gider</Badge>
                  <Badge variant="outline">Kar Marjı</Badge>
                  <Badge variant="outline">Maliyet Dağılımı</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Raporlar</CardTitle>
            <CardDescription>
              Sık kullanılan raporlara hızlı erişim
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/reports/inventory/current-stock">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center justify-center gap-2">
                  <Package className="w-8 h-8 text-blue-600" />
                  <span>Mevcut Stok Raporu</span>
                </Button>
              </Link>
              
              <Link href="/reports/inventory/movements">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center justify-center gap-2">
                  <ArrowRightLeft className="w-8 h-8 text-green-600" />
                  <span>Stok Hareketleri</span>
                </Button>
              </Link>
              
              <Link href="/reports/recipes/usage">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center justify-center gap-2">
                  <ChefHat className="w-8 h-8 text-orange-600" />
                  <span>Reçete Kullanım Analizi</span>
                </Button>
              </Link>
              
              <Link href="/reports/financial/profit">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center justify-center gap-2">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                  <span>Karlılık Raporu</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}