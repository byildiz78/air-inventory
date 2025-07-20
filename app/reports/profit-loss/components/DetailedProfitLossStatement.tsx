'use client';

import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DetailedProfitLossStatementProps {
  data: any;
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
}

export function DetailedProfitLossStatement({ data, formatCurrency, formatPercentage }: DetailedProfitLossStatementProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async () => {
    if (!reportRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      // Create canvas from the report element
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions
      const imgWidth = 190; // A4 width minus margins
      const pageHeight = 277; // A4 height minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10; // Top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      const fileName = `kar-zarar-raporu-${data.period.startDate}-${data.period.endDate}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button 
          onClick={generatePDF} 
          disabled={isGeneratingPDF}
          className="bg-red-600 hover:bg-red-700"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              PDF Oluşturuluyor...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              PDF İndir
            </>
          )}
        </Button>
      </div>
      
      <Card className="w-full bg-white" ref={reportRef}>
      <CardHeader className="text-center border-b print:border-gray-300">
        <CardTitle className="text-2xl">KAR/ZARAR TABLOSU (DETAYLI)</CardTitle>
        <p className="text-sm text-muted-foreground">
          {new Date(data.period.startDate).toLocaleDateString('tr-TR')} - {new Date(data.period.endDate).toLocaleDateString('tr-TR')}
        </p>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* REVENUE SECTION */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">I. GELİRLER</h3>
              <span className="text-lg font-bold">{formatCurrency(data.revenue.totalRevenue)}</span>
            </div>
            <div className="ml-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>A. Satış Faturaları</span>
                <span>{formatCurrency(data.revenue.salesInvoices)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>B. Ürün Satışları</span>
                <span>{formatCurrency(data.revenue.serviceRevenue)}</span>
              </div>
              {data.revenue.otherRevenue > 0 && (
                <div className="flex justify-between text-sm">
                  <span>C. Diğer Gelirler</span>
                  <span>{formatCurrency(data.revenue.otherRevenue)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* COGS SECTION */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">II. SATILAN MALIN MALİYETİ</h3>
              <span className="text-lg font-bold">({formatCurrency(data.cogs.totalCOGS)})</span>
            </div>
            <div className="ml-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>A. Malzeme Tüketimi</span>
                <span>({formatCurrency(data.cogs.materialConsumption)})</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* GROSS PROFIT */}
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">III. BRÜT KAR</h3>
                <Badge variant={data.grossProfit.percentage >= 30 ? "default" : "destructive"}>
                  %{formatPercentage(data.grossProfit.percentage)}
                </Badge>
              </div>
              <span className="text-lg font-bold">{formatCurrency(data.grossProfit.amount)}</span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* OPERATING EXPENSES */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">IV. İŞLETME GİDERLERİ</h3>
              <span className="text-lg font-bold">({formatCurrency(data.operatingExpenses.totalExpenses)})</span>
            </div>
            
            {data.operatingExpenses.detailedBreakdown ? (
              <div className="space-y-4">
                {data.operatingExpenses.detailedBreakdown.map((mainCat: any, index: number) => (
                  <div key={index} className="ml-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{String.fromCharCode(65 + index)}. {mainCat.mainCategory}</span>
                        <Badge variant="outline" className="text-xs">
                          %{formatPercentage(mainCat.percentage)}
                        </Badge>
                      </div>
                      <span className="font-semibold">({formatCurrency(mainCat.amount)})</span>
                    </div>
                    
                    <div className="ml-4 space-y-1">
                      {mainCat.subCategories.map((subCat: any, subIndex: number) => (
                        <div key={subIndex}>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{subIndex + 1}. {subCat.name}</span>
                            <span>({formatCurrency(subCat.amount)})</span>
                          </div>
                          
                          {/* Show items only if there are few of them */}
                          {subCat.items.length <= 3 && (
                            <div className="ml-4 space-y-0.5">
                              {subCat.items.map((item: any, itemIndex: number) => (
                                <div key={itemIndex} className="flex justify-between text-xs text-muted-foreground">
                                  <span className="italic">- {item.name}</span>
                                  <span>{formatCurrency(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ml-4 space-y-2">
                {data.operatingExpenses.breakdown.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{String.fromCharCode(65 + index)}. {item.category}</span>
                    <span>({formatCurrency(item.amount)})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* NET PROFIT */}
          <div className={`p-4 rounded ${data.netProfit.amount >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">V. NET KAR/ZARAR</h3>
                <Badge variant={data.netProfit.amount >= 0 ? "default" : "destructive"}>
                  %{formatPercentage(data.netProfit.percentage)}
                </Badge>
              </div>
              <span className={`text-lg font-bold ${data.netProfit.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.netProfit.amount)}
              </span>
            </div>
          </div>

          {/* SUMMARY TABLE */}
          <div className="mt-8 border rounded">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">ÖZET</th>
                  <th className="text-right p-3">Tutar (₺)</th>
                  <th className="text-right p-3">Oran (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">Toplam Gelir</td>
                  <td className="p-3 text-right">{formatCurrency(data.revenue.totalRevenue)}</td>
                  <td className="p-3 text-right">100.0%</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">Satılan Malın Maliyeti</td>
                  <td className="p-3 text-right">({formatCurrency(data.cogs.totalCOGS)})</td>
                  <td className="p-3 text-right">
                    {data.revenue.totalRevenue > 0 ? 
                      formatPercentage((data.cogs.totalCOGS / data.revenue.totalRevenue) * 100) : '0.0'}%
                  </td>
                </tr>
                <tr className="border-t font-semibold">
                  <td className="p-3">Brüt Kar</td>
                  <td className="p-3 text-right">{formatCurrency(data.grossProfit.amount)}</td>
                  <td className="p-3 text-right">{formatPercentage(data.grossProfit.percentage)}%</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">İşletme Giderleri</td>
                  <td className="p-3 text-right">({formatCurrency(data.operatingExpenses.totalExpenses)})</td>
                  <td className="p-3 text-right">
                    {data.revenue.totalRevenue > 0 ? 
                      formatPercentage((data.operatingExpenses.totalExpenses / data.revenue.totalRevenue) * 100) : '0.0'}%
                  </td>
                </tr>
                <tr className="border-t font-bold bg-gray-50">
                  <td className="p-3">Net Kar/Zarar</td>
                  <td className={`p-3 text-right ${data.netProfit.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.netProfit.amount)}
                  </td>
                  <td className="p-3 text-right">{formatPercentage(data.netProfit.percentage)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* KEY METRICS */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Food Cost %</p>
                <p className="text-2xl font-bold">
                  {data.revenue.totalRevenue > 0 ? 
                    formatPercentage((data.cogs.totalCOGS / data.revenue.totalRevenue) * 100) : '0.0'}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Labor Cost %</p>
                <p className="text-2xl font-bold">
                  {data.revenue.totalRevenue > 0 && data.operatingExpenses.salaries ? 
                    formatPercentage((data.operatingExpenses.salaries / data.revenue.totalRevenue) * 100) : '0.0'}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Prime Cost %</p>
                <p className="text-2xl font-bold">
                  {data.revenue.totalRevenue > 0 ? 
                    formatPercentage(((data.cogs.totalCOGS + (data.operatingExpenses.salaries || 0)) / data.revenue.totalRevenue) * 100) : '0.0'}%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}