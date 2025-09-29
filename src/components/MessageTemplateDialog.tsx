import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageTemplate } from '@/hooks/useMessageTemplates';

interface MessageTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
  template?: MessageTemplate | null;
  isLoading?: boolean;
}

export const MessageTemplateDialog: React.FC<MessageTemplateDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  template,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setContent(template.content);
      setCategory(template.category);
    } else {
      setName('');
      setContent('');
      setCategory('general');
    }
  }, [template]);

  const handleSave = () => {
    if (!name.trim() || !content.trim()) return;

    onSave({
      name: name.trim(),
      content: content.trim(),
      category,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{template ? 'עריכת תבנית' : 'תבנית חדשה'}</DialogTitle>
          <DialogDescription>
            {template ? 'ערוך את פרטי התבנית' : 'צור תבנית הודעה חדשה. השתמש ב-{שם} ו-{כתובת} למילוי אוטומטי.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">שם התבנית</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: שיחה ראשונית"
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">קטגוריה</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="לדוגמה: שיחה ראשונה"
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">תוכן ההודעה</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="היי {שם}, מה שלומך?"
              rows={5}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              השתמש ב-{'{שם}'} עבור שם הבעלים וב-{'{כתובת}'} עבור כתובת הנכס
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            ביטול
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !content.trim() || isLoading}
          >
            {template ? 'עדכן' : 'צור תבנית'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
