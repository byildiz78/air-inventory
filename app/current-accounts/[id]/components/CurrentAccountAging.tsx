'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

interface CurrentAccountAgingProps {
  aging: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
  };
}

export function CurrentAccountAging({ aging }: CurrentAccountAgingProps) {
  const total = aging.current + aging.days30 + aging.days60 + aging.days90;
  
  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Borç Yaşlandırma Analizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Borç bulunmuyor</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPercentage = (amount: number) => (amount / total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Borç Yaşlandırma Analizi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₺{aging.current.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">0-30 Gün</div>
              <Progress value={getPercentage(aging.current)} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                ₺{aging.days30.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">31-60 Gün</div>
              <Progress value={getPercentage(aging.days30)} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ₺{aging.days60.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">61-90 Gün</div>
              <Progress value={getPercentage(aging.days60)} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                ₺{aging.days90.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">90+ Gün</div>
              <Progress value={getPercentage(aging.days90)} className="mt-2" />
            </div>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Toplam Borç:</span>
            </div>
            <div className="text-xl font-bold">₺{total.toLocaleString()}</div>
          </div>
          
          {(aging.days30 + aging.days60 + aging.days90) > 0 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-orange-700">
                Vadesi geçen toplam borç: ₺{(aging.days30 + aging.days60 + aging.days90).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}