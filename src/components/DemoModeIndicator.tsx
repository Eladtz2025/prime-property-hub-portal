import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

export const DemoModeIndicator: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mx-4 mb-4">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-amber-600" />
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
          מצב דמו
        </Badge>
        <span className="text-sm text-amber-700">אתה צופה בנתוני דמו</span>
      </div>
    </div>
  );
};