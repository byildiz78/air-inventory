'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Import refactored components
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { StockAlerts } from '@/components/dashboard/StockAlerts';
import { CostTrendsChart } from '@/components/dashboard/CostTrendsChart';
import { PendingInvoices } from '@/components/dashboard/PendingInvoices';
import { SalesAnalytics } from '@/components/dashboard/SalesAnalytics';
import { RecentStockMovements } from '@/components/dashboard/RecentStockMovements';
import { FinancialAnalysis } from '@/components/dashboard/FinancialAnalysis';

// Import hooks
import { useDashboardData } from '@/hooks/useDashboardData';
// MainLayout is provided by the dashboard layout file

export default function Dashboard() {
  const { 
    stats, 
    stockAlerts, 
    costTrends, 
    stockMovements, 
    loading, 
    error, 
    refetch 
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Dashboard verileri yüklenirken hata oluştu: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Stats Cards */}
          {stats && <DashboardStats stats={stats} loading={loading} />}

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="sales">Satışlar</TabsTrigger>
              <TabsTrigger value="inventory">Stok Durumu</TabsTrigger>
              <TabsTrigger value="finance">Finansal</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Stock Alerts */}
                <StockAlerts 
                  alerts={stockAlerts} 
                  loading={loading}
                  maxItems={5}
                  showViewAllButton={true}
                />

                {/* Pending Invoices */}
                <PendingInvoices 
                  maxItems={5}
                  showViewAllButton={true}
                />
              </div>

              {/* Cost Trends Chart */}
              <CostTrendsChart 
                data={costTrends}
                loading={loading}
              />

              {/* Quick Stats */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white rounded-lg border text-center">
                    <div className="text-2xl font-bold">{stats.totalMaterials}</div>
                    <div className="text-sm text-muted-foreground">Toplam Malzeme</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border text-center">
                    <div className="text-2xl font-bold">{stats.totalRecipes}</div>
                    <div className="text-sm text-muted-foreground">Toplam Reçete</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border text-center">
                    <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                    <div className="text-sm text-muted-foreground">Toplam Fatura</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border text-center">
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <div className="text-sm text-muted-foreground">Toplam Kullanıcı</div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <SalesAnalytics timeRange="week" />
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              {/* Stock Status - Full view */}
              <StockAlerts 
                alerts={stockAlerts} 
                loading={loading}
                maxItems={20}
                showViewAllButton={false}
              />

              {/* Recent Stock Movements */}
              <RecentStockMovements 
                maxItems={15}
                showViewAllButton={true}
              />
            </TabsContent>

            <TabsContent value="finance" className="space-y-4">
              <FinancialAnalysis timeRange="month" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}