import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface MapBlockEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

const MapBlockEditor = ({ open, onClose, onSave, initialData }: MapBlockEditorProps) => {
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setAddress(initialData.address || '');
      setMapUrl(initialData.mapUrl || '');
    }
  }, [initialData]);

  const handleSave = () => {
    onSave({ title, address, mapUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוסף מפה</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="map-title">כותרת (אופציונלי)</Label>
            <Input
              id="map-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="מיקום הנכס"
            />
          </div>

          <div>
            <Label htmlFor="map-address">כתובת</Label>
            <Input
              id="map-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="רחוב פלוני 123, תל אביב"
            />
          </div>

          <div>
            <Label htmlFor="map-url">קישור Google Maps (אופציונלי)</Label>
            <Textarea
              id="map-url"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." ...'
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              1. פתח Google Maps → חפש את הכתובת<br />
              2. לחץ על "שתף" → "הטמע מפה"<br />
              3. העתק את כל הקוד והדבק כאן
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave}>שמור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapBlockEditor;
