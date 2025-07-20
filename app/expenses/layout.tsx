import { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';

interface ExpensesLayoutProps {
  children: ReactNode;
}

export default function ExpensesLayout({ children }: ExpensesLayoutProps) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}