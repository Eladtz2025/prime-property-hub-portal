import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sofa, Upload, Download, Loader2, Save, X, ZoomIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImageLightbox } from './ImageLightbox';
import { SaveToPropertyDialog } from './SaveToPropertyDialog';
import { validateFileSize, createPreviewUrl, downloadImage, roomTypeTranslations, styleTranslations } from './utils';
import { logger } from '@/utils/logger';

type StagingMode = 'add' | 'replace';

interface RoomTypeOption {
  value: string;
  label: string;
}

interface StyleOption {
  value: string;
  label: string;
}

const roomTypes: RoomTypeOption[] = [
  { value: 'living_room', label: 'סלון' },
  { value: 'bedroom', label: 'חדר שינה' },
  { value: 'kitchen', label: 'מטבח' },
  { value: 'bathroom', label: 'חדר רחצה' },
  { value: 'dining_room', label: 'פינת אוכל' },
  { value: 'office', label: 'חדר עבודה' },
  { value: 'balcony', label: 'מרפסת' },
  { value: 'staircase', label: 'חדר מדרגות' },
  { value: 'entrance', label: 'מבואה / כניסה' },
  { value: 'hallway', label: 'מסדרון' },
  { value: 'storage', label: 'מחסן' },
  { value: 'laundry', label: 'חדר כביסה' },
  { value: 'terrace', label: 'גג / מרפסת גג' },
  { value: 'garden', label: 'גינה' },
  { value: 'exterior', label: 'חזית בניין' },
  { value: 'other', label: 'אחר (הגדר ידנית)' },
];

const styles: StyleOption[] = [
  { value: 'modern', label: 'מודרני' },
  { value: 'classic', label: 'קלאסי' },
  { value: 'minimalist', label: 'מינימליסטי' },
  { value: 'luxury', label: 'יוקרתי' },
  { value: 'scandinavian', label: 'סקנדינבי' },
  { value: 'industrial', label: 'תעשייתי' },
  { value: 'mediterranean', label: 'ים תיכוני' },
  { value: 'bohemian', label: 'בוהמייני' },
];

export const VirtualStagingTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [stagingMode, setStagingMode] = useState<StagingMode>('add');
  const [roomType, setRoomType] = useState<string>('living_room');
  const [customRoomType, setCustomRoomType] = useState('');
  const [style, setStyle] = useState<string>('modern');
  const [customDescription, setCustomDescription] = useState('');
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Cleanup preview URL on unmount or when file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFileSize(file)) return;

    // Cleanup previous URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const { url } = createPreviewUrl(file);
    setPreviewUrl(url);
    setResultUrl(null);
  }, [previewUrl]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('אנא העלה קובץ תמונה בלבד');
      return;
    }

    if (!validateFileSize(file)) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const { url } = createPreviewUrl(file);
    setPreviewUrl(url);
    setResultUrl(null);
  }, [previewUrl]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const clearImage = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
  }, [previewUrl]);

  const handleStaging = async () => {
    if (!selectedFile || !previewUrl) {
      toast.error('אנא העלה תמונה תחילה');
      return;
    }

    setIsProcessing(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const base64Image = await base64Promise;

      // Get English translations for AI - use custom text for "other" room type
      const roomTypeEn = roomType === 'other' 
        ? (customRoomType.trim() || 'room')
        : (roomTypeTranslations[roomType] || roomType);
      const styleEn = styleTranslations[style] || style;

      const { data, error } = await supabase.functions.invoke('generate-property-image', {
        body: {
          type: 'staging',
          image: base64Image,
          stagingMode,
          roomType: roomTypeEn,
          style: styleEn,
          customDescription: customDescription.trim() || undefined
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setResultUrl(data.imageUrl);
        setCustomDescription('');
        toast.success('העיצוב הושלם בהצלחה!');
      }
    } catch (error: any) {
      logger.error('Error processing staging:', error);
      toast.error(error.message || 'שגיאה בעיבוד התמונה');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    setIsDownloading(true);
    await downloadImage(resultUrl, 'staged-property.png');
    setIsDownloading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sofa className="h-5 w-5" />
            עיצוב ריהוט וירטואלי
          </CardTitle>
          <CardDescription>
            הוסף ריהוט לחדרים ריקים או שנה ריהוט קיים בסגנון שתבחר
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          {!previewUrl ? (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('staging-upload')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">גרור תמונה לכאן או לחץ לבחירה</p>
              <p className="text-xs text-muted-foreground">PNG, JPG עד 10MB</p>
              <input
                id="staging-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full rounded-lg max-h-48 object-contain bg-muted"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 left-2"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Staging Mode */}
              <div className="space-y-3">
                <Label>מצב עיצוב</Label>
                <RadioGroup
                  value={stagingMode}
                  onValueChange={(value) => setStagingMode(value as StagingMode)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="add" id="mode-add" />
                    <Label htmlFor="mode-add" className="cursor-pointer">הוסף ריהוט לחדר ריק</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="replace" id="mode-replace" />
                    <Label htmlFor="mode-replace" className="cursor-pointer">שנה/החלף ריהוט קיים</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Room Type */}
              <div className="space-y-2">
                <Label>סוג החדר</Label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((room) => (
                      <SelectItem key={room.value} value={room.value}>
                        {room.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Custom room type input when "other" is selected */}
                {roomType === 'other' && (
                  <Input
                    value={customRoomType}
                    onChange={(e) => setCustomRoomType(e.target.value)}
                    placeholder="תאר את סוג החדר (למשל: לובי, חדר ארונות, מרתף...)"
                    maxLength={50}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Style */}
              <div className="space-y-2">
                <Label>סגנון עיצוב</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Description */}
              <div className="space-y-2">
                <Label htmlFor="custom-description">תיאור ריהוט מותאם (אופציונלי)</Label>
                <Textarea
                  id="custom-description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="לדוגמה: ספה אפורה בצורת L, שטיח לבן, שולחן קפה מעץ אלון..."
                  maxLength={300}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  תאר את הריהוט הספציפי שתרצה לראות בחדר
                </p>
              </div>

              {/* Process Button */}
              <Button
                className="w-full"
                onClick={handleStaging}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    מעבד...
                  </>
                ) : (
                  <>
                    <Sofa className="h-4 w-4 mr-2" />
                    {stagingMode === 'add' ? 'הוסף ריהוט' : 'שנה ריהוט'}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card>
        <CardHeader>
          <CardTitle>תוצאה</CardTitle>
          <CardDescription>
            {resultUrl ? 'השתמש בסליידר להשוואה בין לפני ואחרי' : 'התוצאה תוצג כאן לאחר העיבוד'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resultUrl && previewUrl ? (
            <div className="space-y-4">
              {/* Before/After Comparison */}
              <div className="relative overflow-hidden rounded-lg bg-muted" style={{ aspectRatio: '4/3' }}>
                {/* After (Result) - Full width background */}
                <img
                  src={resultUrl}
                  alt="After"
                  className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                  onClick={() => setLightboxOpen(true)}
                />
                
                {/* Before (Original) - Clipped */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${comparisonPosition}%` }}
                >
                  <img
                    src={previewUrl}
                    alt="Before"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ 
                      width: `${100 / (comparisonPosition / 100)}%`,
                      maxWidth: 'none'
                    }}
                  />
                </div>

                {/* Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                  style={{ left: `${comparisonPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <div className="flex gap-0.5">
                      <div className="w-0.5 h-4 bg-gray-400" />
                      <div className="w-0.5 h-4 bg-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  לפני
                </div>
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  אחרי
                </div>

                {/* Zoom indicator */}
                <div className="absolute bottom-2 left-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-black/50 hover:bg-black/70"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <ZoomIn className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>

              {/* Comparison Slider */}
              <div className="space-y-2">
                <Label>השוואה: לפני ← אחרי</Label>
                <Slider
                  value={[comparisonPosition]}
                  onValueChange={([value]) => setComparisonPosition(value)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  הורד תמונה
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setSaveDialogOpen(true)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  שמור לנכס
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Sofa className="h-16 w-16 mb-4 opacity-20" />
              <p>העלה תמונה ובחר הגדרות כדי להתחיל</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={resultUrl ? [resultUrl] : []}
        currentIndex={0}
        onNavigate={() => {}}
      />

      {/* Save to Property Dialog */}
      <SaveToPropertyDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        imageUrl={resultUrl}
      />
    </div>
  );
};
