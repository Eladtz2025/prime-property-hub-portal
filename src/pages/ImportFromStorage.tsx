import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportStats {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

const ImportFromStorage = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [stats, setStats] = useState<ImportStats | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setStats(null);
    
    try {
      console.log('🚀 Starting import from storage...');
      toast.info('מתחיל ייבוא מהקובץ...');

      const { data, error } = await supabase.functions.invoke('import-from-json');

      if (error) {
        console.error('❌ Error calling function:', error);
        throw error;
      }

      console.log('✅ Import completed:', data);
      
      if (data.success) {
        setStats(data.stats);
        toast.success(`הייבוא הושלם! ${data.stats.successful} נכסים נוספו בהצלחה`);
        
        if (data.stats.failed > 0) {
          toast.warning(`${data.stats.failed} נכסים נכשלו בייבוא`);
        }
      } else {
        throw new Error(data.error || 'Import failed');
      }
      
    } catch (error) {
      console.error('❌ Error importing:', error);
      toast.error(`שגיאה בייבוא: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            ייבוא נכסים מ-Storage
          </CardTitle>
          <CardDescription>
            ייבוא כל הנכסים מהקובץ properties-unified-new.json שהועלה ל-Storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              הקובץ נמצא ב-Storage bucket: <strong>data-import/properties-unified-new.json</strong>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleImport} 
            disabled={isImporting}
            size="lg"
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                מייבא נכסים...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                התחל ייבוא
              </>
            )}
          </Button>

          {stats && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-sm text-muted-foreground">סה"כ</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        {stats.successful}
                      </div>
                      <div className="text-sm text-muted-foreground">הצליחו</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
                        <XCircle className="h-5 w-5" />
                        {stats.failed}
                      </div>
                      <div className="text-sm text-muted-foreground">נכשלו</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {stats.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800">שגיאות</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {stats.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700">
                          {error}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportFromStorage;
