import React from 'react';
import { DataConsolidationPanel } from '@/components/DataConsolidationPanel';

export const DataConsolidation: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">איחוד נתוני נכסים</h1>
          <p className="text-muted-foreground">
            איחוד וניקוי כל נתוני הנכסים ממקורות שונים לפני העברה למסד הנתונים
          </p>
        </div>
        
        <DataConsolidationPanel />
      </div>
    </div>
  );
};