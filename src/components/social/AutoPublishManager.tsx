import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Bot, ChevronDown, Plus, Trash2, Edit2, Play, Pause, Building2, Newspaper, Clock, Facebook, Instagram } from 'lucide-react';
import { useAutoPublishQueues, useSaveAutoPublishQueue, useToggleAutoPublishQueue, useDeleteAutoPublishQueue, useWebsiteProperties } from '@/hooks/useAutoPublish';
import { AutoPublishArticles } from './AutoPublishArticles';
import { AutoPublishLog } from './AutoPublishLog';
import { ConfirmDialog } from './ConfirmDialog';
import { HashtagGroupSelector } from './HashtagGroupSelector';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const DEFAULT_PROPERTY_TEMPLATE = `🏠 דירה להשכרה!

📍 {address}, {neighborhood}, {city}
🛏️ {rooms} חדרים | 📐 {size} מ"ר | 🏢 קומה {floor}
💰 {price} לחודש

{description}

📞 לפרטים נוספים צרו קשר`;

export const AutoPublishManager: React.FC = () => {
  const { data: queues, isLoading } = useAutoPublishQueues();
  const { data: properties } = useWebsiteProperties();
  const saveQueue = useSaveAutoPublishQueue();
  const toggleQueue = useToggleAutoPublishQueue();
  const deleteQueue = useDeleteAutoPublishQueue();

  const [open, setOpen] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'property_rotation' | 'article_oneshot'>('property_rotation');
  const [formTemplate, setFormTemplate] = useState(DEFAULT_PROPERTY_TEMPLATE);
  const [formHashtags, setFormHashtags] = useState('');
  const [formTime, setFormTime] = useState('10:00');
  const [formPlatforms, setFormPlatforms] = useState<string[]>(['facebook_page']);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeCount = queues?.filter(q => q.is_active).length || 0;

  const openNewDialog = (type: 'property_rotation' | 'article_oneshot') => {
    setEditingId(null);
    setFormName(type === 'property_rotation' ? 'פרסום דירות יומי' : 'כתבה שבועית');
    setFormType(type);
    setFormTemplate(type === 'property_rotation' ? DEFAULT_PROPERTY_TEMPLATE : '');
    setFormHashtags('');
    setFormTime('10:00');
    setFormPlatforms(['facebook_page']);
    setEditDialog(true);
  };

  const openEditDialog = (queue: Record<string, unknown>) => {
    setEditingId(queue.id as string);
    setFormName(queue.name as string);
    setFormType(queue.queue_type as 'property_rotation' | 'article_oneshot');
    setFormTemplate(queue.template_text as string);
    setFormHashtags(queue.hashtags as string || '');
    setFormTime(queue.publish_time as string || '10:00');
    setFormPlatforms(queue.platforms as string[] || ['facebook_page']);
    setEditDialog(true);
  };

  const handleSave = () => {
    saveQueue.mutate({
      ...(editingId ? { id: editingId } : {}),
      name: formName,
      queue_type: formType,
      platforms: formPlatforms,
      template_text: formTemplate,
      hashtags: formHashtags,
      publish_time: formTime,
      frequency: formType === 'property_rotation' ? 'daily' : 'weekly',
    }, {
      onSuccess: () => setEditDialog(false),
    });
  };

  const togglePlatform = (p: string) => {
    setFormPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const getNextProperty = (queue: Record<string, unknown>) => {
    if (!properties || properties.length === 0) return null;
    const idx = (queue.current_index as number) || 0;
    return properties[idx >= properties.length ? 0 : idx];
  };

  return (
    <div className="space-y-2">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium">
          <span className="flex items-center gap-2">
            <Bot className="h-3.5 w-3.5" />
            פרסום אוטומטי
            {activeCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {activeCount} פעילים
              </Badge>
            )}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-2 space-y-2">
          {/* Add buttons */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => openNewDialog('property_rotation')}>
              <Building2 className="h-3 w-3" />
              תור דירות
              <Plus className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => openNewDialog('article_oneshot')}>
              <Newspaper className="h-3 w-3" />
              תור כתבות
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Queue cards */}
          {isLoading && <p className="text-xs text-muted-foreground px-1">טוען...</p>}
          {queues?.map(queue => {
            const nextProp = queue.queue_type === 'property_rotation' ? getNextProperty(queue) : null;
            return (
              <Card key={queue.id} className={`border ${queue.is_active ? 'border-primary/30 bg-primary/5' : 'opacity-60'}`}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {queue.queue_type === 'property_rotation' ? (
                        <Building2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Newspaper className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-sm font-medium">{queue.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {queue.frequency === 'daily' ? 'יומי' : 'שבועי'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={queue.is_active}
                        onCheckedChange={(checked) => toggleQueue.mutate({ id: queue.id, is_active: checked })}
                      />
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditDialog(queue)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDeleteConfirm(queue.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Info line */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {queue.publish_time}
                    </span>
                    {(queue.platforms as string[])?.map(p => (
                      <span key={p} className="flex items-center gap-0.5">
                        {p === 'facebook_page' ? <Facebook className="h-3 w-3 text-blue-500" /> : <Instagram className="h-3 w-3 text-pink-500" />}
                      </span>
                    ))}
                    {queue.last_published_at && (
                      <span>
                        אחרון: {new Date(queue.last_published_at).toLocaleDateString('he-IL')}
                      </span>
                    )}
                    {queue.queue_type === 'property_rotation' && properties && (
                      <span>{properties.length} דירות בתור</span>
                    )}
                    {queue.queue_type === 'article_oneshot' && queue.next_publish_day !== null && (
                      <span>יום הבא: {DAYS[queue.next_publish_day as number]}</span>
                    )}
                  </div>

                  {/* Next property preview */}
                  {nextProp && queue.is_active && (
                    <div className="bg-muted/50 rounded px-2 py-1.5 text-[11px]">
                      <span className="text-muted-foreground">הבא בתור: </span>
                      <span className="font-medium">{nextProp.address}, {nextProp.neighborhood || nextProp.city}</span>
                      {nextProp.monthly_rent && <span className="text-primary mr-1">₪{Number(nextProp.monthly_rent).toLocaleString()}</span>}
                    </div>
                  )}

                  {/* Articles management for article queues */}
                  {queue.queue_type === 'article_oneshot' && (
                    <AutoPublishArticles queueId={queue.id} />
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Log toggle */}
          <Collapsible open={logOpen} onOpenChange={setLogOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-xs text-muted-foreground">
              <span>היסטוריית פרסום אוטומטי</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${logOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <AutoPublishLog />
            </CollapsibleContent>
          </Collapsible>
        </CollapsibleContent>
      </Collapsible>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'עריכת תור' : 'תור חדש'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">שם התור</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} className="h-8 text-sm" />
            </div>

            <div>
              <Label className="text-xs">פלטפורמות</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  size="sm"
                  variant={formPlatforms.includes('facebook_page') ? 'default' : 'outline'}
                  className="h-7 text-xs gap-1"
                  onClick={() => togglePlatform('facebook_page')}
                >
                  <Facebook className="h-3 w-3" /> Facebook
                </Button>
                <Button
                  size="sm"
                  variant={formPlatforms.includes('instagram') ? 'default' : 'outline'}
                  className="h-7 text-xs gap-1"
                  onClick={() => togglePlatform('instagram')}
                >
                  <Instagram className="h-3 w-3" /> Instagram
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs">שעת פרסום</Label>
              <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="h-8 text-sm w-32" />
            </div>

            {formType === 'property_rotation' && (
              <div>
                <Label className="text-xs">תבנית פוסט (placeholders: {'{address}'}, {'{price}'}, {'{rooms}'}, {'{size}'}, {'{floor}'}, {'{neighborhood}'}, {'{city}'}, {'{description}'})</Label>
                <Textarea
                  value={formTemplate}
                  onChange={e => setFormTemplate(e.target.value)}
                  className="text-sm min-h-[120px]"
                  dir="rtl"
                />
              </div>
            )}

            <div>
              <Label className="text-xs">האשטגים</Label>
              <HashtagGroupSelector value={formHashtags} onChange={setFormHashtags} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)} className="text-sm h-8">ביטול</Button>
            <Button onClick={handleSave} disabled={saveQueue.isPending} className="text-sm h-8">
              {saveQueue.isPending ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="מחיקת תור"
        description="האם אתה בטוח שברצונך למחוק תור זה? כל הכתבות וההיסטוריה ימחקו."
        onConfirm={() => {
          if (deleteConfirm) {
            deleteQueue.mutate(deleteConfirm);
            setDeleteConfirm(null);
          }
        }}
      />
    </div>
  );
};
