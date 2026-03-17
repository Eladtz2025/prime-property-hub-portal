import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Sofa, Eraser, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { enhancementTypeTranslations, roomTypeTranslations, styleTranslations } from './utils';

interface PhotoStudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onImageReplace: (newUrl: string) => void;
}

const enhancementTypes = [
  { value: 'lighting', label: 'שיפור תאורה וצבעים' },
  { value: 'declutter', label: 'הסרת אי-סדר' },
  { value: 'staging', label: 'Virtual Staging' },
  { value: 'general', label: 'שיפור כללי' },
];

const roomTypes = [
  { value: 'living_room', label: 'סלון' },
  { value: 'bedroom', label: 'חדר שינה' },
  { value: 'kitchen', label: 'מטבח' },
  { value: 'bathroom', label: 'חדר רחצה' },
  { value: 'dining_room', label: 'פינת אוכל' },
  { value: 'office', label: 'חדר עבודה' },
  { value: 'balcony', label: 'מרפסת' },
  { value: 'exterior', label: 'חזית בניין' },
];

const styles = [
  { value: 'modern', label: 'מודרני' },
  { value: 'classic', label: 'קלאסי' },
  { value: 'minimalist', label: 'מינימליסטי' },
  { value: 'luxury', label: 'יוקרתי' },
  { value: 'scandinavian', label: 'סקנדינבי' },
  { value: 'industrial', label: 'תעשייתי' },
  { value: 'mediterranean', label: 'ים תיכוני' },
  { value: 'bohemian', label: 'בוהמייני' },
];

export const PhotoStudioDialog: React.FC<PhotoStudioDialogProps> = ({
  open,
  onOpenChange,
  imageUrl,
  onImageReplace,
}) => {
  const [activeTab, setActiveTab] = useState('enhance');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Enhance state
  const [enhancementType, setEnhancementType] = useState('general');
  const [customDescription, setCustomDescription] = useState('');

  // Staging state
  const [roomType, setRoomType] = useState('living_room');
  const [style, setStyle] = useState('modern');
  const [stagingDescription, setStagingDescription] = useState('');

  // Remove state
  const [removalDescription, setRemovalDescription] = useState('');

  const resetState = () => {
    setResultUrl(null);
    setCustomDescription('');
    setStagingDescription('');
    setRemovalDescription('');
    setIsProcessing(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const handleEnhance = async () => {
    setIsProcessing(true);
    try {
      const base64Image = await fetchImageAsBase64(imageUrl);
      let prompt = enhancementTypeTranslations[enhancementType] || enhancementTypeTranslations.general;
      if (customDescription.trim()) {
        prompt += `. Additional instructions: ${customDescription.trim()}`;
      }

      const { data, error } = await supabase.functions.invoke('generate-property-image', {
        body: { type: 'enhance', image: base64Image, enhancementType, prompt }
      });
      if (error) throw error;
      if (data?.imageUrl) {
        setResultUrl(data.imageUrl);
        toast.success('התמונה שופרה בהצלחה!');
      }
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בשיפור התמונה');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStaging = async () => {
    setIsProcessing(true);
    try {
      const base64Image = await fetchImageAsBase64(imageUrl);
      const roomTypeEn = roomTypeTranslations[roomType] || roomType;
      const styleEn = styleTranslations[style] || style;

      const { data, error } = await supabase.functions.invoke('generate-property-image', {
        body: {
          type: 'staging',
          image: base64Image,
          stagingMode: 'add',
          roomType: roomTypeEn,
          style: styleEn,
          customDescription: stagingDescription.trim() || undefined,
        }
      });
      if (error) throw error;
      if (data?.imageUrl) {
        setResultUrl(data.imageUrl);
        toast.success('העיצוב הושלם בהצלחה!');
      }
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בעיצוב');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async () => {
    if (!removalDescription.trim()) {
      toast.error('יש לתאר מה להסיר מהתמונה');
      return;
    }
    setIsProcessing(true);
    try {
      const base64Image = await fetchImageAsBase64(imageUrl);
      const { data, error } = await supabase.functions.invoke('generate-property-image', {
        body: {
          type: 'enhance',
          image: base64Image,
          enhancementType: 'declutter',
          prompt: `Remove the following from the image: ${removalDescription.trim()}. Fill the area naturally with appropriate background.`,
        }
      });
      if (error) throw error;
      if (data?.imageUrl) {
        setResultUrl(data.imageUrl);
        toast.success('האלמנטים הוסרו בהצלחה!');
      }
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בהסרת אלמנטים');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReplace = () => {
    if (resultUrl) {
      onImageReplace(resultUrl);
      toast.success('התמונה הוחלפה בהצלחה!');
      handleClose(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            סטודיו תמונות
          </DialogTitle>
        </DialogHeader>

        {/* Current / Result Preview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground text-center">מקור</p>
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img src={imageUrl} alt="מקור" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground text-center">תוצאה</p>
            <div className="aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {resultUrl ? (
                <img src={resultUrl} alt="תוצאה" className="w-full h-full object-cover" />
              ) : (
                <p className="text-xs text-muted-foreground">טרם עובד</p>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enhance" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Wand2 className="h-3.5 w-3.5" />
              שיפור
            </TabsTrigger>
            <TabsTrigger value="staging" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Sofa className="h-3.5 w-3.5" />
              ריהוט
            </TabsTrigger>
            <TabsTrigger value="remove" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Eraser className="h-3.5 w-3.5" />
              הסרה
            </TabsTrigger>
          </TabsList>

          {/* Enhance Tab */}
          <TabsContent value="enhance" className="space-y-4 mt-4">
            <RadioGroup value={enhancementType} onValueChange={setEnhancementType}>
              <div className="grid grid-cols-2 gap-2">
                {enhancementTypes.map(type => (
                  <div key={type.value} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={type.value} id={`studio-${type.value}`} />
                    <label htmlFor={`studio-${type.value}`} className="text-sm cursor-pointer">{type.label}</label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            <Textarea
              placeholder="הוראות נוספות (אופציונלי)..."
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              maxLength={200}
              className="resize-none"
              rows={2}
            />
            <Button onClick={handleEnhance} disabled={isProcessing} className="w-full">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Wand2 className="h-4 w-4 ml-2" />}
              {isProcessing ? 'משפר...' : 'שפר תמונה'}
            </Button>
          </TabsContent>

          {/* Staging Tab */}
          <TabsContent value="staging" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">סוג חדר</Label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roomTypes.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">סגנון</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {styles.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea
              placeholder="תיאור ריהוט מותאם (אופציונלי)..."
              value={stagingDescription}
              onChange={(e) => setStagingDescription(e.target.value)}
              maxLength={300}
              className="resize-none"
              rows={2}
            />
            <Button onClick={handleStaging} disabled={isProcessing} className="w-full">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Sofa className="h-4 w-4 ml-2" />}
              {isProcessing ? 'מעצב...' : 'הוסף ריהוט'}
            </Button>
          </TabsContent>

          {/* Remove Tab */}
          <TabsContent value="remove" className="space-y-4 mt-4">
            <Textarea
              placeholder="תאר מה להסיר מהתמונה (למשל: ספה ישנה, כבלים על הרצפה...)"
              value={removalDescription}
              onChange={(e) => setRemovalDescription(e.target.value)}
              maxLength={300}
              className="resize-none"
              rows={3}
            />
            <Button onClick={handleRemove} disabled={isProcessing || !removalDescription.trim()} className="w-full">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Eraser className="h-4 w-4 ml-2" />}
              {isProcessing ? 'מסיר...' : 'הסר אלמנטים'}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Replace Button */}
        {resultUrl && (
          <Button onClick={handleReplace} className="w-full" variant="default">
            <Check className="h-4 w-4 ml-2" />
            החלף תמונה
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
