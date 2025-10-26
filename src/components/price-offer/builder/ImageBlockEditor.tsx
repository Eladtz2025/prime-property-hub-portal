import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from './ImageUploader';

interface ImageBlockEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  offerId: string;
  blockId?: string;
  initialData?: any;
}

const ImageBlockEditor = ({ open, onClose, onSave, offerId, blockId, initialData }: ImageBlockEditorProps) => {
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData?.images) {
      setImages(initialData.images);
    }
  }, [initialData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save block data first
      onSave({ images });

      // If we have a blockId (after the block is created), save images to the database
      if (blockId && images.length > 0) {
        // Delete existing images for this block
        await supabase
          .from('price_offer_images')
          .delete()
          .eq('block_id', blockId);

        // Insert new images
        const imageRecords = images.map((url, index) => ({
          offer_id: offerId,
          block_id: blockId,
          image_url: url,
          image_order: index,
        }));

        const { error } = await supabase
          .from('price_offer_images')
          .insert(imageRecords);

        if (error) throw error;
      }

      toast({
        title: 'נשמר!',
        description: 'התמונות נשמרו בהצלחה',
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>העלאת תמונות</DialogTitle>
        </DialogHeader>

        <ImageUploader
          offerId={offerId}
          images={images}
          onImagesChange={setImages}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageBlockEditor;