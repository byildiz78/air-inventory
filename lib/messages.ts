// Merkezi mesaj sabitleri - Türkçe
export const MESSAGES = {
  SUCCESS: {
    // Genel işlemler
    OPERATION_COMPLETED: 'İşlem başarıyla tamamlandı',
    SETTINGS_SAVED: 'Ayarlar başarıyla kaydedildi',
    DATA_EXPORTED: 'Veriler başarıyla dışa aktarıldı',
    DATA_IMPORTED: 'Veriler başarıyla içe aktarıldı',
    
    // Cari hesap işlemleri
    ACCOUNT_CREATED: 'Cari hesap başarıyla oluşturuldu',
    ACCOUNT_UPDATED: 'Cari hesap başarıyla güncellendi',
    ACCOUNT_DELETED: 'Cari hesap başarıyla silindi',
    ACCOUNT_BALANCE_UPDATED: 'Cari hesap bakiyesi güncellendi',
    
    // Malzeme işlemleri
    MATERIAL_CREATED: 'Malzeme başarıyla eklendi',
    MATERIAL_UPDATED: 'Malzeme başarıyla güncellendi',
    MATERIAL_DELETED: 'Malzeme başarıyla silindi',
    MATERIAL_STATUS_CHANGED: 'Malzeme durumu değiştirildi',
    
    // Ödeme işlemleri
    PAYMENT_CREATED: 'Ödeme başarıyla kaydedildi',
    PAYMENT_UPDATED: 'Ödeme başarıyla güncellendi',
    PAYMENT_DELETED: 'Ödeme başarıyla silindi',
    
    // Hareket işlemleri
    TRANSACTION_CREATED: 'Hareket başarıyla eklendi',
    TRANSACTION_UPDATED: 'Hareket başarıyla güncellendi',
    TRANSACTION_DELETED: 'Hareket başarıyla silindi',
    
    // Fatura işlemleri
    INVOICE_CREATED: 'Fatura başarıyla oluşturuldu',
    INVOICE_UPDATED: 'Fatura başarıyla güncellendi',
    INVOICE_DELETED: 'Fatura başarıyla silindi',
    
    // Stok işlemleri
    STOCK_UPDATED: 'Stok başarıyla güncellendi',
    STOCK_TRANSFER_COMPLETED: 'Stok transferi tamamlandı',
    STOCK_COUNT_COMPLETED: 'Stok sayımı tamamlandı',
    
    // Reçete işlemleri
    RECIPE_CREATED: 'Reçete başarıyla oluşturuldu',
    RECIPE_UPDATED: 'Reçete başarıyla güncellendi',
    RECIPE_DELETED: 'Reçete başarıyla silindi',
    
    // Satış işlemleri
    SALE_CREATED: 'Satış başarıyla kaydedildi',
    SALE_UPDATED: 'Satış başarıyla güncellendi',
    SALE_DELETED: 'Satış başarıyla silindi',
    
    // Kullanıcı işlemleri
    USER_CREATED: 'Kullanıcı başarıyla oluşturuldu',
    USER_UPDATED: 'Kullanıcı başarıyla güncellendi',
    USER_DELETED: 'Kullanıcı başarıyla silindi',
    
    // Kategori işlemleri
    CATEGORY_CREATED: 'Kategori başarıyla oluşturuldu',
    CATEGORY_UPDATED: 'Kategori başarıyla güncellendi',
    CATEGORY_DELETED: 'Kategori başarıyla silindi',
    
    // Depo işlemleri
    WAREHOUSE_CREATED: 'Depo başarıyla oluşturuldu',
    WAREHOUSE_UPDATED: 'Depo başarıyla güncellendi',
    WAREHOUSE_DELETED: 'Depo başarıyla silindi',
    
    // Vergi işlemleri
    TAX_CREATED: 'Vergi başarıyla oluşturuldu',
    TAX_UPDATED: 'Vergi başarıyla güncellendi',
    TAX_DELETED: 'Vergi başarıyla silindi',
  },

  ERROR: {
    // Genel hatalar
    OPERATION_FAILED: 'İşlem başarısız oldu',
    NETWORK_ERROR: 'Bağlantı hatası oluştu',
    PERMISSION_DENIED: 'Bu işlem için yetkiniz bulunmamaktadır',
    INVALID_DATA: 'Geçersiz veri girişi',
    UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu',
    
    // Form doğrulama hataları
    REQUIRED_FIELDS: 'Lütfen zorunlu alanları doldurun',
    INVALID_EMAIL: 'Geçerli bir e-posta adresi giriniz',
    INVALID_PHONE: 'Geçerli bir telefon numarası giriniz',
    INVALID_AMOUNT: 'Geçerli bir tutar giriniz',
    INVALID_NUMBER: 'Geçerli bir sayı giriniz',
    INVALID_DATE: 'Geçerli bir tarih giriniz',
    
    // Cari hesap hataları
    ACCOUNT_CREATE_ERROR: 'Cari hesap eklenirken hata oluştu',
    ACCOUNT_UPDATE_ERROR: 'Cari hesap güncellenirken hata oluştu',
    ACCOUNT_DELETE_ERROR: 'Cari hesap silinirken hata oluştu',
    ACCOUNT_NOT_FOUND: 'Cari hesap bulunamadı',
    ACCOUNT_NAME_EXISTS: 'Bu isimde bir cari hesap zaten mevcut',
    
    // Malzeme hataları
    MATERIAL_CREATE_ERROR: 'Malzeme eklenirken hata oluştu',
    MATERIAL_UPDATE_ERROR: 'Malzeme güncellenirken hata oluştu',
    MATERIAL_DELETE_ERROR: 'Malzeme silinirken hata oluştu',
    MATERIAL_STATUS_ERROR: 'Malzeme durumu değiştirilirken hata oluştu',
    MATERIAL_NOT_FOUND: 'Malzeme bulunamadı',
    MATERIAL_CODE_EXISTS: 'Bu kodda bir malzeme zaten mevcut',
    
    // Ödeme hataları
    PAYMENT_CREATE_ERROR: 'Ödeme eklenirken hata oluştu',
    PAYMENT_UPDATE_ERROR: 'Ödeme güncellenirken hata oluştu',
    PAYMENT_DELETE_ERROR: 'Ödeme silinirken hata oluştu',
    PAYMENT_NOT_FOUND: 'Ödeme bulunamadı',
    
    // Hareket hataları
    TRANSACTION_CREATE_ERROR: 'Hareket eklenirken hata oluştu',
    TRANSACTION_UPDATE_ERROR: 'Hareket güncellenirken hata oluştu',
    TRANSACTION_DELETE_ERROR: 'Hareket silinirken hata oluştu',
    TRANSACTION_NOT_FOUND: 'Hareket bulunamadı',
    
    // Stok hataları
    INSUFFICIENT_STOCK: 'Yetersiz stok',
    STOCK_UPDATE_ERROR: 'Stok güncellenirken hata oluştu',
    STOCK_TRANSFER_ERROR: 'Stok transferi sırasında hata oluştu',
    
    // Fatura hataları
    INVOICE_CREATE_ERROR: 'Fatura oluşturulurken hata oluştu',
    INVOICE_UPDATE_ERROR: 'Fatura güncellenirken hata oluştu',
    INVOICE_DELETE_ERROR: 'Fatura silinirken hata oluştu',
    INVOICE_NOT_FOUND: 'Fatura bulunamadı',
    
    // Reçete hataları
    RECIPE_CREATE_ERROR: 'Reçete oluşturulurken hata oluştu',
    RECIPE_UPDATE_ERROR: 'Reçete güncellenirken hata oluştu',
    RECIPE_DELETE_ERROR: 'Reçete silinirken hata oluştu',
    RECIPE_NOT_FOUND: 'Reçete bulunamadı',
    
    // Kullanıcı hataları
    USER_CREATE_ERROR: 'Kullanıcı oluşturulurken hata oluştu',
    USER_UPDATE_ERROR: 'Kullanıcı güncellenirken hata oluştu',
    USER_DELETE_ERROR: 'Kullanıcı silinirken hata oluştu',
    USER_NOT_FOUND: 'Kullanıcı bulunamadı',
    USER_EXISTS: 'Bu kullanıcı adı zaten mevcut',
  },

  VALIDATION: {
    // Alan doğrulamaları
    ACCOUNT_NAME_REQUIRED: 'Cari hesap adı gereklidir',
    MATERIAL_NAME_REQUIRED: 'Malzeme adı gereklidir',
    MATERIAL_CODE_REQUIRED: 'Malzeme kodu gereklidir',
    AMOUNT_REQUIRED: 'Tutar gereklidir',
    AMOUNT_POSITIVE: 'Tutar 0\'dan büyük olmalıdır',
    PAYMENT_AMOUNT_POSITIVE: 'Ödeme tutarı 0\'dan büyük olmalıdır',
    QUANTITY_POSITIVE: 'Miktar 0\'dan büyük olmalıdır',
    PRICE_POSITIVE: 'Fiyat 0\'dan büyük olmalıdır',
    DATE_REQUIRED: 'Tarih gereklidir',
    DESCRIPTION_REQUIRED: 'Açıklama gereklidir',
    CATEGORY_REQUIRED: 'Kategori gereklidir',
    WAREHOUSE_REQUIRED: 'Depo gereklidir',
    UNIT_REQUIRED: 'Birim gereklidir',
    
    // İş mantığı doğrulamaları
    FUTURE_DATE_NOT_ALLOWED: 'İleri tarihli işlem yapılamaz',
    INVALID_DATE_RANGE: 'Geçersiz tarih aralığı',
    DUPLICATE_ENTRY: 'Bu kayıt zaten mevcut',
    CANNOT_DELETE_USED_ITEM: 'Kullanımda olan öğe silinemez',
    INSUFFICIENT_PERMISSIONS: 'Yetersiz yetki',
  },

  CONFIRM: {
    // Onay mesajları
    DELETE_MATERIAL: 'Bu malzemeyi silmek istediğinizden emin misiniz?',
    DELETE_ACCOUNT: 'Bu cari hesabı silmek istediğinizden emin misiniz?',
    DELETE_PAYMENT: 'Bu ödemeyi silmek istediğinizden emin misiniz?',
    DELETE_TRANSACTION: 'Bu hareketi silmek istediğinizden emin misiniz?',
    DELETE_INVOICE: 'Bu faturayı silmek istediğinizden emin misiniz?',
    DELETE_RECIPE: 'Bu reçeteyi silmek istediğinizden emin misiniz?',
    DELETE_USER: 'Bu kullanıcıyı silmek istediğinizden emin misiniz?',
    
    // Toplu işlem onayları
    RECALCULATE_BALANCES: 'Tüm cari hesap bakiyeleri yeniden hesaplanacak. Bu işlem biraz zaman alabilir. Devam etmek istiyor musunuz?',
    BULK_UPDATE: 'Seçili kayıtlar güncellenecek. Devam etmek istiyor musunuz?',
    BULK_DELETE: 'Seçili kayıtlar silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
    
    // Sistem işlemleri
    LOGOUT: 'Çıkış yapmak istediğinizden emin misiniz?',
    RESET_DATA: 'Tüm veriler sıfırlanacak. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
  },

  INFO: {
    // Bilgi mesajları
    LOADING: 'Yükleniyor...',
    SAVING: 'Kaydediliyor...',
    DELETING: 'Siliniyor...',
    UPDATING: 'Güncelleniyor...',
    PROCESSING: 'İşleniyor...',
    CALCULATING: 'Hesaplanıyor...',
    EXPORTING: 'Dışa aktarılıyor...',
    IMPORTING: 'İçe aktarılıyor...',
    
    // Durum mesajları
    NO_DATA: 'Gösterilecek veri bulunmamaktadır',
    DATA_SAVED: 'Değişiklikler kaydedildi',
    CHANGES_PENDING: 'Kaydedilmemiş değişiklikler var',
    OPERATION_IN_PROGRESS: 'İşlem devam ediyor',
    
    // Yardım mesajları
    HELP_SEARCH: 'Arama yapmak için en az 3 karakter giriniz',
    HELP_FILTER: 'Sonuçları filtrelemek için kriterleri seçiniz',
    HELP_EXPORT: 'Verileri Excel formatında dışa aktarabilirsiniz',
  }
};