'use client';

import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';

interface PaginationProps {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function Pagination({
  pagination,
  onPageChange,
  onLimitChange
}: PaginationProps) {
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  const getVisiblePages = () => {
    const visiblePages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (pagination.pages <= maxVisible) {
      for (let i = 1; i <= pagination.pages; i++) {
        visiblePages.push(i);
      }
    } else {
      if (pagination.page <= 4) {
        for (let i = 1; i <= 5; i++) {
          visiblePages.push(i);
        }
        visiblePages.push('...');
        visiblePages.push(pagination.pages);
      } else if (pagination.page >= pagination.pages - 3) {
        visiblePages.push(1);
        visiblePages.push('...');
        for (let i = pagination.pages - 4; i <= pagination.pages; i++) {
          visiblePages.push(i);
        }
      } else {
        visiblePages.push(1);
        visiblePages.push('...');
        for (let i = pagination.page - 1; i <= pagination.page + 1; i++) {
          visiblePages.push(i);
        }
        visiblePages.push('...');
        visiblePages.push(pagination.pages);
      }
    }
    
    return visiblePages;
  };

  if (pagination.pages <= 1) {
    return (
      <div className="flex justify-between items-center text-sm text-muted-foreground py-4">
        <span>
          Toplam {pagination.total} cari hesap gösteriliyor
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
      <div className="text-sm text-muted-foreground">
        {startItem}-{endItem} arası gösteriliyor, toplam {pagination.total} cari hesap
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={pagination.page === 1}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {getVisiblePages().map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className="px-2 text-muted-foreground">...</span>
            ) : (
              <Button
                variant={pagination.page === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            )}
          </div>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.pages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.pages)}
          disabled={pagination.page === pagination.pages}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
      
      {onLimitChange && (
        <div className="flex items-center gap-2 text-sm">
          <span>Sayfa başına:</span>
          <select
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}
    </div>
  );
}