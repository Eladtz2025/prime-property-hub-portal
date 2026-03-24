import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Bot, ChevronDown, Plus, Trash2, Edit2, Play, Pause, Building2, Newspaper, Clock, Facebook, Instagram, Eye, RotateCcw } from 'lucide-react';
import { useAutoPublishQueues, useSaveAutoPublishQueue, useToggleAutoPublishQueue, useDeleteAutoPublishQueue, useWebsiteProperties } from '@/hooks/useAutoPublish';
import { AutoPublishArticles } from './AutoPublishArticles';
import { AutoPublishLog } from './AutoPublishLog';
import { ConfirmDialog } from './ConfirmDialog';
import { HashtagGroupSelector } from './HashtagGroupSelector';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const FREQUENCY_OPTIONS = [
  { value: '1', label: 'יומי' },
  { value: '2', label: 'כל יומיים' },
  { value: '3', label: 'כל 3 ימים' },
  { value: '7', label: 'שבועי' },
];

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

  const [editDialog, setEditDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewQueueId, setPreviewQueueId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'property_rotation' | 'article_oneshot'>('property_rotation');
  const [formTemplate, setFormTemplate] = useState(DEFAULT_PROPERTY_TEMPLATE);
  const [formHashtags, setFormHashtags] = useState('');
  const [formTime, setFormTime] = useState('10:00');
  const [formFrequencyDays, setFormFrequencyDays] = useState('1');
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
    setFormFrequencyDays(type === 'property_rotation' ? '1' : '7');
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
    setFormFrequencyDays(String((queue as Record<string, unknown>).frequency_days || 1));
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
      frequency_days: parseInt(formFrequencyDays),
      frequency: parseInt(formFrequencyDays) >= 7 ? 'weekly' : 'daily',
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

  const getCycleInfo = (queue: Record<string, unknown>) => {
    if (!properties || properties.length === 0) return null;
    const totalProps = properties.length;
    const currentIdx = ((queue.current_index as number) || 0) % totalProps;
    // Rough cycle calculation
    const totalPublished = (queue.current_index as number) || 0;
    const cycle = Math.floor(totalPublished / totalProps) + 1;
    return { currentIdx, totalProps, cycle, progress: ((currentIdx) / totalProps) * 100 };
  };

  const buildPreviewText = (queue: Record<string, unknown>) => {
    const nextProp = getNextProperty(queue);
    if (!nextProp) return 'אין דירות זמינות';
    const template = (queue.template_text as string) || '{address}';
    return template
      .replace(/{address}/g, nextProp.address || '')
      .replace(/{city}/g, nextProp.city || '')
      .replace(/{neighborhood}/g, nextProp.neighborhood || '')
      .replace(/{rooms}/g, nextProp.rooms?.toString() || '')
      .replace(/{size}/g, nextProp.property_size?.toString() || '')
      .replace(/{floor}/g, nextProp.floor?.toString() || '')
      .replace(/{price}/g, nextProp.monthly_rent ? `₪${Number(nextProp.monthly_rent).toLocaleString()}` : '');
  };

  const getFrequencyLabel = (days: number) => {
    return FREQUENCY_OPTIONS.find(f => f.value === String(days))?.label || `כל ${days} ימים`;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">פרסום אוטומטי</span>
          {activeCount > 0 && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
              {activeCount} פעילים
            </Badge>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="text-[11px] h-7 gap-1" onClick={() => openNewDialog('property_rotation')}>
            <Building2 className="h-3 w-3" />
            תור דירות
            <Plus className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="text-[11px] h-7 gap-1" onClick={() => openNewDialog('article_oneshot')}>
            <Newspaper className="h-3 w-3" />
            תור כתבות
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Queue cards */}
      {isLoading && <p className="text-xs text-muted-foreground px-1">טוען...</p>}
      
      {queues?.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">עוד אין תורות פרסום</p>
            <p className="text-xs text-muted-foreground mt-1">צור תור חדש כדי להתחיל לפרסם אוטומטית</p>
          </CardContent>
        </Card>
      )}

      {queues?.map(queue => {
        const nextProp = queue.queue_type === 'property_rotation' ? getNextProperty(queue) : null;
        const cycleInfo = queue.queue_type === 'property_rotation' ? getCycleInfo(queue) : null;
        const freqDays = (queue as Record<string, unknown>).frequency_days as number || 1;
        const isPreviewOpen = previewQueueId === queue.id;

        return (
          <Card key={queue.id} className={`transition-all ${queue.is_active ? 'border-primary/20 shadow-sm' : 'opacity-50 border-muted'}`}>
            <CardContent className="p-3 space-y-2.5">
              {/* Top row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${queue.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                    {queue.queue_type === 'property_rotation' ? (
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Newspaper className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{queue.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {queue.publish_time}
                      </span>
                      <span>·</span>
                      <span>{getFrequencyLabel(freqDays)}</span>
                      <span>·</span>
                      {(queue.platforms as string[])?.map(p => (
                        <span key={p}>
                          {p === 'facebook_page' ? <Facebook className="h-2.5 w-2.5 text-blue-500 inline" /> : <Instagram className="h-2.5 w-2.5 text-pink-500 inline" />}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={queue.is_active}
                    onCheckedChange={(checked) => toggleQueue.mutate({ id: queue.id, is_active: checked })}
                    className="scale-90"
                  />
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditDialog(queue)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDeleteConfirm(queue.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Progress bar for property rotation */}
              {queue.queue_type === 'property_rotation' && cycleInfo && queue.is_active && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <RotateCcw className="h-2.5 w-2.5" />
                      סבב {cycleInfo.cycle} · דירה {cycleInfo.currentIdx + 1}/{cycleInfo.totalProps}
                    </span>
                    {queue.last_published_at && (
                      <span>אחרון: {new Date(queue.last_published_at).toLocaleDateString('he-IL')}</span>
                    )}
                  </div>
                  <Progress value={cycleInfo.progress} className="h-1.5" />
                </div>
              )}

              {/* Article stats */}
              {queue.queue_type === 'article_oneshot' && (
                <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                  {queue.last_published_at && (
                    <span>אחרון: {new Date(queue.last_published_at).toLocaleDateString('he-IL')}</span>
                  )}
                  {queue.next_publish_day !== null && (
                    <span>· יום הבא: {DAYS[queue.next_publish_day as number]}</span>
                  )}
                </div>
              )}

              {/* Next property preview */}
              {nextProp && queue.is_active && (
                <div className="space-y-1">
                  <div className="bg-muted/40 rounded-md px-2.5 py-2 text-[11px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground font-medium">הבא בתור:</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 text-[10px] px-1.5 gap-0.5 text-muted-foreground"
                        onClick={() => setPreviewQueueId(isPreviewOpen ? null : queue.id)}
                      >
                        <Eye className="h-2.5 w-2.5" />
                        {isPreviewOpen ? 'הסתר' : 'תצוגה מקדימה'}
                      </Button>
                    </div>
                    <div className="font-medium">
                      {nextProp.address}, {nextProp.neighborhood || nextProp.city}
                      {nextProp.monthly_rent && <span className="text-primary mr-1.5">₪{Number(nextProp.monthly_rent).toLocaleString()}</span>}
                    </div>
                  </div>

                  {/* Full preview */}
                  {isPreviewOpen && (
                    <div className="bg-card border rounded-md p-3 text-xs whitespace-pre-wrap leading-relaxed">
                      {buildPreviewText(queue)}
                      {queue.hashtags && (
                        <div className="mt-2 text-primary/70 text-[10px]">{queue.hashtags}</div>
                      )}
                    </div>
                  )}
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

      {/* Log */}
      <Collapsible open={logOpen} onOpenChange={setLogOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-xs text-muted-foreground">
          <span>היסטוריית פרסום אוטומטי</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${logOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <AutoPublishLog />
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

            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">תדירות</Label>
                <Select value={formFrequencyDays} onValueChange={setFormFrequencyDays}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">שעת פרסום</Label>
                <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="h-8 text-sm w-28" />
              </div>
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
