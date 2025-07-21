import toast from 'react-hot-toast';

// Toast konfigürasyonu
const toastOptions = {
  duration: 4000,
  position: 'top-right' as const,
  style: {
    background: '#1f2937',
    color: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #374151',
    fontSize: '14px',
    maxWidth: '400px',
  },
};

const successStyle = {
  ...toastOptions.style,
  background: '#065f46',
  border: '1px solid #059669',
};

const errorStyle = {
  ...toastOptions.style,
  background: '#7f1d1d',
  border: '1px solid #dc2626',
};

const warningStyle = {
  ...toastOptions.style,
  background: '#92400e',
  border: '1px solid #d97706',
};

export const notify = {
  success: (message: string) =>
    toast.success(message, {
      ...toastOptions,
      style: successStyle,
      icon: '✅',
    }),

  error: (message: string) =>
    toast.error(message, {
      ...toastOptions,
      style: errorStyle,
      icon: '❌',
    }),

  warning: (message: string) =>
    toast(message, {
      ...toastOptions,
      style: warningStyle,
      icon: '⚠️',
    }),

  info: (message: string) =>
    toast(message, {
      ...toastOptions,
      icon: 'ℹ️',
    }),

  loading: (message: string) =>
    toast.loading(message, {
      ...toastOptions,
      icon: '⏳',
    }),

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) =>
    toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      toastOptions
    ),

  // Özel bildirimler
  operationSuccess: (operation: string, details?: string[]) => {
    let message = `${operation} başarıyla tamamlandı!`;
    if (details && details.length > 0) {
      message += '\n\n' + details.map(detail => `• ${detail}`).join('\n');
    }
    return notify.success(message);
  },

  validationError: (field: string) =>
    notify.error(`${field} gereklidir`),

  networkError: () =>
    notify.error('Bağlantı hatası oluştu. Lütfen tekrar deneyin.'),

  permissionError: () =>
    notify.error('Bu işlem için yetkiniz bulunmamaktadır.'),
};

// Toast'ları kapat
export const dismissAllToasts = () => toast.dismiss();
export const dismissToast = (toastId: string) => toast.dismiss(toastId);