import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wand2, Upload, Download, Loader2, ArrowLeftRight, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImageLightbox } from './ImageLightbox';
import { SaveToPropertyDialog } from './SaveToPropertyDialog';
import { validateFileSize, downloadImage, enhancementTypeTranslations } from './utils';

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Store previous URL for cleanup
  const prevPreviewUrlRef = useRef<string>('');

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current);
      }
    };
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFileSize(file)) return;
      
      // Cleanup previous URL
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current);
      }
      
      const newUrl = URL.createObjectURL(file);
      prevPreviewUrlRef.current = newUrl;
      
      setSelectedFile(file);
      setPreviewUrl(newUrl);
      setEnhancedUrl('');
      setShowComparison(false);
    }
  }, []);

  const handleClearSelection = useCallback(() => {
    if (prevPreviewUrlRef.current) {
      URL.revokeObjectURL(prevPreviewUrlRef.current);
      prevPreviewUrlRef.current = '';
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setEnhancedUrl('');
    setShowComparison(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (!validateFileSize(file)) return;
      
      // Cleanup previous URL
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current);
      }
      
      const newUrl = URL.createObjectURL(file);
      prevPreviewUrlRef.current = newUrl;
      
      setSelectedFile(file);
      setPreviewUrl(newUrl);
      setEnhancedUrl('');
      setShowComparison(false);
    }
  }, []);

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

      // Get English prompt for the enhancement type
      const enhancementPrompt = enhancementTypeTranslations[enhancementType] || enhancementTypeTranslations.general;

      const { data, error } = await supabase.functions.invoke('generate-property-image', {
        body: { 
          type: 'enhance',
          image: base64Image,
          enhancementType,
          prompt: enhancementPrompt
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
    setIsDownloading(true);
    await downloadImage(enhancedUrl, 'enhanced-property-image.png');
    setIsDownloading(false);
  };

  const handleSliderTouch = (e: React.TouchEvent<HTMLInputElement>) => {
    // Allow touch interaction on the slider
    e.stopPropagation();
  };

  // Calculate before image width properly to avoid division by zero
  const getBeforeImageWidth = () => {
    if (sliderPosition <= 0) return '100%';
    return `${10000 / sliderPosition}%`;
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Result - Show first on mobile */}
        <Card className="order-1 lg:order-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center justify-between text-lg md:text-xl">
              <span>תוצאה</span>
              {enhancedUrl && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSaveDialogOpen(true)} 
                    className="min-h-[44px]"
                    aria-label="שמור תמונה לנכס"
                  >
                    <Save className="h-4 w-4 ml-1" />
                    <span className="hidden sm:inline">שמור לנכס</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload} 
                    className="min-h-[44px]"
                    disabled={isDownloading}
                    aria-label="הורד תמונה משופרת"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-1" />
                    ) : (
                      <Download className="h-4 w-4 ml-1" />
                    )}
                    <span className="hidden sm:inline">הורד</span>
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              {showComparison ? 'השווה בין לפני לאחרי' : 'התמונה המשופרת תופיע כאן'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            {showComparison && previewUrl && enhancedUrl ? (
              <div className="space-y-4">
                {/* Before/After Comparison Slider */}
                <div 
                  className="relative overflow-hidden rounded-lg aspect-video cursor-pointer"
                  onClick={() => setLightboxOpen(true)}
                >
                  {/* After Image (full) */}
                  <img 
                    src={enhancedUrl} 
                    alt="תמונה אחרי שיפור" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* Before Image (clipped) */}
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img 
                      src={previewUrl} 
                      alt="תמונה לפני שיפור" 
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ width: getBeforeImageWidth(), maxWidth: 'none' }}
                    />
                  </div>

                  {/* Slider Handle */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <ArrowLeftRight className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                    </div>
                  </div>

                  {/* Invisible Range Input for Control */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    onTouchStart={handleSliderTouch}
                    onTouchMove={handleSliderTouch}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                    style={{ touchAction: 'none' }}
                    aria-label="גרור להשוואה בין לפני לאחרי"
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
              <div className="flex flex-col items-center justify-center h-48 md:h-64 bg-muted/30 rounded-lg border-2 border-dashed">
                <Wand2 className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center text-sm md:text-base px-4">
                  העלה תמונה ובחר סוג שיפור
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="order-2 lg:order-1">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Wand2 className="h-5 w-5 text-primary" />
              שיפור אוטומטי
            </CardTitle>
            <CardDescription className="text-sm">
              שפר תמונות נדל"ן באופן אוטומטי באמצעות AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0 md:pt-0">
            {/* File Upload */}
            <div 
              className="border-2 border-dashed rounded-lg p-4 md:p-6 text-center cursor-pointer hover:border-primary transition-colors min-h-[120px] md:min-h-[150px] flex flex-col items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label="העלה תמונה לשיפור"
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="בחר קובץ תמונה"
              />
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="תצוגה מקדימה" 
                    className="max-h-32 md:max-h-48 mx-auto rounded-lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-8 w-8 bg-background/80 hover:bg-background rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSelection();
                    }}
                    aria-label="נקה בחירה"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm md:text-base">
                    גרור תמונה לכאן או לחץ לבחירה
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    גודל מקסימלי: 10MB
                  </p>
                </>
              )}
            </div>

            {/* Enhancement Type */}
            <div className="space-y-3">
              <Label>סוג שיפור</Label>
              <RadioGroup value={enhancementType} onValueChange={setEnhancementType}>
                {enhancementTypes.map(type => (
                  <div 
                    key={type.value} 
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors min-h-[60px]"
                  >
                    <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                    <label htmlFor={type.value} className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm md:text-base">{type.label}</div>
                      <div className="text-xs md:text-sm text-muted-foreground">{type.description}</div>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button 
              onClick={handleEnhance} 
              className="w-full min-h-[44px]"
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
      </div>

      {/* Lightbox - show both before and after with proper navigation */}
      <ImageLightbox
        images={enhancedUrl ? [previewUrl, enhancedUrl].filter(Boolean) : []}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => {
          setLightboxOpen(false);
          setLightboxIndex(0);
        }}
        onNavigate={setLightboxIndex}
      />

      {/* Save Dialog */}
      <SaveToPropertyDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        imageUrl={enhancedUrl}
      />
    </>
  );
};
