import React, { useState, useEffect } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, ChevronDown, ChevronUp, Plus, Trash2, Edit2, Building2, Newspaper, Clock, Facebook, Instagram, Eye, RotateCcw, Send, Save, Image, X, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAutoPublishQueues, useSaveAutoPublishQueue, useToggleAutoPublishQueue, useDeleteAutoPublishQueue, useWebsiteProperties } from '@/hooks/useAutoPublish';
import { useCreateSocialPost, usePublishPost, useSocialTemplates, useSocialAccounts } from '@/hooks/useSocialPosts';
import { useToast } from '@/hooks/use-toast';
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

type PublishMode = 'one_time' | 'recurring';
type QueueType = 'property_rotation' | 'article_oneshot';

export const AutoPublishManager: React.FC = () => {
  const { toast } = useToast();
  const { data: queues, isLoading } = useAutoPublishQueues();
  const { data: websiteProperties } = useWebsiteProperties();
  const saveQueue = useSaveAutoPublishQueue();
  const toggleQueue = useToggleAutoPublishQueue();
  const deleteQueue = useDeleteAutoPublishQueue();
  const createPost = useCreateSocialPost();
  const publishPost = usePublishPost();
  const { data: socialTemplates } = useSocialTemplates();
  const { data: accounts } = useSocialAccounts();

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewQueueId, setPreviewQueueId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  // Unified form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mode, setMode] = useState<PublishMode>('one_time');
  const [queueType, setQueueType] = useState<QueueType>('property_rotation');

  // Common fields
  const [formName, setFormName] = useState('');
  const [contentText, setContentText] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [platforms, setPlatforms] = useState({ facebook: true, instagram: false });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // One-time fields
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [properties, setProperties] = useState<any[]>([]);

  // Recurring fields
  const [formFrequencyDays, setFormFrequencyDays] = useState('1');
  const [formTime, setFormTime] = useState('10:00');
  const [propertyFilter, setPropertyFilter] = useState<'all' | 'rental' | 'sale'>('all');

  // Confirm
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'publish' | 'schedule' | null>(null);

  const activeCount = queues?.filter(q => q.is_active).length || 0;

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, address, city, rooms, property_size, floor, neighborhood, monthly_rent, current_market_value, description, property_type, property_images!inner(id)')
        .eq('show_on_website', true)
        .eq('status', 'vacant')
        .order('created_at', { ascending: false })
        .limit(100);
      setProperties(data || []);
    };
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setContentText('');
    setHashtags('');
    setPlatforms({ facebook: true, instagram: false });
    setImageUrls([]);
    setNewImageUrl('');
    setSelectedPropertyId('');
    setSelectedTemplateId('');
    setScheduleDate(undefined);
    setScheduleTime('10:00');
    setFormFrequencyDays('1');
    setFormTime('10:00');
    setQueueType('property_rotation');
    setPropertyFilter('all');
  };

  const openEditQueue = (queue: Record<string, unknown>) => {
    setEditingId(queue.id as string);
    setMode('recurring');
    setQueueType(queue.queue_type as QueueType);
    setFormName(queue.name as string);
    setContentText(queue.template_text as string);
    setHashtags(queue.hashtags as string || '');
    const qPlatforms = queue.platforms as string[] || [];
    setPlatforms({ facebook: qPlatforms.includes('facebook_page'), instagram: qPlatforms.includes('instagram') });
    setFormFrequencyDays(String((queue as any).frequency_days || 1));
    setFormTime(queue.publish_time as string || '10:00');
    setPropertyFilter(((queue as any).property_filter as 'all' | 'rental' | 'sale') || 'all');
  };

  // Property selection for one-time posts
  const fillPropertyPlaceholders = (text: string, prop: any): string => {
    const price = prop.monthly_rent
      ? `₪${Number(prop.monthly_rent).toLocaleString()}`
      : prop.current_market_value
        ? `₪${Number(prop.current_market_value).toLocaleString()}`
        : '';
    const typeLabel = prop.property_type === 'sale' ? 'מכירה' : prop.property_type === 'rental' ? 'השכרה' : prop.property_type || '';
    return text
      .replace(/{address}/g, prop.address || '')
      .replace(/{price}/g, price)
      .replace(/{rooms}/g, prop.rooms?.toString() || '')
      .replace(/{size}/g, prop.property_size?.toString() || '')
      .replace(/{floor}/g, prop.floor?.toString() || '')
      .replace(/{neighborhood}/g, prop.neighborhood || '')
      .replace(/{city}/g, prop.city || '')
      .replace(/{description}/g, prop.description || '')
      .replace(/{property_type}/g, typeLabel);
  };

  const handleSelectProperty = async (propId: string) => {
    setSelectedPropertyId(propId);
    if (propId === 'free') return;
    const prop = properties.find(p => p.id === propId);
    if (!prop) return;
    if (!selectedTemplateId) {
      const price = prop.monthly_rent
        ? `₪${Number(prop.monthly_rent).toLocaleString()}`
        : prop.current_market_value
          ? `₪${Number(prop.current_market_value).toLocaleString()}`
          : '';
      const typeLabel = prop.property_type === 'sale' ? 'למכירה' : 'להשכרה';
      setContentText(
        `🏠 דירה ${typeLabel} ב${prop.city || ''}\n\n📍 ${prop.address || ''}\n💰 ${price}\n🛏️ ${prop.rooms || ''} חדרים\n📐 ${prop.property_size || ''} מ"ר\n${prop.floor ? `🏢 קומה ${prop.floor}` : ''}\n\n${prop.description || ''}`
      );
      const tags = ['#נדלן', '#דירה' + typeLabel.replace('ל', 'ל')];
      if (prop.city) tags.push(`#${prop.city.replace(/\s/g, '')}`);
      if (prop.neighborhood) tags.push(`#${prop.neighborhood.replace(/\s/g, '')}`);
      setHashtags(tags.join(' '));
    } else {
      applyTemplate(selectedTemplateId);
    }
    const { data: images } = await supabase
      .from('property_images')
      .select('image_url')
      .eq('property_id', propId)
      .eq('show_on_website', true)
      .order('is_main', { ascending: false })
      .limit(10);
    if (images && images.length > 0) {
      setImageUrls(images.map(i => i.image_url));
    }
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = socialTemplates?.find(t => t.id === templateId);
    if (!tmpl) return;
    let text = tmpl.template_text;
    if (selectedPropertyId && selectedPropertyId !== 'free') {
      const prop = properties.find(p => p.id === selectedPropertyId);
      if (prop) text = fillPropertyPlaceholders(text, prop);
    }
    setContentText(text);
    if (tmpl.hashtags) setHashtags(tmpl.hashtags);
  };

  const addImageUrl = () => {
    if (newImageUrl && !imageUrls.includes(newImageUrl)) {
      setImageUrls([...imageUrls, newImageUrl]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const getPlatformsList = (): string[] => {
    const list: string[] = [];
    if (platforms.facebook) list.push('facebook_page');
    if (platforms.instagram) list.push('instagram');
    return list;
  };

  // Save recurring template
  const handleSaveTemplate = () => {
    const platformsList = getPlatformsList();
    if (!formName.trim()) {
      toast({ title: 'יש להזין שם לתבנית', variant: 'destructive' });
      return;
    }
    if (platformsList.length === 0) {
      toast({ title: 'יש לבחור לפחות פלטפורמה אחת', variant: 'destructive' });
      return;
    }
    saveQueue.mutate({
      ...(editingId ? { id: editingId } : {}),
      name: formName,
      queue_type: queueType,
      platforms: platformsList,
      template_text: contentText,
      hashtags,
      publish_time: formTime,
      frequency_days: parseInt(formFrequencyDays),
      frequency: parseInt(formFrequencyDays) >= 7 ? 'weekly' : 'daily',
      property_filter: queueType === 'property_rotation' ? propertyFilter : undefined,
    }, {
      onSuccess: () => {
        resetForm();
      },
    });
  };

  // Publish one-time post
  const validateOneTime = (action: 'draft' | 'schedule' | 'publish'): boolean => {
    if (!contentText.trim()) {
      toast({ title: 'יש להזין טקסט לפוסט', variant: 'destructive' });
      return false;
    }
    if (getPlatformsList().length === 0) {
      toast({ title: 'יש לבחור לפחות פלטפורמה אחת', variant: 'destructive' });
      return false;
    }
    if (platforms.instagram && imageUrls.length === 0) {
      toast({ title: 'אינסטגרם מחייב לפחות תמונה אחת', variant: 'destructive' });
      return false;
    }
    if (action === 'schedule' && !scheduleDate) {
      toast({ title: 'יש לבחור תאריך לתזמון', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleActionClick = (action: 'draft' | 'schedule' | 'publish') => {
    if (!validateOneTime(action)) return;
    if (action === 'publish' || action === 'schedule') {
      setPendingAction(action);
      setPublishConfirmOpen(true);
    } else {
      executeSave('draft');
    }
  };

  const executeSave = async (action: 'draft' | 'schedule' | 'publish') => {
    const selectedPlatforms = getPlatformsList();
    let scheduledAt: string | undefined;
    if (action === 'schedule') {
      const [hours, mins] = scheduleTime.split(':').map(Number);
      const dt = new Date(scheduleDate!);
      dt.setHours(hours, mins, 0, 0);
      scheduledAt = dt.toISOString();
    }
    for (const platform of selectedPlatforms) {
      const post = await createPost.mutateAsync({
        platform,
        post_type: 'property_listing',
        content_text: contentText,
        image_urls: imageUrls,
        hashtags,
        status: action === 'draft' ? 'draft' : 'scheduled',
        scheduled_at: action === 'publish' ? new Date().toISOString() : scheduledAt,
        property_id: selectedPropertyId || undefined,
        template_id: selectedTemplateId || undefined,
      });
      if (action === 'publish' && post?.id) {
        await publishPost.mutateAsync(post.id);
      }
    }
    toast({ title: action === 'publish' ? '🚀 הפוסט פורסם בהצלחה!' : action === 'schedule' ? '⏰ הפוסט תוזמן בהצלחה!' : '💾 הטיוטא נשמרה' });
    resetForm();
  };

  // Queue helpers
  const getNextProperty = (queue: Record<string, unknown>) => {
    if (!websiteProperties || websiteProperties.length === 0) return null;
    const idx = (queue.current_index as number) || 0;
    return websiteProperties[idx >= websiteProperties.length ? 0 : idx];
  };

  const getCycleInfo = (queue: Record<string, unknown>) => {
    if (!websiteProperties || websiteProperties.length === 0) return null;
    const totalProps = websiteProperties.length;
    const currentIdx = ((queue.current_index as number) || 0) % totalProps;
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

  const charCount = contentText.length + (hashtags ? hashtags.length + 2 : 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">מערכת פרסום</span>
          {activeCount > 0 && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
              {activeCount} תבניות פעילות
            </Badge>
          )}
        </div>
      </div>

      {/* Inline Form — always visible */}
      <Card className="border-primary/20">
          <CardContent className="pt-4 space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={mode === 'one_time' ? 'default' : 'outline'}
                className="text-xs h-7 gap-1.5"
                onClick={() => setMode('one_time')}
              >
                <Send className="h-3 w-3" />
                חד-פעמי
              </Button>
              <Button
                size="sm"
                variant={mode === 'recurring' ? 'default' : 'outline'}
                className="text-xs h-7 gap-1.5"
                onClick={() => setMode('recurring')}
              >
                <RotateCcw className="h-3 w-3" />
                אוטומטי חוזר
              </Button>
            </div>

            {/* Recurring: Name & Type & Property Filter */}
            {mode === 'recurring' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-medium">שם התבנית</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} className="h-8 text-sm mt-1" placeholder="לדוגמה: דירות יומי" />
                </div>
                <div>
                  <Label className="text-xs font-medium">סוג</Label>
                  <Select value={queueType} onValueChange={(v) => {
                    setQueueType(v as QueueType);
                    if (v === 'property_rotation' && !contentText) setContentText(DEFAULT_PROPERTY_TEMPLATE);
                  }}>
                    <SelectTrigger className="h-8 text-sm mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property_rotation">
                        <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> דירות (מחזורי)</span>
                      </SelectItem>
                      <SelectItem value="article_oneshot">
                        <span className="flex items-center gap-1.5"><Newspaper className="h-3 w-3" /> כתבות (חד-פעמי)</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {queueType === 'property_rotation' && (
                  <div>
                    <Label className="text-xs font-medium">סוג נכס</Label>
                    <Select value={propertyFilter} onValueChange={(v) => setPropertyFilter(v as 'all' | 'rental' | 'sale')}>
                      <SelectTrigger className="h-8 text-sm mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">הכל</SelectItem>
                        <SelectItem value="rental">השכרה בלבד</SelectItem>
                        <SelectItem value="sale">מכירה בלבד</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* One-time: Property & Template selection */}
            {mode === 'one_time' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">מקור</Label>
                  <Select value={selectedPropertyId} onValueChange={handleSelectProperty}>
                    <SelectTrigger className="text-sm mt-1">
                      <SelectValue placeholder="בחר נכס (אופציונלי)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">פוסט חופשי</SelectItem>
                      {properties.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.address}, {p.city} — {p.rooms} חד׳
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">תבנית</Label>
                  <Select value={selectedTemplateId} onValueChange={applyTemplate}>
                    <SelectTrigger className="text-sm mt-1">
                      <SelectValue placeholder="בחר תבנית (אופציונלי)" />
                    </SelectTrigger>
                    <SelectContent>
                      {socialTemplates?.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Platforms */}
            <div>
              <Label className="text-xs font-medium mb-2 block">פלטפורמה</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={platforms.facebook ? 'default' : 'outline'}
                  size="sm"
                  className={cn("gap-1.5 h-7 text-xs", platforms.facebook && "bg-[#1877F2] hover:bg-[#1877F2]/90")}
                  onClick={() => setPlatforms(p => ({ ...p, facebook: !p.facebook }))}
                >
                  <Facebook className="h-3 w-3" /> פייסבוק
                </Button>
                <Button
                  type="button"
                  variant={platforms.instagram ? 'default' : 'outline'}
                  size="sm"
                  className={cn("gap-1.5 h-7 text-xs", platforms.instagram && "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90")}
                  onClick={() => setPlatforms(p => ({ ...p, instagram: !p.instagram }))}
                >
                  <Instagram className="h-3 w-3" /> אינסטגרם
                </Button>
              </div>
            </div>

            {/* Recurring: Frequency & Time */}
            {mode === 'recurring' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs font-medium">תדירות</Label>
                  <Select value={formFrequencyDays} onValueChange={setFormFrequencyDays}>
                    <SelectTrigger className="h-8 text-sm mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">שעת פרסום</Label>
                  <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="h-8 text-sm w-28 mt-1" />
                </div>
              </div>
            )}

            {/* Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-medium">
                  {mode === 'recurring' && queueType === 'property_rotation' ? 'תבנית פוסט' : 'טקסט הפוסט'}
                </Label>
                <span className="text-[10px] text-muted-foreground">{charCount} תווים</span>
              </div>
              {mode === 'recurring' && queueType === 'property_rotation' && (
                <p className="text-[10px] text-muted-foreground mb-1">
                  placeholders: {'{address}'}, {'{price}'}, {'{rooms}'}, {'{size}'}, {'{floor}'}, {'{neighborhood}'}, {'{city}'}, {'{description}'}
                </p>
              )}
              <Textarea
                value={contentText}
                onChange={e => setContentText(e.target.value)}
                placeholder={mode === 'recurring' ? 'תבנית הפוסט שתפורסם אוטומטית...' : 'כתוב את תוכן הפוסט...'}
                className="min-h-[120px] text-sm"
                dir="rtl"
              />
            </div>

            {/* Hashtags */}
            <div>
              <Label className="text-xs font-medium">האשטגים</Label>
              <HashtagGroupSelector value={hashtags} onChange={setHashtags} />
            </div>

            {/* Images (one-time) */}
            {mode === 'one_time' && (
              <div>
                <Label className="text-xs font-medium">
                  תמונות {platforms.instagram && <span className="text-muted-foreground">(חובה באינסטגרם)</span>}
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="הזן URL של תמונה"
                    dir="ltr"
                    className="text-sm flex-1"
                  />
                  <Button size="sm" variant="outline" onClick={addImageUrl} disabled={!newImageUrl}>
                    <Image className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mt-2">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 left-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {i === 0 && (
                          <Badge className="absolute bottom-1 right-1 text-[8px] px-1 py-0">ראשית</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Schedule (one-time) */}
            {mode === 'one_time' && (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <Label className="text-xs font-medium">תזמון</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="text-sm mt-1">
                        <CalendarDays className="h-3.5 w-3.5 ml-1" />
                        {scheduleDate ? format(scheduleDate, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={setScheduleDate}
                        className="p-3 pointer-events-auto"
                        disabled={date => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-28 text-sm"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {mode === 'one_time' ? (
                <>
                  <Button size="sm" onClick={() => handleActionClick('publish')} disabled={createPost.isPending || publishPost.isPending} className="gap-1.5 h-8">
                    <Send className="h-3.5 w-3.5" /> פרסם עכשיו
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleActionClick('schedule')} disabled={createPost.isPending} className="gap-1.5 h-8">
                    <Clock className="h-3.5 w-3.5" /> תזמן
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleActionClick('draft')} disabled={createPost.isPending} className="gap-1.5 h-8">
                    <Save className="h-3.5 w-3.5" /> טיוטא
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={handleSaveTemplate} disabled={saveQueue.isPending} className="gap-1.5 h-8">
                  <Save className="h-3.5 w-3.5" /> {saveQueue.isPending ? 'שומר...' : editingId ? 'עדכן תבנית' : 'שמור תבנית'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Existing templates */}
      {isLoading && <p className="text-xs text-muted-foreground px-1">טוען...</p>}

      {queues?.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="p-4 text-center">
            <Bot className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">עוד אין תבניות פרסום</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">לחץ על "פוסט / תבנית חדשה" כדי להתחיל</p>
          </CardContent>
        </Card>
      )}

      {queues?.map(queue => {
        const nextProp = queue.queue_type === 'property_rotation' ? getNextProperty(queue) : null;
        const cycleInfo = queue.queue_type === 'property_rotation' ? getCycleInfo(queue) : null;
        const freqDays = (queue as any).frequency_days || 1;
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
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditQueue(queue)}>
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

              {/* Articles management */}
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
          <span>היסטוריית פרסום</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${logOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <AutoPublishLog />
        </CollapsibleContent>
      </Collapsible>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="מחיקת תבנית"
        description="האם אתה בטוח שברצונך למחוק תבנית זו? כל הכתבות וההיסטוריה ימחקו."
        onConfirm={() => {
          if (deleteConfirm) {
            deleteQueue.mutate(deleteConfirm);
            setDeleteConfirm(null);
          }
        }}
      />

      {/* Publish confirmation */}
      <ConfirmDialog
        open={publishConfirmOpen}
        onOpenChange={setPublishConfirmOpen}
        title={pendingAction === 'publish' ? 'פרסום פוסט' : 'תזמון פוסט'}
        description={
          pendingAction === 'publish'
            ? 'הפוסט ישלח כעת לפייסבוק/אינסטגרם. האם אתה בטוח?'
            : `הפוסט יתוזמן ל-${scheduleDate ? format(scheduleDate, 'dd/MM/yyyy', { locale: he }) : ''} בשעה ${scheduleTime}. האם אתה בטוח?`
        }
        confirmLabel={pendingAction === 'publish' ? '🚀 פרסם' : '⏰ תזמן'}
        onConfirm={() => {
          setPublishConfirmOpen(false);
          if (pendingAction) executeSave(pendingAction);
        }}
      />
    </div>
  );
};
