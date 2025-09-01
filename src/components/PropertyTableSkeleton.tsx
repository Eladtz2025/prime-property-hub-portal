import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const PropertyTableSkeleton: React.FC = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">כתובת</TableHead>
          <TableHead className="text-right">בעל הנכס</TableHead>
          <TableHead className="text-right">דייר</TableHead>
          <TableHead className="text-right">סטטוס</TableHead>
          <TableHead className="text-right">סיום חוזה</TableHead>
          <TableHead className="text-right">פעולות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};