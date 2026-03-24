import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, CheckCircle, Clock } from 'lucide-react';
import { useAutoPublishItems, useSaveAutoPublishItem, useDeleteAutoPublishItem } from '@/hooks/useAutoPublish';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  queueId: string;
}

export const AutoPublishArticles: React.FC<Props> = ({ queueId }) => {
  const { data: items } = useAutoPublishItems(queueId);
  const saveItem = useSaveAutoPublishItem();
  const deleteItem = useDeleteAutoPublishItem();

  const [dialog, setDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const publishedCount = items?.filter(i => i.is_published).length || 0;
  const totalCount = items?.length || 0;

  const openNew = () => {
    setEditId(null);
    setTitle('');
    setContent('');
    setLinkUrl('');
    setImageUrl('');
    setDialog(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditId(item.id as string);
    setTitle(item.title as string);
    setContent(item.content_text as string);
    setLinkUrl(item.link_url as string || '');
    setImageUrl((item.image_urls as string[])?.[0] || '');
    setDialog(true);
  };

  const handleSave = () => {
    saveItem.mutate({
      ...(editId ? { id: editId } : {}),
      queue_id: queueId,
      title,
      content_text: content,
      link_url: linkUrl,
      image_urls: imageUrl ? [imageUrl] : [],
    }, {
      onSuccess: () => setDialog(false),
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {publishedCount}/{totalCount} כתבות פורסמו
        </span>
        <Button size="sm" variant="ghost" className="h-6 text-[11px] gap-1 px-2" onClick={openNew}>
          <Plus className="h-3 w-3" />
          כתבה
        </Button>
      </div>

      {items?.map(item => (
        <div
          key={item.id}
          className={`flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
            item.is_published ? 'bg-green-500/10 text-muted-foreground' : 'bg-muted/30'
          }`}
        >
          {item.is_published ? (
            <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
          ) : (
            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <span className="flex-1 truncate">{item.title || 'ללא כותרת'}</span>
          {item.is_published && item.published_at && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {new Date(item.published_at).toLocaleDateString('he-IL')}
            </span>
          )}
          {!item.is_published && (
            <>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => openEdit(item)}>
                <Edit2 className="h-2.5 w-2.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive" onClick={() => setDeleteConfirm(item.id)}>
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </>
          )}
        </div>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'עריכת כתבה' : 'כתבה חדשה'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">כותרת</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-sm" placeholder="כותרת הכתבה" />
            </div>
            <div>
              <Label className="text-xs">תוכן</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} className="text-sm min-h-[80px]" placeholder="טקסט הכתבה..." dir="rtl" />
            </div>
            <div>
              <Label className="text-xs">קישור (אופציונלי)</Label>
              <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="h-8 text-sm" placeholder="https://..." dir="ltr" />
            </div>
            <div>
              <Label className="text-xs">URL תמונה (אופציונלי)</Label>
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="h-8 text-sm" placeholder="https://..." dir="ltr" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)} className="text-sm h-8">ביטול</Button>
            <Button onClick={handleSave} disabled={saveItem.isPending} className="text-sm h-8">
              {saveItem.isPending ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="מחיקת כתבה"
        description="האם אתה בטוח שברצונך למחוק כתבה זו?"
        onConfirm={() => {
          if (deleteConfirm) {
            deleteItem.mutate(deleteConfirm);
            setDeleteConfirm(null);
          }
        }}
      />
    </div>
  );
};
