import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  offerId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const ImageUploader = ({ offerId, images, onImagesChange }: ImageUploaderProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${offerId}/${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('price-offer-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('price-offer-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      onImagesChange([...images, ...uploadedUrls]);
      
      toast({
        title: 'תמונות הועלו!',
        description: `${uploadedUrls.length} תמונות הועלו בהצלחה`,
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה בהעלאה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          disabled={uploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              {uploading ? 'מעלה תמונות...' : 'גרור קבצים או לחץ להעלאה'}
            </p>
          </div>
        </label>
      </div>

      {images.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">תמונות שהועלו ({images.length})</h4>
          <div className="grid grid-cols-3 gap-4">
            {images.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`תמונה ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;