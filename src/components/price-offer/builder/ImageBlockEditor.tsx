import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [title, setTitle] = useState<string>('');
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData?.images) {
      setImages(initialData.images);
    }
    if (initialData?.title) {
      setTitle(initialData.title);
    }
    if (initialData?.imageSize) {
      setImageSize(initialData.imageSize);
    }
  }, [initialData]);

  const handleSave = () => {
    onSave({ images, title, imageSize });
    
    toast({
      title: 'נשמר!',
      description: 'בלוק התמונות נשמר בהצלחה',
    });
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>העלאת תמונות</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת (אופציונלי)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="הכנס כותרת לגלריה..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageSize">גודל תמונות</Label>
            <Select value={imageSize} onValueChange={(value: 'small' | 'medium' | 'large') => setImageSize(value)}>
              <SelectTrigger id="imageSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">קטן</SelectItem>
                <SelectItem value="medium">בינוני</SelectItem>
                <SelectItem value="large">גדול</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ImageUploader
            offerId={offerId}
            images={images}
            onImagesChange={setImages}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave}>שמור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageBlockEditor;