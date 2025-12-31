import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Download, Loader2, ImagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const roomTypes = [
  { value: 'living_room', label: 'סלון' },
  { value: 'bedroom', label: 'חדר שינה' },
  { value: 'kitchen', label: 'מטבח' },
  { value: 'bathroom', label: 'חדר רחצה' },
  { value: 'balcony', label: 'מרפסת' },
  { value: 'exterior', label: 'חזית הבניין' },
  { value: 'garden', label: 'גינה/חצר' },
];

const styles = [
  { value: 'modern', label: 'מודרני' },
  { value: 'classic', label: 'קלאסי' },
  { value: 'minimalist', label: 'מינימליסטי' },
  { value: 'luxury', label: 'יוקרתי' },
  { value: 'scandinavian', label: 'סקנדינבי' },
  { value: 'industrial', label: 'תעשייתי' },
  { value: 'mediterranean', label: 'ים תיכוני' },
];

export const ImageGenerationTab: React.FC = () => {
  const [roomType, setRoomType] = useState('');
  const [style, setStyle] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!roomType || !style) {
      toast.error('יש לבחור סוג חדר וסגנון');
      return;
    }

    setIsGenerating(true);
    try {
      const roomLabel = roomTypes.find(r => r.value === roomType)?.label || roomType;
      const styleLabel = styles.find(s => s.value === style)?.label || style;
      
      const prompt = `A professional real estate photography of a ${styleLabel} style ${roomLabel} in Tel Aviv, Israel. High-end interior design, natural lighting, spacious and inviting. ${customPrompt}`.trim();

      const { data, error } = await supabase.functions.invoke('generate-property-image', {
        body: { prompt, type: 'generate' }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImages(prev => [data.imageUrl, ...prev]);
        toast.success('התמונה נוצרה בהצלחה!');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(error.message || 'שגיאה ביצירת התמונה');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property-image-${index + 1}.png`;
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
            <Sparkles className="h-5 w-5 text-primary" />
            יצירת תמונות AI
          </CardTitle>
          <CardDescription>
            צור תמונות נדל"ן מקצועיות באמצעות בינה מלאכותית
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>סוג חדר</Label>
            <Select value={roomType} onValueChange={setRoomType}>
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג חדר" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map(room => (
                  <SelectItem key={room.value} value={room.value}>
                    {room.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>סגנון עיצוב</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue placeholder="בחר סגנון" />
              </SelectTrigger>
              <SelectContent>
                {styles.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>תיאור נוסף (אופציונלי)</Label>
            <Textarea 
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="הוסף פרטים נוספים כמו: נוף לים, רצפת עץ, תקרה גבוהה..."
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            className="w-full"
            disabled={isGenerating || !roomType || !style}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                יוצר תמונה...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4 ml-2" />
                צור תמונה
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>תמונות שנוצרו</CardTitle>
          <CardDescription>
            {generatedImages.length > 0 
              ? `${generatedImages.length} תמונות נוצרו`
              : 'התמונות שתיצור יופיעו כאן'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-muted/30 rounded-lg border-2 border-dashed">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                בחר סוג חדר וסגנון ולחץ על "צור תמונה"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
              {generatedImages.map((imageUrl, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt={`Generated property ${index + 1}`}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(imageUrl, index)}
                    >
                      <Download className="h-4 w-4 ml-1" />
                      הורד
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
