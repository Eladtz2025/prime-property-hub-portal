import { useState, useMemo, useEffect } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export function usePagination<T>({
  data,
  itemsPerPage = 10,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  // When the data set shrinks (e.g. after a search/filter narrows the list),
  // the stored page can fall out of range. Clamp it for THIS render so we never
  // render an empty page with a garbled "81-6 of 6" counter...
  const safePage = Math.min(currentPage, totalPages);

  // ...and correct the persisted state after render so navigation stays consistent.
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, safePage, itemsPerPage]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const goToNextPage = () => {
    goToPage(safePage + 1);
  };

  const goToPreviousPage = () => {
    goToPage(safePage - 1);
  };

  const canGoNext = safePage < totalPages;
  const canGoPrevious = safePage > 1;

  const startIndex = data.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(safePage * itemsPerPage, data.length);

  return {
    currentPage: safePage,
    totalPages,
    paginatedData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    canGoNext,
    canGoPrevious,
    itemsPerPage,
    totalItems: data.length,
    startIndex,
    endIndex,
  };
}