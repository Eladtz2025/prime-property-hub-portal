import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  consolidateAllPropertyData, 
  exportConsolidatedData,
  type ConsolidationResult 
} from '@/utils/dataConsolidation';
import { 
  Database, 
  FileText, 
  Users, 
  Building, 
  AlertTriangle,
  CheckCircle,
  Download,
  Loader2
} from 'lucide-react';

export const DataConsolidationPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [consolidationResult, setConsolidationResult] = useState<ConsolidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConsolidation = async () => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await consolidateAllPropertyData();
      
      clearInterval(progressInterval);
      setProgress(100);
      setConsolidationResult(result);
      
      toast({
        title: "איחוד הנתונים הושלם בהצלחה",
        description: `אוחדו ${result.statistics.totalRecords} רשומות ממקורות שונים`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
      toast({
        title: "שגיאה באיחוד הנתונים",
        description: "אנא נסה שוב",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!consolidationResult) return;
    
    try {
      await exportConsolidatedData(consolidationResult);
      toast({
        title: "קובץ הנתונים המאוחד ירד בהצלחה",
        description: "הקובץ נשמר במחשב שלך",
      });
    } catch (err) {
      toast({
        title: "שגיאה בהורדת הקובץ",
        description: "אנא נסה שוב",
        variant: "destructive",
      });
    }
  };

  const getDuplicateStats = () => {
    if (!consolidationResult) return null;
    
    const { duplicateAnalysis } = consolidationResult;
    const phonesDuplicates = Object.values(duplicateAnalysis.byPhone).filter(arr => arr.length > 1);
    const namesDuplicates = Object.values(duplicateAnalysis.byOwnerName).filter(arr => arr.length > 1);
    const addressDuplicates = Object.values(duplicateAnalysis.byAddress).filter(arr => arr.length > 1);
    
    return {
      byPhone: phonesDuplicates.length,
      byName: namesDuplicates.length,
      byAddress: addressDuplicates.length,
      totalSuspectedDuplicates: phonesDuplicates.reduce((sum, arr) => sum + arr.length - 1, 0)
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          איחוד וניקוי נתוני הנכסים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        {!consolidationResult && !error && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>מה התהליך יעשה:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                <li>יטען נתונים מכל המקורות הקיימים (JSON, TypeScript, Supabase)</li>
                <li>יאחד הכל לקובץ אחד מסודר</li>
                <li>יזהה כפילויות פוטנציאליות לפי טלפון, שם ועוד</li>
                <li>ייצור דו"ח מפורט להמשך הטיפול</li>
                <li>יכין את הנתונים למעבר למסד הנתונים</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>שגיאה:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>מאחד נתונים...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Results */}
        {consolidationResult && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>איחוד הושלם בהצלחה!</strong> הנתונים מוכנים לניקוי כפילויות.
              </AlertDescription>
            </Alert>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Building className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                <div className="text-2xl font-bold text-blue-900">
                  {consolidationResult.properties.length}
                </div>
                <div className="text-sm text-blue-700">נכסים</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-1 text-green-600" />
                <div className="text-2xl font-bold text-green-900">
                  {consolidationResult.owners.length}
                </div>
                <div className="text-sm text-green-700">בעלי נכסים</div>
              </div>

              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                <div className="text-2xl font-bold text-orange-900">
                  {getDuplicateStats()?.totalSuspectedDuplicates || 0}
                </div>
                <div className="text-sm text-orange-700">כפילויות חשודות</div>
              </div>

              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Database className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                <div className="text-2xl font-bold text-purple-900">
                  {consolidationResult.statistics.totalRecords}
                </div>
                <div className="text-sm text-purple-700">סך הכל רשומות</div>
              </div>
            </div>

            {/* Source Breakdown */}
            <div className="space-y-2">
              <h4 className="font-semibold">פילוח לפי מקור:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(consolidationResult.statistics.sourceBreakdown).map(([source, count]) => (
                  <Badge key={source} variant="outline">
                    {source === 'json_main' && 'JSON ראשי'}
                    {source === 'typescript_data' && 'נתוני TypeScript'}
                    {source === 'owners_json' && 'JSON בעלים'}
                    {source === 'supabase' && 'Supabase'}
                    : {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Duplicates Analysis */}
            {getDuplicateStats() && (
              <div className="space-y-2">
                <h4 className="font-semibold">ניתוח כפילויות:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-red-50 rounded">
                    <span>לפי טלפון:</span>
                    <Badge variant="destructive">{getDuplicateStats()?.byPhone}</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-yellow-50 rounded">
                    <span>לפי שם:</span>
                    <Badge variant="secondary">{getDuplicateStats()?.byName}</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-orange-50 rounded">
                    <span>לפי כתובת:</span>
                    <Badge variant="outline">{getDuplicateStats()?.byAddress}</Badge>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Export Button */}
            <div className="flex justify-center">
              <Button onClick={handleExport} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                הורד קובץ נתונים מאוחד
              </Button>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!consolidationResult && (
          <div className="flex justify-center">
            <Button 
              onClick={handleConsolidation} 
              disabled={isLoading}
              className="flex items-center gap-2"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isLoading ? 'מאחד נתונים...' : 'התחל איחוד נתונים'}
            </Button>
          </div>
        )}

        {/* Next Steps */}
        {consolidationResult && (
          <Alert>
            <AlertDescription>
              <strong>השלבים הבאים:</strong>
              <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
                <li>בדוק את הקובץ המאוחד שירד</li>
                <li>סקור את הכפילויות שזוהו</li>
                <li>החלט איך לטפל בכל כפילות</li>
                <li>אחרי הניקוי - העבר הכל למסד הנתונים</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};