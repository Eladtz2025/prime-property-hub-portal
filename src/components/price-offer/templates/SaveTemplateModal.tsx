import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SaveTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, isPublic: boolean) => void;
  saving?: boolean;
}

const SaveTemplateModal = ({ open, onClose, onSave, saving }: SaveTemplateModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name, description, isPublic);
    setName('');
    setDescription('');
    setIsPublic(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>שמור כתבנית</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="template-name">שם התבנית</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="דירת 3 חדרים בתל אביב"
            />
          </div>

          <div>
            <Label htmlFor="template-description">תיאור (אופציונלי)</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תבנית להצעת מחיר סטנדרטית..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is-public" className="cursor-pointer">שתף עם כל המשתמשים</Label>
            <Switch
              id="is-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'שומר...' : 'שמור תבנית'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveTemplateModal;
