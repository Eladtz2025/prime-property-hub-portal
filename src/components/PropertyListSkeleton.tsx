import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const PropertyListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-1">
                  <Skeleton className="h-7 w-7" />
                  <Skeleton className="h-7 w-7" />
                  <Skeleton className="h-7 w-7" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-8 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};