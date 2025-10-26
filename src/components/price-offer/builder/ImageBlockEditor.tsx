import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ImageUploader from './ImageUploader';

interface ImageBlockEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  offerId: string;
  initialData?: any;
}

const ImageBlockEditor = ({ open, onClose, onSave, offerId, initialData }: ImageBlockEditorProps) => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (initialData?.images) {
      setImages(initialData.images);
    }
  }, [initialData]);

  const handleSave = () => {
    onSave({ images });
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