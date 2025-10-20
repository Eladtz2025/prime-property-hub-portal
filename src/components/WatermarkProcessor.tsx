import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { addWatermarkToImageUrl } from '@/utils/watermark';
import logoUrl from '@/assets/city-market-logo.png';

interface ProcessingResult {
  path: string;
  status: 'success' | 'error';
  message: string;
}

export const WatermarkProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('');

  const processAllImages = async () => {
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      // Get all images from property-images bucket
      const { data: files, error: listError } = await supabase.storage
        .from('property-images')
        .list('', {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) {
        throw new Error(`Failed to list images: ${listError.message}`);
      }

      if (!files || files.length === 0) {
        toast.info('לא נמצאו תמונות לעיבוד');
        setIsProcessing(false);
        return;
      }

      const totalFiles = files.length;
      const processedResults: ProcessingResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file.name);
        setProgress(((i + 1) / totalFiles) * 100);

        try {
          // Get public URL of original image
          const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(file.name);

          // Save original to property-images-original bucket
          const response = await fetch(publicUrl);
          const blob = await response.blob();
          
          const { error: saveOriginalError } = await supabase.storage
            .from('property-images-original')
            .upload(file.name, blob, { upsert: true });

          if (saveOriginalError) {
            throw new Error(`Failed to save original: ${saveOriginalError.message}`);
          }

          // Add watermark
          const watermarkedBlob = await addWatermarkToImageUrl(publicUrl, {
            logoUrl,
            opacity: 0.4,
            logoWidth: 15,
            offsetX: 20,
            offsetY: 20
          });

          // Upload watermarked image (replace original)
          const watermarkedFile = new File(
            [watermarkedBlob],
            file.name,
            { type: 'image/jpeg' }
          );

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(file.name, watermarkedFile, { upsert: true });

          if (uploadError) {
            throw new Error(`Failed to upload watermarked image: ${uploadError.message}`);
          }

          processedResults.push({
            path: file.name,
            status: 'success',
            message: 'הוסף watermark בהצלחה'
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          processedResults.push({
            path: file.name,
            status: 'error',
            message: error instanceof Error ? error.message : 'שגיאה לא ידועה'
          });
        }
      }

      setResults(processedResults);
      
      const successCount = processedResults.filter(r => r.status === 'success').length;
      const errorCount = processedResults.filter(r => r.status === 'error').length;
      
      toast.success(`סיום! ${successCount} תמונות עובדו בהצלחה${errorCount > 0 ? `, ${errorCount} שגיאות` : ''}`);
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בעיבוד התמונות');
    } finally {
      setIsProcessing(false);
      setCurrentFile('');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-6 w-6" />
          עיבוד תמונות קיימות - הוספת Watermark
        </CardTitle>
        <CardDescription>
          תהליך זה יעבור על כל התמונות הקיימות, ישמור את המקור ב-bucket נפרד ויוסיף watermark לכל התמונות
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isProcessing && results.length === 0 && (
          <Alert>
            <AlertDescription>
              <strong>שים לב:</strong> תהליך זה:
              <ul className="list-disc mr-4 mt-2 space-y-1">
                <li>ישמור את כל התמונות המקוריות ב-bucket "property-images-original"</li>
                <li>יחליף את התמונות ב-bucket "property-images" בגרסאות עם watermark</li>
                <li>לא ישפיע על פונקציות קיימות (וואטסאפ, הצגה וכו')</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={processAllImages}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              מעבד תמונות...
            </>
          ) : (
            <>
              <ImageIcon className="ml-2 h-4 w-4" />
              התחל עיבוד כל התמונות
            </>
          )}
        </Button>

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              מעבד: {currentFile} ({Math.round(progress)}%)
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="font-semibold">תוצאות עיבוד:</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg bg-secondary/50"
              >
                {result.status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.path}</p>
                  <p className="text-xs text-muted-foreground">{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
