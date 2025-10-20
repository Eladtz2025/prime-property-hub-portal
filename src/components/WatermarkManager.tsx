import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WatermarkResult {
  total: number;
  processed: number;
  skipped: number;
  failed: number;
  errors: string[];
}

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export const WatermarkManager: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<WatermarkResult | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const { toast } = useToast();

  const handleMigrateImages = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      toast({
        title: "מעביר תמונות...",
        description: "מעלה תמונות מ-public ל-Storage",
      });

      const { data, error } = await supabase.functions.invoke('migrate-public-images-to-storage', {
        body: {
          appUrl: window.location.origin
        }
      });

      if (error) throw error;

      setMigrationResult(data as MigrationResult);

      if (data.failed === 0) {
        toast({
          title: "הצלחה!",
          description: `הועברו ${data.migrated} תמונות בהצלחה ל-Storage`,
        });
      } else {
        toast({
          title: "הושלם עם שגיאות",
          description: `הועברו ${data.migrated} תמונות. ${data.failed} נכשלו.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error migrating images:', error);
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בהעברת התמונות",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleWatermarkAll = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      // First, ensure logo is uploaded
      toast({
        title: "מעלה לוגו...",
        description: "מוודא שהלוגו קיים ב-Storage",
      });

      const { error: logoError } = await supabase.functions.invoke('upload-logo', {
        body: {}
      });

      if (logoError) {
        console.error('Logo upload error:', logoError);
        // Continue anyway - logo might already exist
      }

      // Now process watermarks
      toast({
        title: "מעבד תמונות...",
        description: "מוסיף Watermark לכל התמונות",
      });

      const { data, error } = await supabase.functions.invoke('batch-watermark-images', {
        body: {}
      });

      if (error) throw error;

      setResult(data as WatermarkResult);

      if (data.failed === 0) {
        toast({
          title: "הצלחה!",
          description: `עובדו ${data.processed} תמונות בהצלחה. ${data.skipped} תמונות דולגו.`,
        });
      } else {
        toast({
          title: "הושלם עם שגיאות",
          description: `עובדו ${data.processed} תמונות. ${data.failed} נכשלו.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error processing watermarks:', error);
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעיבוד התמונות",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getProgressPercentage = () => {
    if (!result) return 0;
    return Math.round(((result.processed + result.skipped + result.failed) / result.total) * 100);
  };

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            <CardTitle>ניהול Watermark</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleMigrateImages} 
              disabled={isMigrating || isProcessing}
              size="sm"
              variant="outline"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  מעביר...
                </>
              ) : (
                'העבר תמונות ל-Storage'
              )}
            </Button>
            <Button 
              onClick={handleWatermarkAll} 
              disabled={isProcessing || isMigrating}
              size="sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  מעבד...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 ml-2" />
                  עבד את כל התמונות
                </>
              )}
            </Button>
          </div>
        </div>
        <CardDescription>
          הוספת לוגו למים לכל תמונות הנכסים
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isMigrating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>מעביר תמונות ל-Storage...</span>
            </div>
            <Progress value={50} className="w-full" />
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>מעבד תמונות...</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="w-full" />
          </div>
        )}

        {migrationResult && (
          <div className="space-y-3">
            <div className="text-sm font-medium">תוצאות העברה:</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="text-sm">
                  <div className="font-medium">{migrationResult.migrated}</div>
                  <div className="text-muted-foreground">הועברו</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <XCircle className="h-5 w-5 text-red-500" />
                <div className="text-sm">
                  <div className="font-medium">{migrationResult.failed}</div>
                  <div className="text-muted-foreground">נכשלו</div>
                </div>
              </div>
            </div>

            {migrationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">שגיאות:</div>
                  <ul className="text-xs space-y-1">
                    {migrationResult.errors.slice(0, 3).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {migrationResult.errors.length > 3 && (
                      <li>ועוד {migrationResult.errors.length - 3} שגיאות...</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="text-sm">
                  <div className="font-medium">{result.processed}</div>
                  <div className="text-muted-foreground">עובדו בהצלחה</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div className="text-sm">
                  <div className="font-medium">{result.skipped}</div>
                  <div className="text-muted-foreground">דולגו</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <XCircle className="h-5 w-5 text-red-500" />
                <div className="text-sm">
                  <div className="font-medium">{result.failed}</div>
                  <div className="text-muted-foreground">נכשלו</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Image className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">{result.total}</div>
                  <div className="text-muted-foreground">סה"כ תמונות</div>
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">שגיאות:</div>
                  <ul className="text-xs space-y-1">
                    {result.errors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>ועוד {result.errors.length - 5} שגיאות...</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• לחץ תחילה על "העבר תמונות ל-Storage" אם יש תמונות ב-public</p>
          <p>• הלוגו יתווסף אוטומטית לפינה הימנית התחתונה</p>
          <p>• תמונות שכבר עובדו ידולגו</p>
          <p>• התהליך עשוי לקחת מספר דקות</p>
        </div>
      </CardContent>
    </Card>
  );
};
