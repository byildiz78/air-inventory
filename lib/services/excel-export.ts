import * as XLSX from 'xlsx';
import { notify } from '@/lib/notifications';

interface SalesItem {
  id: string;
  name: string;
  menuCode?: string;
  description?: string;
  basePrice?: number;
  taxPercent?: number;
  categoryId: string;
  groupId?: string;
  isActive: boolean;
  isAvailable: boolean;
  externalSystem?: string;
}

interface Category {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  categoryId: string;
}

interface ExportData {
  items: SalesItem[];
  categories: Category[];
  groups: Group[];
  mappings: any[];
  filters: {
    searchTerm: string;
    selectedCategory: string;
    selectedGroup: string;
  };
}

export const exportSalesItemsToExcel = (data: ExportData) => {
  try {
    const { items, categories, groups, mappings, filters } = data;
    
    // Prepare the data for Excel
    const excelData = items.map((item, index) => {
      const category = categories.find(c => c.id === item.categoryId);
      const group = groups.find(g => g.id === item.groupId);
      const itemMappings = mappings.filter(mapping => mapping.salesItemId === item.id);
      
      return {
        'Sıra No': index + 1,
        'Ürün Adı': item.name,
        'Menü Kodu': item.menuCode || '-',
        'Kategori': category?.name || '-',
        'Grup': group?.name || '-',
        'Açıklama': item.description || '-',
        'Temel Fiyat': item.basePrice ? `${item.basePrice} ₺` : '-',
        'KDV Oranı': item.taxPercent ? `%${item.taxPercent}` : '-',
        'Durum': item.isActive ? 'Aktif' : 'Pasif',
        'Satış Durumu': item.isAvailable ? 'Satışta' : 'Satışta Değil',
        'Reçete Sayısı': itemMappings.length,
        'Sistem': item.externalSystem === 'POS' ? 'POS' : 'Manuel'
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 8 },   // Sıra No
      { wch: 25 },  // Ürün Adı
      { wch: 12 },  // Menü Kodu
      { wch: 18 },  // Kategori
      { wch: 18 },  // Grup
      { wch: 30 },  // Açıklama
      { wch: 12 },  // Temel Fiyat
      { wch: 10 },  // KDV Oranı
      { wch: 8 },   // Durum
      { wch: 12 },  // Satış Durumu
      { wch: 12 },  // Reçete Sayısı
      { wch: 8 }    // Sistem
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Satış Malları');

    // Create header with filter information
    const filterInfo = [];
    filterInfo.push(['Satış Malları Raporu', '', '', '', '', '', '', '', '', '', '', '']);
    filterInfo.push(['Oluşturma Tarihi:', new Date().toLocaleDateString('tr-TR'), '', '', '', '', '', '', '', '', '', '']);
    filterInfo.push(['', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Add filter information
    filterInfo.push(['Uygulanan Filtreler:', '', '', '', '', '', '', '', '', '', '', '']);
    if (filters.searchTerm) {
      filterInfo.push(['- Arama Terimi:', filters.searchTerm, '', '', '', '', '', '', '', '', '', '']);
    }
    if (filters.selectedCategory !== 'all') {
      const categoryName = categories.find(c => c.id === filters.selectedCategory)?.name || 'Bilinmeyen';
      filterInfo.push(['- Kategori:', categoryName, '', '', '', '', '', '', '', '', '', '']);
    }
    if (filters.selectedGroup !== 'all') {
      const groupName = groups.find(g => g.id === filters.selectedGroup)?.name || 'Bilinmeyen';
      filterInfo.push(['- Grup:', groupName, '', '', '', '', '', '', '', '', '', '']);
    }
    filterInfo.push(['- Toplam Kayıt:', items.length.toString(), '', '', '', '', '', '', '', '', '', '']);
    filterInfo.push(['', '', '', '', '', '', '', '', '', '', '', '']);

    // Create a new worksheet with filter info
    const headerWorksheet = XLSX.utils.aoa_to_sheet(filterInfo);
    XLSX.utils.sheet_add_json(headerWorksheet, excelData, { origin: -1, skipHeader: false });
    
    // Update the workbook
    workbook.Sheets['Satış Malları'] = headerWorksheet;

    // Generate filename with current date
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR').replace(/\./g, '-');
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const filename = `satis-mallari-${dateStr}-${timeStr}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);
    
    notify.success(`Excel dosyası başarıyla indirildi: ${filename}`);
  } catch (error) {
    console.error('Excel export error:', error);
    notify.error('Excel dosyası oluşturulurken bir hata oluştu.');
  }
};