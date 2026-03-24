import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, RotateCcw } from 'lucide-react';
import { HashtagGroup, DEFAULT_HASHTAG_GROUPS } from './HashtagGroupSelector';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: HashtagGroup[];
  onSave: (groups: HashtagGroup[]) => void;
}

export const HashtagGroupsEditor: React.FC<Props> = ({ open, onOpenChange, groups, onSave }) => {
  const [draft, setDraft] = useState<HashtagGroup[]>([]);

  useEffect(() => {
    if (open) setDraft(groups.map(g => ({ ...g })));
  }, [open, groups]);

  const updateGroup = (idx: number, field: keyof HashtagGroup, val: string) => {
    setDraft(prev => prev.map((g, i) => i === idx ? { ...g, [field]: val } : g));
  };

  const updateTags = (idx: number, val: string) => {
    const tags = val.split(/\s+/).filter(Boolean).map(t => t.startsWith('#') ? t : `#${t}`);
    setDraft(prev => prev.map((g, i) => i === idx ? { ...g, tags } : g));
  };

  const addGroup = () => {
    setDraft(prev => [...prev, { id: `custom-${Date.now()}`, label: '', emoji: '📌', tags: [], isDefault: false }]);
  };

  const removeGroup = (idx: number) => {
    setDraft(prev => prev.filter((_, i) => i !== idx));
  };

  const resetDefaults = () => {
    setDraft(DEFAULT_HASHTAG_GROUPS.map(g => ({ ...g })));
    toast.success('אופס לברירת מחדל');
  };

  const handleSave = () => {
    const valid = draft.filter(g => g.label && g.tags.length > 0);
    onSave(valid);
    onOpenChange(false);
    toast.success('קבוצות האשטגים נשמרו');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">ניהול קבוצות האשטגים</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {draft.map((g, idx) => (
            <div key={g.id} className="border rounded-lg p-2.5 space-y-1.5 bg-muted/30">
              <div className="flex items-center gap-2">
                <Input
                  value={g.emoji}
                  onChange={e => updateGroup(idx, 'emoji', e.target.value)}
                  className="w-10 h-7 text-center text-xs p-0"
                />
                <Input
                  value={g.label}
                  onChange={e => updateGroup(idx, 'label', e.target.value)}
                  placeholder="שם הקבוצה"
                  className="flex-1 h-7 text-xs"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeGroup(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">האשטגים (מופרדים ברווח)</Label>
                <Input
                  value={g.tags.join(' ')}
                  onChange={e => updateTags(idx, e.target.value)}
                  placeholder="#tag1 #tag2 #tag3"
                  className="h-7 text-[11px]"
                  dir="ltr"
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={addGroup} className="flex-1 text-xs h-7">
              <Plus className="h-3 w-3 ml-1" />
              קבוצה חדשה
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={resetDefaults} className="text-xs h-7">
              <RotateCcw className="h-3 w-3 ml-1" />
              איפוס
            </Button>
          </div>

          <Button onClick={handleSave} className="w-full h-8 text-xs">
            שמור שינויים
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
