import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse rounded-md bg-muted/50 dark:bg-muted/30",
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// Reusable skeleton components
const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-3 p-4 border rounded-lg bg-card", className)}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  </div>
);

const StatCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-3 p-4 border rounded-lg bg-card", className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-20" />
  </div>
);

const PropertyCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-4 p-4 border rounded-lg bg-card", className)}>
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
    </div>
    <Skeleton className="h-16 w-full rounded-lg" />
    <div className="flex gap-2">
      <Skeleton className="h-8 flex-1" />
      <Skeleton className="h-8 flex-1" />
    </div>
  </div>
);

export { 
  Skeleton, 
  CardSkeleton, 
  StatCardSkeleton, 
  PropertyCardSkeleton 
};