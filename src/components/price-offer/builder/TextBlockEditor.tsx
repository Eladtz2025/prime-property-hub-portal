import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

interface TextBlockEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

const TextBlockEditor = ({ open, onClose, onSave, initialData }: TextBlockEditorProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
    }
  }, [initialData]);

  const handleSave = () => {
    onSave({ title, content });
  };

  const editorOptions = useMemo(() => ({
    placeholder: 'כתוב כאן את התוכן... תמיכה ב-Markdown: **מודגש**, *נטוי*, ### כותרת',
    spellChecker: false,
    direction: 'rtl' as 'rtl',
    toolbar: ['bold', 'italic', 'heading', '|', 'unordered-list', 'ordered-list', '|', 'link', 'preview'] as any,
    status: false,
    autofocus: true,
  }), []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת טקסט</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="text-title">כותרת (אופציונלי)</Label>
            <Input
              id="text-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="הסבר על המחיר"
            />
          </div>

          <div>
            <Label htmlFor="text-content">תוכן</Label>
            <div className="border rounded-md overflow-hidden">
              <SimpleMDE
                value={content}
                onChange={setContent}
                options={editorOptions}
              />
            </div>
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

export default TextBlockEditor;