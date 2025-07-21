'use client';

import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title = 'Onay',
  message,
  confirmText = 'Devam Et',
  cancelText = 'İptal',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={true} onOpenChange={() => onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground whitespace-pre-line">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onCancel}>
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant={variant}
              onClick={onConfirm}
              className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export const confirmDialog = (options: ConfirmOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    // Dialog container oluştur
    const container = document.createElement('div');
    container.id = `confirm-dialog-container-${Date.now()}`;
    document.body.appendChild(container);
    
    const root = createRoot(container);
    let isCleanedUp = false;
    
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      
      try {
        root.unmount();
        // Container'ın hala DOM'da olup olmadığını kontrol et
        if (container && document.body.contains(container)) {
          container.remove();
        }
      } catch (error) {
        console.warn('Dialog cleanup error (safe to ignore):', error);
      }
    };
    
    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };
    
    const handleCancel = () => {
      cleanup();
      resolve(false);
    };
    
    root.render(
      <ConfirmDialog
        {...options}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  });
};

// Kolay kullanım için yardımcı fonksiyonlar
export const confirm = {
  // Genel onay
  ask: (message: string, title?: string) => 
    confirmDialog({ 
      message, 
      title: title || 'Onay' 
    }),
    
  // Silme onayı (kırmızı buton)
  delete: (message: string) =>
    confirmDialog({
      title: 'Silme Onayı',
      message,
      confirmText: 'Sil',
      cancelText: 'İptal',
      variant: 'destructive'
    }),
    
  // Toplu işlem onayı
  bulk: (message: string) =>
    confirmDialog({
      title: 'Toplu İşlem Onayı', 
      message,
      confirmText: 'Devam Et',
      cancelText: 'İptal'
    }),
    
  // Önemli işlem onayı (uyarı rengi)
  important: (message: string, title?: string) =>
    confirmDialog({
      title: title || 'Önemli İşlem',
      message,
      confirmText: 'Evet, Devam Et',
      cancelText: 'İptal',
      variant: 'destructive'
    }),
};

// Eski confirm() fonksiyonu ile uyumluluk için
export const legacyConfirm = (message: string): Promise<boolean> => {
  return confirm.ask(message);
};