import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ImportMockProperties = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('import-mock-properties');

      if (error) {
        throw error;
      }

      setImportResult(data);
      toast({
        title: "הייבוא הושלם בהצלחה!",
        description: `${data.message}`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "שגיאה בייבוא",
        description: error.message || 'אירעה שגיאה בייבוא הנכסים',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>ייבוא נכסים מדוגמה</CardTitle>
          <CardDescription>
            ייבוא נכסים לדוגמה (Mock Data) לדאטהבייס האמיתי
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">מה תעשה פעולה זו?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>תייבא 5 דירות להשכרה</li>
              <li>תייבא 4 נכסים למכירה</li>
              <li>כל הנכסים יסומנו כפנויים (vacant) וזמינים (available)</li>
              <li>בעל הנכס יהיה: אלעד צברי (0545503055)</li>
              <li>התמונות יישארו בתיקייה הציבורית</li>
            </ul>
          </div>

          {importResult && (
            <div className={`border rounded-lg p-4 ${importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className="font-semibold">
                  {importResult.success ? 'הייבוא הושלם!' : 'הייבוא נכשל'}
                </h3>
              </div>
              <p className="text-sm">{importResult.message}</p>
              {importResult.rentals && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>דירות להשכרה: {importResult.rentals}</p>
                  <p>נכסים למכירה: {importResult.sales}</p>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={isImporting}
            className="w-full"
            size="lg"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                מייבא נכסים...
              </>
            ) : (
              'ייבא נכסים לדוגמה'
            )}
          </Button>

          {importResult?.success && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">שלב הבא:</p>
              <p className="text-sm text-muted-foreground">
                כעת תוכל לעבור לדפי /rentals או /sales ולשנות את המשתנה USE_REAL_DATA ל-true כדי לראות את הנכסים שיובאו
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportMockProperties;
