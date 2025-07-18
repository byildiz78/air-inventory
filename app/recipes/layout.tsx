'use client';

import { MainLayout } from '@/components/layout/MainLayout';

export default function RecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}