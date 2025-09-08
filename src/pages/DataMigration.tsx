import React from 'react';
import { DataMigrationPanel } from '@/components/DataMigrationPanel';

export const DataMigration: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Data Migration</h1>
          <p className="text-muted-foreground">
            Import your existing property and owner data into the system
          </p>
        </div>
        
        <DataMigrationPanel />
      </div>
    </div>
  );
};