'use client';

import { useState, useEffect } from 'react';

export enum ViewMode {
  LIST = 'list',
  CARD = 'card'
}

const STORAGE_KEY = 'current-accounts-view-mode';

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && Object.values(ViewMode).includes(saved as ViewMode)) {
      setViewMode(saved as ViewMode);
    }
  }, []);

  const toggleViewMode = () => {
    const newMode = viewMode === ViewMode.LIST ? ViewMode.CARD : ViewMode.LIST;
    setViewMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  const setViewModeValue = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return {
    viewMode,
    toggleViewMode,
    setViewMode: setViewModeValue,
    isListView: viewMode === ViewMode.LIST,
    isCardView: viewMode === ViewMode.CARD
  };
}