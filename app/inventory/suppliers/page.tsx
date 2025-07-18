'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tedarikçiler</h1>
          <p className="text-muted-foreground">
            Tedarikçi yönetimi artık Cari Yönetimi modülüne taşındı
          </p>
        </div>
      </div>

      <Card className="border-orange-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl">Tedarikçi Yönetimi Değişti</CardTitle>
          <CardDescription className="text-base">
            Sistem güncellendi ve tedarikçi yönetimi artık Cari Yönetimi modülü altında birleştirildi.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-700">
              <strong>Neden değişti?</strong><br />
              Tedarikçiler ve cari hesaplar aslında aynı işlevi görüyor. Bu değişiklik ile:
            </p>
            <ul className="text-sm text-orange-700 mt-2 space-y-1">
              <li>• Daha basit ve anlaşılır sistem</li>
              <li>• Tekrar eden veriler ortadan kalktı</li>
              <li>• Fatura ve ödeme işlemleri daha kolay</li>
            </ul>
          </div>
          
          <div className="pt-4">
            <Link href="/current-accounts">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                Cari Yönetimi'ne Git
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}