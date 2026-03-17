import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Check, Loader2, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PhotoStudioDialog } from '@/components/photo-studio/PhotoStudioDialog';

interface BackgroundImagePickerProps {
  propertyId?: string;
  value: string;
  onChange: (url: string) => void;
}

const BackgroundImagePicker = ({ propertyId, value, onChange }: BackgroundImagePickerProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [studioOpen, setStudioOpen] = useState(false);

  // Fetch images from property_images table
  const { data: propertyImages, isLoading } = useQuery({
    queryKey: ['property-images-picker', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId)
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('יש להעלות קובץ תמונה בלבד');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('גודל הקובץ חייב להיות עד 10MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pitch-deck-bg-${Date.now()}.${fileExt}`;
      const filePath = `pitch-deck-backgrounds/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('התמונה הועלתה בהצלחה');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('שגיאה בהעלאת התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>תמונת רקע</Label>

      {/* Property Gallery Grid */}
      {propertyId && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : propertyImages && propertyImages.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">בחר מגלריית הנכס:</p>
              {/* Simple grid-based gallery - Safari compatible */}
              <div className="relative">
                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                  {propertyImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => onChange(img.image_url)}
                      className={cn(
                        "flex-shrink-0 w-16 h-10 rounded-md overflow-hidden cursor-pointer border-2 transition-all hover:opacity-90 relative",
                        value === img.image_url 
                          ? "border-primary ring-2 ring-primary/30" 
                          : "border-transparent hover:border-muted-foreground/30"
                      )}
                    >
                      <img 
                        src={img.image_url} 
                        alt={img.alt_text || 'תמונת נכס'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      {value === img.image_url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground bg-primary rounded-full p-0.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">אין תמונות בגלריית הנכס</p>
          )}
        </div>
      )}

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button 
          type="button"
          variant="outline" 
          className="flex-1"
          disabled={isUploading}
          onClick={() => document.getElementById('bg-image-upload')?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 ml-2" />
          )}
          העלה תמונה מהמחשב
        </Button>
        <input
          id="bg-image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Manual URL Input */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">או הזן כתובת URL:</p>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          dir="ltr"
        />
      </div>

      {/* Current Image Preview */}
      {value && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">נבחר:</p>
          <div className="w-16 h-10 rounded overflow-hidden border bg-muted flex-shrink-0">
            <img 
              src={value} 
              alt="תצוגה מקדימה"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundImagePicker;
