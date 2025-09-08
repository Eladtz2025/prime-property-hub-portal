import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ReceiptScanResult {
  amount: number;
  date: string;
  merchant: string;
  category: string;
  confidence: number;
}

export const ReceiptScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ReceiptScanResult | null>(null);
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    setScanning(true);
    
    try {
      // Simulate OCR processing (in real implementation, use OCR service)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock OCR result
      const mockResult: ReceiptScanResult = {
        amount: Math.round(Math.random() * 1000 + 100),
        date: new Date().toISOString().split('T')[0],
        merchant: 'חברת תחזוקה מקצועית',
        category: 'maintenance',
        confidence: 0.85 + Math.random() * 0.15
      };
      
      setResult(mockResult);
      toast({
        title: "סריקה הושלמה",
        description: "הקבלה נסרקה בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה בסריקה",
        description: "אנא נסה שוב",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'default';
    if (confidence >= 0.7) return 'secondary';
    return 'destructive';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 0.7) return <Clock className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          סורק קבלות חכם
        </CardTitle>
        <CardDescription>
          צלם או העלה תמונה של קבלה לעיבוד אוטומטי
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                בחר תמונה של קבלה לסריקה
              </p>
              <div className="space-y-2">
                <Label htmlFor="receipt-upload" className="cursor-pointer">
                  <Button variant="outline" className="w-full" disabled={scanning}>
                    <Upload className="h-4 w-4 mr-2" />
                    {scanning ? 'סורק...' : 'העלה תמונה'}
                  </Button>
                </Label>
                <Input
                  id="receipt-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">תוצאות הסריקה</h4>
                <Badge variant={getConfidenceColor(result.confidence)} className="gap-1">
                  {getConfidenceIcon(result.confidence)}
                  {Math.round(result.confidence * 100)}%
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">סכום</Label>
                  <p className="font-medium">₪{result.amount}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">תאריך</Label>
                  <p className="font-medium">{result.date}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">עסק</Label>
                  <p className="font-medium">{result.merchant}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">קטגוריה</Label>
                  <p className="font-medium">
                    {result.category === 'maintenance' && 'תחזוקה'}
                    {result.category === 'utilities' && 'שירותים'}
                    {result.category === 'insurance' && 'ביטוח'}
                    {result.category === 'other' && 'אחר'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => {
                  toast({
                    title: "הוחה נשמרה",
                    description: "ההוצאה נוספה למערכת",
                  });
                  setResult(null);
                }}
              >
                אשר ושמור
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setResult(null)}
              >
                סרוק מחדש
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};