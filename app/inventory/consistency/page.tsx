'use client';

import { StockConsistencyPanel } from '@/components/inventory/StockConsistencyPanel';

export default function StockConsistencyPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Stok Tutarlılığı</h1>
          <p className="text-muted-foreground">
            Sistem stokları ile depo stokları arasındaki tutarlılığı kontrol edin ve düzeltin
          </p>
        </div>

        {/* Main Panel */}
        <StockConsistencyPanel />
      </div>
    </div>
  );
}