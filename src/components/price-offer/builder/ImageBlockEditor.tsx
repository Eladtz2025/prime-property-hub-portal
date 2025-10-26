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

  const handleSave = () => {
    // Just save the images in block_data
    // The actual database insert will happen when the offer is saved
    onSave({ images });
    
    toast({
      title: 'נשמר!',
      description: 'התמונות נשמרו בהצלחה',
    });
    
    onClose();
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
          <Button onClick={handleSave}>שמור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageBlockEditor;