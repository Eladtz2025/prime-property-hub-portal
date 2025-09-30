import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const MigrationTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      toast({
        title: "מתחיל מיגרציה",
        description: "העברת 4,250 נכסים לסופהבייס...",
      });

      const { data, error } = await supabase.functions.invoke('migrate-properties');
      
      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "המיגרציה הושלמה בהצלחה!",
        description: `הועברו ${data.stats?.properties_migrated} נכסים לסופהבייס`,
      });
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "שגיאה במיגרציה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>מיגרציית נתונים לסופהבייס</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          העברת כל 4,250 הנכסים מקובץ ה-JSON לבסיס הנתונים של סופהבייס
        </p>
        
        <Button 
          onClick={runMigration} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'מעביר נתונים...' : 'הפעל מיגרציה'}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">תוצאות המיגרציה:</h3>
            <ul className="text-green-700 space-y-1">
              <li>נכסים שהועברו: {result.stats?.properties_migrated}</li>
              <li>בעלי נכסים שנוצרו: {result.stats?.owners_created}</li>
              <li>קשרי בעלות שנוצרו: {result.stats?.relationships_created}</li>
              <li>בעלים ייחודיים: {result.stats?.unique_owners}</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};