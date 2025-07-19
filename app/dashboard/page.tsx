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
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-3">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg h-auto">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-base py-3 px-4 rounded-md transition-all duration-200 hover:bg-gray-200 data-[state=active]:hover:bg-blue-600"
                >
                  <div className="flex items-center justify-center gap-2 w-full">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Genel Bakış</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="sales" 
                  className="data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-base py-3 px-4 rounded-md transition-all duration-200 hover:bg-gray-200 data-[state=active]:hover:bg-green-600"
                >
                  <div className="flex items-center justify-center gap-2 w-full">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Satışlar</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="inventory" 
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-base py-3 px-4 rounded-md transition-all duration-200 hover:bg-gray-200 data-[state=active]:hover:bg-orange-600"
                >
                  <div className="flex items-center justify-center gap-2 w-full">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Stok Durumu</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="finance" 
                  className="data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-base py-3 px-4 rounded-md transition-all duration-200 hover:bg-gray-200 data-[state=active]:hover:bg-purple-600"
                >
                  <div className="flex items-center justify-center gap-2 w-full">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Finansal</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

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