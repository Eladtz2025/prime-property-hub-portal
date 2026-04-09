import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Download, Loader2, ImagePlus, Save, Trash2, Home, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImageLightbox } from './ImageLightbox';
import { SaveToPropertyDialog } from './SaveToPropertyDialog';
import { downloadImage, roomTypeTranslations, styleTranslations } from './utils';
import { logger } from '@/utils/logger';

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

const freeformCategories = [
  { value: 'transactions', label: 'עסקאות נדל"ן', promptPrefix: 'A professional real estate photography of' },
  { value: 'professionals', label: 'אנשי מקצוע', promptPrefix: 'Professional photography of' },
  { value: 'objects', label: 'אובייקטים', promptPrefix: 'High quality product photography of' },
  { value: 'marketing', label: 'שיווק ופרסום', promptPrefix: 'Professional marketing image of' },
  { value: 'general', label: 'כללי', promptPrefix: '' },
];

export const ImageGenerationTab: React.FC = () => {
  // Room mode state
  const [roomType, setRoomType] = useState('');
  const [style, setStyle] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Freeform mode state
  const [generationMode, setGenerationMode] = useState<'rooms' | 'freeform'>('rooms');
  const [freeformCategory, setFreeformCategory] = useState('');
  const [freeformPrompt, setFreeformPrompt] = useState('');
  
  // Common state
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedImageForSave, setSelectedImageForSave] = useState('');

  const handleGenerate = async () => {
    let prompt = '';
    
    if (generationMode === 'rooms') {
      if (!roomType || !style) {
        toast.error('יש לבחור סוג חדר וסגנון');
        return;
      }
      // Use English translations for the AI prompt
      const roomTypeEn = roomTypeTranslations[roomType] || roomType;
      const styleEn = styleTranslations[style] || style;
      prompt = `A professional real estate photography of a ${styleEn} style ${roomTypeEn} in Tel Aviv, Israel. High-end interior design, natural lighting, spacious and inviting. ${customPrompt}`.trim();
    } else {
      // Freeform mode
      if (!freeformPrompt.trim()) {
        toast.error('יש להזין תיאור לתמונה');
        return;
      }
      const category = freeformCategories.find(c => c.value === freeformCategory);
      const prefix = category?.promptPrefix || '';
      prompt = prefix 
        ? `${prefix} ${freeformPrompt}. Professional high-quality image, realistic photography style.`
        : `${freeformPrompt}. Professional high-quality image, realistic photography style.`;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-property-image', {
        body: { prompt, type: 'generate' }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImages(prev => [data.imageUrl, ...prev]);
        toast.success('התמונה נוצרה בהצלחה!');
      }
    } catch (error: any) {
      logger.error('Error generating image:', error);
      toast.error(error.message || 'שגיאה ביצירת התמונה');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    setDownloadingIndex(index);
    await downloadImage(imageUrl, `property-image-${index + 1}.png`);
    setDownloadingIndex(null);
  };

  const handleClearAll = () => {
    setGeneratedImages([]);
    toast.success('כל התמונות נמחקו');
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleSaveToProperty = (imageUrl: string) => {
    setSelectedImageForSave(imageUrl);
    setSaveDialogOpen(true);
  };

  const canGenerate = generationMode === 'rooms' 
    ? roomType && style 
    : freeformPrompt.trim().length > 0;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Gallery - Show first on mobile */}
        <Card className="order-1 lg:order-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center justify-between text-lg md:text-xl">
              <span>תמונות שנוצרו</span>
              {generatedImages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="נקה את כל התמונות"
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  נקה הכל
                </Button>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              {generatedImages.length > 0 
                ? `${generatedImages.length} תמונות נוצרו`
                : 'התמונות שתיצור יופיעו כאן'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            {generatedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 md:h-64 bg-muted/30 rounded-lg border-2 border-dashed">
                <Sparkles className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center text-sm md:text-base px-4">
                  {generationMode === 'rooms' 
                    ? 'בחר סוג חדר וסגנון ולחץ על "צור תמונה"'
                    : 'הזן תיאור לתמונה ולחץ על "צור תמונה"'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-h-[500px] overflow-y-auto">
                {generatedImages.map((imageUrl, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={`תמונת נכס ${index + 1}`}
                      className="w-full aspect-video object-cover cursor-pointer"
                      onClick={() => openLightbox(index)}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 md:transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleSaveToProperty(imageUrl); }}
                        className="min-h-[44px]"
                        aria-label="שמור תמונה לנכס"
                      >
                        <Save className="h-4 w-4 ml-1" />
                        <span className="hidden sm:inline">שמור</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDownload(imageUrl, index); }}
                        className="min-h-[44px]"
                        disabled={downloadingIndex === index}
                        aria-label="הורד תמונה"
                      >
                        {downloadingIndex === index ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-1" />
                        ) : (
                          <Download className="h-4 w-4 ml-1" />
                        )}
                        <span className="hidden sm:inline">הורד</span>
                      </Button>
                    </div>
                    {/* Mobile action buttons - always visible */}
                    <div className="md:hidden absolute bottom-2 left-2 right-2 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleSaveToProperty(imageUrl); }}
                        className="flex-1 min-h-[36px] text-xs"
                        aria-label="שמור תמונה לנכס"
                      >
                        <Save className="h-3 w-3 ml-1" />
                        שמור
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDownload(imageUrl, index); }}
                        className="flex-1 min-h-[36px] text-xs"
                        disabled={downloadingIndex === index}
                        aria-label="הורד תמונה"
                      >
                        {downloadingIndex === index ? (
                          <Loader2 className="h-3 w-3 animate-spin ml-1" />
                        ) : (
                          <Download className="h-3 w-3 ml-1" />
                        )}
                        הורד
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="order-2 lg:order-1">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              יצירת תמונות AI
            </CardTitle>
            <CardDescription className="text-sm">
              צור תמונות נדל"ן מקצועיות באמצעות בינה מלאכותית
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
            {/* Mode Toggle */}
            <Tabs value={generationMode} onValueChange={(v) => setGenerationMode(v as 'rooms' | 'freeform')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rooms" className="gap-2">
                  <Home className="h-4 w-4" />
                  יצירת חדרים
                </TabsTrigger>
                <TabsTrigger value="freeform" className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  יצירה חופשית
                </TabsTrigger>
              </TabsList>

              {/* Rooms Mode */}
              <TabsContent value="rooms" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="room-type">סוג חדר</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger className="min-h-[44px]" id="room-type">
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
                  <Label htmlFor="style">סגנון עיצוב</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="min-h-[44px]" id="style">
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
                  <Label htmlFor="custom-prompt">תיאור נוסף (אופציונלי)</Label>
                  <Textarea 
                    id="custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="הוסף פרטים נוספים כמו: נוף לים, רצפת עץ, תקרה גבוהה..."
                    className="min-h-[80px] md:min-h-[100px]"
                  />
                </div>
              </TabsContent>

              {/* Freeform Mode */}
              <TabsContent value="freeform" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="freeform-category">קטגוריה (אופציונלי)</Label>
                  <Select value={freeformCategory} onValueChange={setFreeformCategory}>
                    <SelectTrigger className="min-h-[44px]" id="freeform-category">
                      <SelectValue placeholder="בחר קטגוריה לשיפור התוצאה" />
                    </SelectTrigger>
                    <SelectContent>
                      {freeformCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    בחירת קטגוריה עוזרת ל-AI להבין את ההקשר טוב יותר
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="freeform-prompt">תיאור התמונה *</Label>
                  <Textarea 
                    id="freeform-prompt"
                    value={freeformPrompt}
                    onChange={(e) => setFreeformPrompt(e.target.value)}
                    placeholder="תאר את התמונה שברצונך ליצור, לדוגמא:
• בעל נכס חותם בלעדיות למתווך במשרד יוקרתי
• מתווך מציג דירה ללקוחות צעירים
• לחיצת ידיים על עסקת נדל״ן
• מפתחות דירה על שולחן עם חוזה
• שלט ״למכירה״ מול בניין מודרני"
                    className="min-h-[120px] md:min-h-[140px]"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleGenerate} 
              className="w-full min-h-[44px]"
              disabled={isGenerating || !canGenerate}
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
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={generatedImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
        onDownload={(url) => handleDownload(url, lightboxIndex)}
      />

      {/* Save Dialog */}
      <SaveToPropertyDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        imageUrl={selectedImageForSave}
      />
    </>
  );
};
