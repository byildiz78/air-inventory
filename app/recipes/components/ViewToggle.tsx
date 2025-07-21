'use client';

import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';
import { ViewMode } from '../hooks/useViewMode';

interface ViewToggleProps {
  viewMode: ViewMode;
  onToggle: () => void;
}

export function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      <Button
        variant={viewMode === ViewMode.LIST ? "default" : "ghost"}
        size="sm"
        onClick={onToggle}
        className="h-8 px-3"
      >
        <List className="w-4 h-4 mr-1" />
        Liste
      </Button>
      <Button
        variant={viewMode === ViewMode.CARD ? "default" : "ghost"}
        size="sm"
        onClick={onToggle}
        className="h-8 px-3"
      >
        <Grid3X3 className="w-4 h-4 mr-1" />
        Kartlar
      </Button>
    </div>
  );
}