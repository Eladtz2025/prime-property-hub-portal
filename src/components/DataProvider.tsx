import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        logger.warn(`Query failed ${failureCount} times`, { error });
        return failureCount < 3;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: (failureCount, error) => {
        logger.warn(`Mutation failed ${failureCount} times`, { error });
        return failureCount < 2;
      },
    },
  },
});

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};