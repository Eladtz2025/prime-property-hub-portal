import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Upload, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { migratePropertiesData } from '@/utils/dataMigration';
import { useToast } from '@/hooks/use-toast';

export const DataMigrationPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    propertiesCount: number;
    ownersCount: number;
    totalRecords: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    setIsLoading(true);
    setError(null);
    setMigrationResult(null);

    try {
      const result = await migratePropertiesData();
      setMigrationResult(result);
      toast({
        title: "Migration Successful",
        description: `Migrated ${result.totalRecords} records successfully`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Migration failed';
      setError(errorMessage);
      toast({
        title: "Migration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Migration
          </CardTitle>
          <CardDescription>
            Import property and owner data from JSON files into the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!migrationResult && !error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will import all properties and owners from your JSON files. 
                Make sure you have the latest data files in the public folder.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {migrationResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Migration completed successfully! 
                Imported {migrationResult.propertiesCount} properties and {migrationResult.ownersCount} additional owners.
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="space-y-2">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Migrating data... This may take a few minutes.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleMigration}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isLoading ? 'Migrating...' : 'Start Migration'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Migration will:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Import properties from כל הנכסים - JSON ל-AI.json</li>
              <li>Import additional owners from בעלי_דירות_מעודכן.json</li>
              <li>Create property ownership relationships</li>
              <li>Import tenant information where available</li>
              <li>Generate email addresses for owners (for portal access)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};