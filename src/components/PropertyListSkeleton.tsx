import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const PropertyListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-7 w-7 rounded" />
                  <Skeleton className="h-7 w-7 rounded" />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-40" />
              </div>
              
              <Skeleton className="h-4 w-28" />
            </div>
            
            <Skeleton className="h-8 w-full rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};