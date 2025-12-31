import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wand2, Upload, Download, Loader2, ArrowLeftRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const enhancementTypes = [
  { value: 'lighting', label: 'שיפור תאורה וצבעים', description: 'התאמת בהירות, ניגודיות וצבעים' },
  { value: 'declutter', label: 'הסרת אי-סדר', description: 'הסרה אוטומטית של בלגן וחפצים מיותרים' },
  { value: 'staging', label: 'Virtual Staging', description: 'הוספת רהיטים וירטואליים לחדר ריק' },
  { value: 'general', label: 'שיפור כללי', description: 'אופטימיזציה כללית לתמונות נדל"ן' },
];

export const AutoEnhanceTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [enhancedUrl, setEnhancedUrl] = useState<string>('');
  const [enhancementType, setEnhancementType] = useState('general');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setEnhancedUrl('');
      setShowComparison(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setEnhancedUrl('');
      setShowComparison(false);
    }
  };

  const handleEnhance = async () => {
    if (!selectedFile) {
      toast.error('יש להעלות תמונה קודם');
      return;
    }

    setIsEnhancing(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });
      const base64Image = await base64Promise;

      const { data, error } = await supabase.functions.invoke('generate-property-image', {
        body: { 
          type: 'enhance',
          image: base64Image,
          enhancementType
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setEnhancedUrl(data.imageUrl);
        setShowComparison(true);
        toast.success('התמונה שופרה בהצלחה!');
      }
    } catch (error: any) {
      console.error('Error enhancing image:', error);
      toast.error(error.message || 'שגיאה בשיפור התמונה');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDownload = async () => {
    if (!enhancedUrl) return;
    try {
      const response = await fetch(enhancedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enhanced-property-image.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('שגיאה בהורדת התמונה');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            שיפור אוטומטי
          </CardTitle>
          <CardDescription>
            שפר תמונות נדל"ן באופן אוטומטי באמצעות AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-48 mx-auto rounded-lg"
              />
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  גרור תמונה לכאן או לחץ לבחירה
                </p>
              </>
            )}
          </div>

          {/* Enhancement Type */}
          <div className="space-y-3">
            <Label>סוג שיפור</Label>
            <RadioGroup value={enhancementType} onValueChange={setEnhancementType}>
              {enhancementTypes.map(type => (
                <div key={type.value} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                  <label htmlFor={type.value} className="flex-1 cursor-pointer">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button 
            onClick={handleEnhance} 
            className="w-full"
            disabled={isEnhancing || !selectedFile}
          >
            {isEnhancing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                משפר תמונה...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 ml-2" />
                שפר תמונה
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>תוצאה</span>
            {enhancedUrl && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 ml-1" />
                הורד
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {showComparison ? 'השווה בין לפני לאחרי' : 'התמונה המשופרת תופיע כאן'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showComparison && previewUrl && enhancedUrl ? (
            <div className="space-y-4">
              {/* Before/After Comparison Slider */}
              <div className="relative overflow-hidden rounded-lg aspect-video">
                {/* After Image (full) */}
                <img 
                  src={enhancedUrl} 
                  alt="After" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Before Image (clipped) */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img 
                    src={previewUrl} 
                    alt="Before" 
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ width: `${10000 / sliderPosition}%`, maxWidth: 'none' }}
                  />
                </div>

                {/* Slider Handle */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                  style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-gray-600" />
                  </div>
                </div>

                {/* Invisible Range Input for Control */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                />

                {/* Labels */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  לפני
                </div>
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  אחרי
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-muted/30 rounded-lg border-2 border-dashed">
              <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                העלה תמונה ובחר סוג שיפור
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
