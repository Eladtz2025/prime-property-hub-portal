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
import { Bot, ChevronDown, Trash2, Edit2, Building2, Newspaper, Clock, Facebook, Instagram, Eye, RotateCcw, Send, Save, Image, X, CalendarDays, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAutoPublishQueues, useSaveAutoPublishQueue, useToggleAutoPublishQueue, useDeleteAutoPublishQueue, useWebsiteProperties } from '@/hooks/useAutoPublish';
import { useCreateSocialPost, usePublishPost, useSocialTemplates, useSocialAccounts, useFacebookGroups } from '@/hooks/useSocialPosts';
import { useToast } from '@/hooks/use-toast';
import { AutoPublishArticles } from './AutoPublishArticles';
import { AutoPublishLog } from './AutoPublishLog';
import { ConfirmDialog } from './ConfirmDialog';
import { HashtagGroupSelector } from './HashtagGroupSelector';
import { FacebookPostPreview } from './FacebookPostPreview';
import { Checkbox } from '@/components/ui/checkbox';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const FREQUENCY_OPTIONS = [
  { value: '1', label: 'יומי' },
  { value: '2', label: 'כל יומיים' },
  { value: '3', label: 'כל 3 ימים' },
  { value: '7', label: 'שבועי' },
];

const TEMPLATE_PRESETS = [
  {
    id: 'minimal',
    label: '🎯 מינימלית',
    text: `🏠 דירה {property_type}!

📍 {neighborhood}, {city}
🛏️ {rooms} חדרים | 📐 {size} מ"ר | 🏢 קומה {floor}
💰 {price}

📞 לפרטים נוספים צרו קשר`,
  },
  {
    id: 'marketing',
    label: '✨ שיווקית',
    text: `✨ הזדמנות! דירת {rooms} חדרים {property_type}

📍 {neighborhood}, {city}
📐 {size} מ"ר | 🏢 קומה {floor}
💰 רק {price}

⬇️ לחצו על הלינק לפרטים נוספים`,
  },
  {
    id: 'simple',
    label: '📝 פשוטה',
    text: `דירת {rooms} חדרים {property_type} ב{city}
{neighborhood}
{size} מ"ר, קומה {floor}
{price}

לפרטים: 👇`,
  },
];

const DEFAULT_PROPERTY_TEMPLATE = TEMPLATE_PRESETS[0].text;

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
  const { data: facebookGroups } = useFacebookGroups();
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

  // Post style & image selection
  const [postStyle, setPostStyle] = useState<'link' | 'photos'>('link');
  const [selectedPrimaryImageIndex, setSelectedPrimaryImageIndex] = useState(0);
  const [selectedPhotoIndexes, setSelectedPhotoIndexes] = useState<number[]>([]);

  // Recurring fields
  const [formFrequencyDays, setFormFrequencyDays] = useState('1');
  const [formTime, setFormTime] = useState('10:00');
  const [propertyFilter, setPropertyFilter] = useState<'all' | 'rental' | 'sale'>('all');
  const [publishTarget, setPublishTarget] = useState<'page' | 'groups'>('page');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  // Confirm
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'publish' | 'schedule' | null>(null);
  const [isPrivatePost, setIsPrivatePost] = useState(false);
  const [customLinkTitle, setCustomLinkTitle] = useState('');
  const [customLinkDesc, setCustomLinkDesc] = useState('');

  const activeCount = queues?.filter(q => q.is_active).length || 0;

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, address, city, rooms, property_size, floor, neighborhood, monthly_rent, current_market_value, description, property_type, property_images!inner(id, image_url, is_main, order_index)')
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
    setPublishTarget('page');
    setSelectedGroupIds([]);
    setPostStyle('link');
    setSelectedPrimaryImageIndex(0);
    setSelectedPhotoIndexes([]);
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
    const target = (queue as any).publish_target as { type: string; group_ids?: string[] } | null;
    setPublishTarget((target?.type as 'page' | 'groups') || 'page');
    setSelectedGroupIds(target?.group_ids || []);
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
      .replace(/{address}/g, prop.neighborhood || prop.city || '')
      .replace(/{price}/g, price)
      .replace(/{rooms}/g, prop.rooms?.toString() || '')
      .replace(/{size}/g, prop.property_size?.toString() || '')
      .replace(/{floor}/g, prop.floor?.toString() || '')
      .replace(/{neighborhood}/g, prop.neighborhood || '')
      .replace(/{city}/g, prop.city || '')
      .replace(/{description}/g, '')
      .replace(/{property_type}/g, typeLabel);
  };

  const fillHashtagPlaceholders = (tags: string, prop: any): string => {
    return tags
      .replace(/{neighborhood}/g, prop.neighborhood?.replace(/[-\s]/g, '_') || '')
      .replace(/{city}/g, prop.city?.replace(/[-\s]/g, '_') || '')
      .replace(/{property_type}/g, prop.property_type === 'sale' ? 'למכירה' : 'להשכרה')
      .replace(/#{2,}/g, '#')
      .replace(/#\s/g, '')
      .replace(/#$/g, '')
      .trim();
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
      const neighborhood = prop.neighborhood;
      const details = [
        price ? `💰 ${price}` : '',
        prop.rooms ? `🛏️ ${prop.rooms} חד'` : '',
        prop.property_size ? `📐 ${prop.property_size} מ"ר` : '',
        prop.floor ? `🏢 קומה ${prop.floor}` : '',
      ].filter(Boolean).join(' | ');
      setContentText(
        `🏠 דירה ${typeLabel} ב${prop.city || ''}${neighborhood ? ` - ${neighborhood}` : ''}\n${details}\n📞 לפרטים נוספים צרו קשר`
      );
      const tags = ['#נדלן', `#דירה${typeLabel.replace('ל', 'ל')}`];
      if (prop.city) tags.push(`#${prop.city.replace(/[-\s]/g, '_')}`);
      if (prop.neighborhood) tags.push(`#${prop.neighborhood.replace(/[-\s]/g, '_')}`);
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
      setSelectedPrimaryImageIndex(0);
      setSelectedPhotoIndexes([0]); // default first image selected in photos mode
    }
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = socialTemplates?.find(t => t.id === templateId);
    if (!tmpl) return;
    let text = tmpl.template_text;
    let tags = tmpl.hashtags || '';
    if (selectedPropertyId && selectedPropertyId !== 'free') {
      const prop = properties.find(p => p.id === selectedPropertyId);
      if (prop) {
        text = fillPropertyPlaceholders(text, prop);
        if (tags) tags = fillHashtagPlaceholders(tags, prop);
      }
    }
    setContentText(text);
    if (tags) setHashtags(tags);
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
      publish_target: platforms.facebook 
        ? (publishTarget === 'groups' ? { type: 'groups', group_ids: selectedGroupIds } : { type: 'page' })
        : { type: 'page' },
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
      // In photos mode, send selected images; in link mode, Facebook generates OG card
      const isPhotosMode = postStyle === 'photos';

      // Build property URL for link posts — ALWAYS use og-property endpoint for consistent 1200x630 OG image
      const propertyUrl = selectedPropertyId && selectedPropertyId !== 'free'
        ? `https://www.ctmarketproperties.com/property/${selectedPropertyId}`
        : undefined;

      // Route link posts through the main domain so Facebook displays ctmarketproperties.com
      // The Vercel edge function (api/og-redirect.js) detects bots and proxies to Supabase og-property
      let linkUrl: string | undefined;
      if (!isPhotosMode && selectedPropertyId && selectedPropertyId !== 'free') {
        linkUrl = `https://www.ctmarketproperties.com/property/${selectedPropertyId}?img_index=${selectedPrimaryImageIndex}&v=${Date.now()}`
          + (customLinkTitle ? `&custom_title=${encodeURIComponent(customLinkTitle)}` : '')
          + (customLinkDesc ? `&custom_desc=${encodeURIComponent(customLinkDesc)}` : '');
      } else if (!isPhotosMode) {
        linkUrl = propertyUrl;
      }

      const photosToSend = isPhotosMode
        ? selectedPhotoIndexes.map(i => imageUrls[i]).filter(Boolean)
        : [];

      // In photos mode, append property URL to text so users can still click through
      // Add RTL mark at start to force Facebook RTL alignment for Hebrew
      const rtlMark = '\u200F';
      const finalContentText = rtlMark + ((isPhotosMode && propertyUrl)
        ? `${contentText}\n\n🔗 ${propertyUrl}`
        : contentText);

      const post = await createPost.mutateAsync({
        platform,
        post_type: 'property_listing',
        content_text: finalContentText,
        image_urls: isPhotosMode ? photosToSend : (propertyUrl ? [] : imageUrls),
        hashtags,
        status: action === 'draft' ? 'draft' : 'scheduled',
        scheduled_at: action === 'publish' ? new Date().toISOString() : scheduledAt,
        property_id: selectedPropertyId || undefined,
        template_id: selectedTemplateId || undefined,
        link_url: linkUrl,
      });
      if (action === 'publish' && post?.id) {
        const result = await publishPost.mutateAsync({ postId: post.id, isPrivate: isPrivatePost });
        if (!result?.success) {
          // Toast already shown by usePublishPost.onSuccess
          resetForm();
          return;
        }
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
    const template = (queue.template_text as string) || '{neighborhood}, {city}';
    return template
      .replace(/{address}/g, nextProp.neighborhood || nextProp.city || '')
      .replace(/{city}/g, nextProp.city || '')
      .replace(/{neighborhood}/g, nextProp.neighborhood || '')
      .replace(/{rooms}/g, nextProp.rooms?.toString() || '')
      .replace(/{size}/g, nextProp.property_size?.toString() || '')
      .replace(/{floor}/g, nextProp.floor?.toString() || '')
      .replace(/{price}/g, nextProp.monthly_rent ? `₪${Number(nextProp.monthly_rent).toLocaleString()}` : '')
      .replace(/{description}/g, '')
      .replace(/{property_type}/g, nextProp.property_type === 'sale' ? 'מכירה' : 'השכרה');
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
          <CardContent className="pt-3 pb-3 space-y-2">
            {/* Row 1: All controls in one line */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={mode === 'one_time' ? 'one_time' : queueType === 'article_oneshot' ? 'auto_articles' : 'auto_properties'} onValueChange={(v) => {
                  if (v === 'one_time') {
                    setMode('one_time');
                  } else if (v === 'auto_properties') {
                    setMode('recurring');
                    setQueueType('property_rotation');
                    if (!contentText) setContentText(DEFAULT_PROPERTY_TEMPLATE);
                  } else if (v === 'auto_articles') {
                    setMode('recurring');
                    setQueueType('article_oneshot');
                  }
                }}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">
                    <span className="flex items-center gap-1.5"><Send className="h-3 w-3" /> חד-פעמי</span>
                  </SelectItem>
                  <SelectItem value="auto_properties">
                    <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> אוטו — דירות</span>
                  </SelectItem>
                  <SelectItem value="auto_articles">
                    <span className="flex items-center gap-1.5"><Newspaper className="h-3 w-3" /> אוטו — כתבות</span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {mode === 'recurring' && (
                <Input value={formName} onChange={e => setFormName(e.target.value)} className="h-8 text-xs w-[140px]" placeholder="שם התבנית" />
              )}

              {mode === 'recurring' && queueType === 'property_rotation' && (
                <Select value={propertyFilter} onValueChange={(v) => setPropertyFilter(v as 'all' | 'rental' | 'sale')}>
                  <SelectTrigger className="h-8 text-xs w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="rental">השכרה</SelectItem>
                    <SelectItem value="sale">מכירה</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* One-time: Property & Template inline */}
              {mode === 'one_time' && (
                <>
                  <Select value={selectedPropertyId} onValueChange={handleSelectProperty}>
                    <SelectTrigger className="h-8 text-xs w-[180px]">
                      <SelectValue placeholder="בחר נכס" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">פוסט חופשי</SelectItem>
                      {properties.filter(p => p.property_type === 'rental').length > 0 && (
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">להשכרה</div>
                      )}
                      {properties.filter(p => p.property_type === 'rental').map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.address}, {p.city} — {p.rooms} חד׳ — ₪{Number(p.monthly_rent || 0).toLocaleString()}
                        </SelectItem>
                      ))}
                      {properties.filter(p => p.property_type === 'sale').length > 0 && (
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">למכירה</div>
                      )}
                      {properties.filter(p => p.property_type === 'sale').map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.address}, {p.city} — {p.rooms} חד׳ — ₪{Number(p.current_market_value || 0).toLocaleString()}
                        </SelectItem>
                      ))}
                      {properties.filter(p => !['rental', 'sale'].includes(p.property_type)).length > 0 && (
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">אחר</div>
                      )}
                      {properties.filter(p => !['rental', 'sale'].includes(p.property_type)).map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.address}, {p.city} — {p.rooms} חד׳
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedTemplateId} onValueChange={applyTemplate}>
                    <SelectTrigger className="h-8 text-xs w-[140px]">
                      <SelectValue placeholder="תבנית" />
                    </SelectTrigger>
                    <SelectContent>
                      {socialTemplates?.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              {/* Platform buttons inline */}
              <div className="flex gap-1.5 items-center border-r border-border pr-2 mr-1">
                <Button
                  type="button"
                  variant={platforms.facebook ? 'default' : 'outline'}
                  size="sm"
                  className={cn("gap-1 h-7 text-xs px-2", platforms.facebook && "bg-[#1877F2] hover:bg-[#1877F2]/90")}
                  onClick={() => setPlatforms(p => ({ ...p, facebook: !p.facebook }))}
                >
                  <Facebook className="h-3 w-3" /> FB
                </Button>
                <Button
                  type="button"
                  variant={platforms.instagram ? 'default' : 'outline'}
                  size="sm"
                  className={cn("gap-1 h-7 text-xs px-2", platforms.instagram && "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90")}
                  onClick={() => setPlatforms(p => ({ ...p, instagram: !p.instagram }))}
                >
                  <Instagram className="h-3 w-3" /> IG
                </Button>
              </div>

              {/* Publish target inline */}
              {platforms.facebook && (
                <div className="flex gap-1.5 items-center">
                  <Button type="button" size="sm" variant={publishTarget === 'page' ? 'default' : 'outline'} className="text-xs h-7 px-2" onClick={() => setPublishTarget('page')}>
                    עמוד
                  </Button>
                  <Button type="button" size="sm" variant={publishTarget === 'groups' ? 'default' : 'outline'} className="text-xs h-7 px-2" onClick={() => setPublishTarget('groups')}>
                    קבוצות
                  </Button>
                </div>
              )}
            </div>

            {/* Groups selection if needed */}
            {platforms.facebook && publishTarget === 'groups' && (
              <>
                {facebookGroups && facebookGroups.length > 0 ? (
                  <div className="flex flex-wrap gap-2 bg-muted/30 rounded-md p-2">
                    {facebookGroups.map((group: any) => (
                      <label key={group.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Checkbox
                          checked={selectedGroupIds.includes(group.id)}
                          onCheckedChange={(checked) => {
                            setSelectedGroupIds(prev =>
                              checked ? [...prev, group.id] : prev.filter(id => id !== group.id)
                            );
                          }}
                        />
                        <span>{group.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">לא נמצאו קבוצות. הוסף קבוצות בהגדרות.</p>
                )}
            </>
            )}

            {/* Two-column layout: form right, preview left */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Right column — form controls */}
              <div className="space-y-2">
                {mode === 'recurring' && (
                  <div className="flex items-center gap-2">
                    <Select value={formFrequencyDays} onValueChange={setFormFrequencyDays}>
                      <SelectTrigger className="h-8 text-xs w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="h-8 text-xs w-24" />
                  </div>
                )}

                {/* Text */}
                <div>
                  {mode === 'recurring' && queueType === 'property_rotation' && (
                    <div className="flex gap-1.5 flex-wrap mb-1">
                      {TEMPLATE_PRESETS.map(preset => (
                        <Button
                          key={preset.id}
                          type="button"
                          variant={contentText === preset.text ? 'default' : 'outline'}
                          size="sm"
                          className="h-6 text-[11px] px-2"
                          onClick={() => setContentText(preset.text)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                      <span className="text-[10px] text-muted-foreground self-center">
                        {'{address}'} {'{price}'} {'{rooms}'} {'{neighborhood}'} {'{city}'}
                      </span>
                    </div>
                  )}
                  <Textarea
                    value={contentText}
                    onChange={e => setContentText(e.target.value)}
                    placeholder={mode === 'recurring' ? 'תבנית הפוסט שתפורסם אוטומטית...' : 'כתוב את תוכן הפוסט...'}
                    className="min-h-[80px] text-sm"
                    dir="rtl"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <HashtagGroupSelector value={hashtags} onChange={setHashtags} />
                    <span className="text-[10px] text-muted-foreground">{charCount} תווים</span>
                  </div>
                </div>

                {/* Custom Link Card fields */}
                {mode === 'one_time' && postStyle === 'link' && selectedPropertyId && selectedPropertyId !== 'free' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={customLinkTitle}
                      onChange={e => setCustomLinkTitle(e.target.value)}
                      placeholder="כותרת Link Card (אוטומטי אם ריק)"
                      className="text-xs h-7"
                      dir="rtl"
                    />
                    <Input
                      value={customLinkDesc}
                      onChange={e => setCustomLinkDesc(e.target.value)}
                      placeholder="תיאור Link Card (אוטומטי אם ריק)"
                      className="text-xs h-7"
                      dir="rtl"
                    />
                  </div>
                )}

                {/* Images & Post Style (one-time) */}
                {mode === 'one_time' && (
                  <div className="space-y-2">
                    {selectedPropertyId && selectedPropertyId !== 'free' && imageUrls.length > 0 && (
                      <div className="flex items-center gap-2 mb-1">
                        <Button type="button" size="sm" variant={postStyle === 'link' ? 'default' : 'outline'} className="text-xs h-7 gap-1 px-2" onClick={() => setPostStyle('link')}>
                          🔗 Link
                        </Button>
                        <Button type="button" size="sm" variant={postStyle === 'photos' ? 'default' : 'outline'} className="text-xs h-7 gap-1 px-2" onClick={() => { setPostStyle('photos'); if (selectedPhotoIndexes.length === 0 && imageUrls.length > 0) setSelectedPhotoIndexes([0]); }}>
                          🖼️ תמונות
                        </Button>
                        <span className="text-[10px] text-muted-foreground">
                          {postStyle === 'link' ? 'בחר תמונה ראשית' : `${selectedPhotoIndexes.length} נבחרו`}
                        </span>
                      </div>
                    )}

                    {selectedPropertyId && selectedPropertyId !== 'free' && imageUrls.length > 0 && (
                      <div>
                        <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
                          {imageUrls.map((url, i) => {
                            const isSelected = postStyle === 'link' 
                              ? i === selectedPrimaryImageIndex
                              : selectedPhotoIndexes.includes(i);
                            return (
                              <div 
                                key={i} 
                                className={cn(
                                  "relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                                  isSelected 
                                    ? "border-primary ring-2 ring-primary/30" 
                                    : "border-border hover:border-primary/50"
                                )}
                                onClick={() => {
                                  if (postStyle === 'link') {
                                    setSelectedPrimaryImageIndex(i);
                                  } else {
                                    setSelectedPhotoIndexes(prev => 
                                      prev.includes(i) 
                                        ? prev.filter(idx => idx !== i)
                                        : [...prev, i]
                                    );
                                  }
                                }}
                              >
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                                      ✓
                                    </div>
                                  </div>
                                )}
                                {postStyle === 'photos' && isSelected && selectedPhotoIndexes.length > 1 && (
                                  <Badge className="absolute top-1 right-1 text-[8px] px-1 py-0 h-4">
                                    {selectedPhotoIndexes.indexOf(i) + 1}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Manual image URL for free posts */}
                    {(!selectedPropertyId || selectedPropertyId === 'free') && (
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
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Schedule (one-time) — inline */}
                {mode === 'one_time' && (
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          <CalendarDays className="h-3 w-3 ml-1" />
                          {scheduleDate ? format(scheduleDate, 'dd/MM/yyyy', { locale: he }) : 'תאריך'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} className="p-3 pointer-events-auto" disabled={date => date < new Date()} />
                      </PopoverContent>
                    </Popover>
                    <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="w-24 text-xs h-7" dir="ltr" />
                  </div>
                )}

                {/* Actions — inline */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {mode === 'one_time' && platforms.facebook && (
                    <label className="flex items-center gap-1.5 cursor-pointer mr-2">
                      <Checkbox checked={isPrivatePost} onCheckedChange={(checked) => setIsPrivatePost(!!checked)} />
                      <Lock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px]">פרטי</span>
                    </label>
                  )}
                  {mode === 'one_time' ? (
                    <>
                      <Button size="sm" onClick={() => handleActionClick('publish')} disabled={createPost.isPending || publishPost.isPending} className="gap-1 h-7 text-xs">
                        <Send className="h-3 w-3" /> {isPrivatePost ? 'פרסם פרטי' : 'פרסם'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleActionClick('schedule')} disabled={createPost.isPending} className="gap-1 h-7 text-xs">
                        <Clock className="h-3 w-3" /> תזמן
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleActionClick('draft')} disabled={createPost.isPending} className="gap-1 h-7 text-xs">
                        <Save className="h-3 w-3" /> טיוטא
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={handleSaveTemplate} disabled={saveQueue.isPending} className="gap-1 h-7 text-xs">
                      <Save className="h-3 w-3" /> {saveQueue.isPending ? 'שומר...' : editingId ? 'עדכן תבנית' : 'שמור תבנית'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Left column — Facebook Preview (sticky) */}
              <div className="lg:sticky lg:top-4 self-start">
                {(() => {
                  let previewText = contentText;
                  let previewImages: string[] = imageUrls;
                  let linkUrl: string | undefined;
                  let linkTitle: string | undefined;
                  let linkDescription: string | undefined;
                  let linkImage: string | undefined;

                  const getMainImage = (prop: any): string | undefined => {
                    if (!prop?.property_images?.length) return undefined;
                    const sorted = [...prop.property_images].sort((a: any, b: any) => {
                      if (a.is_main && !b.is_main) return -1;
                      if (!a.is_main && b.is_main) return 1;
                      return (a.order_index || 0) - (b.order_index || 0);
                    });
                    return sorted[0]?.image_url || undefined;
                  };

                  const buildLinkCard = (prop: any) => {
                    const typeLabel = prop.property_type === 'sale' ? 'למכירה' : 'להשכרה';
                    const price = prop.property_type === 'sale'
                      ? (prop.current_market_value ? `₪${Number(prop.current_market_value).toLocaleString()}` : '')
                      : (prop.monthly_rent ? `₪${Number(prop.monthly_rent).toLocaleString()}${prop.property_type === 'sale' ? '' : '/חודש'}` : '');
                    linkUrl = `https://www.ctmarketproperties.com/property/${prop.id}`;
                    // Title — synced with og-property: "typePrefix: property.title"
                    linkTitle = `${typeLabel}: ${prop.title || 'נכס'}`;
                    // Description — synced with og-property: emojis + pipe separator
                    const descParts: string[] = [];
                    if (prop.rooms) descParts.push(`🛏️ ${prop.rooms} חד'`);
                    if (prop.property_size) descParts.push(`📐 ${prop.property_size} מ"ר`);
                    if (prop.floor != null && prop.floor !== undefined) descParts.push(`🏢 קומה ${prop.floor}`);
                    if (prop.balcony === true) descParts.push(`🌿 מרפסת`);
                    if (prop.parking === true) descParts.push(`🚗 חניה`);
                    if (prop.elevator === true) descParts.push(`🛗 מעלית`);
                    if (price) descParts.push(`💰 ${price}`);
                    descParts.push(`📍 ${prop.neighborhood || prop.city || ''}`);
                    linkDescription = descParts.join(' | ');
                    linkImage = getMainImage(prop);
                  };
                  
                  if (mode === 'recurring' && queueType === 'property_rotation' && properties.length) {
                    const filteredProps = propertyFilter === 'all' 
                      ? properties 
                      : properties.filter(p => p.property_type === propertyFilter);
                    const sampleProp = filteredProps[0];
                    if (sampleProp) {
                      previewText = fillPropertyPlaceholders(contentText, sampleProp);
                      buildLinkCard(sampleProp);
                    }
                  }
                  
                  if (mode === 'one_time' && selectedPropertyId && selectedPropertyId !== 'free' && properties.length) {
                    const selectedProp = properties.find(p => p.id === selectedPropertyId);
                    if (selectedProp) {
                      if (postStyle === 'link') {
                        buildLinkCard(selectedProp);
                        // Apply custom overrides for preview
                        if (customLinkTitle) linkTitle = customLinkTitle;
                        if (customLinkDesc) linkDescription = customLinkDesc;
                        if (imageUrls[selectedPrimaryImageIndex]) {
                          linkImage = imageUrls[selectedPrimaryImageIndex];
                        }
                      } else {
                        previewImages = selectedPhotoIndexes.map(i => imageUrls[i]).filter(Boolean);
                      }
                    }
                  }
                  
                  // Fallback: if one_time mode and no property selected, use first property as demo
                  if (mode === 'one_time' && (!selectedPropertyId || selectedPropertyId === 'free') && properties.length) {
                    const demoProp = properties[0];
                    previewText = fillPropertyPlaceholders(contentText || DEFAULT_PROPERTY_TEMPLATE, demoProp);
                    if (postStyle === 'link') {
                      buildLinkCard(demoProp);
                    } else {
                      previewImages = demoProp.property_images?.slice(0, 4).map(img => img.image_url) || [];
                    }
                  }
                  
                  return (
                    <FacebookPostPreview
                      text={previewText}
                      hashtags={hashtags || undefined}
                      imageUrls={postStyle === 'photos' && previewImages.length > 0 ? previewImages : (!linkImage && previewImages.length > 0 ? previewImages : undefined)}
                      linkUrl={postStyle === 'photos' ? undefined : linkUrl}
                      linkTitle={postStyle === 'photos' ? undefined : linkTitle}
                      linkDescription={postStyle === 'photos' ? undefined : linkDescription}
                      linkImage={postStyle === 'photos' ? undefined : linkImage}
                      pageName="דירות להשכרה ומכירה בת״א סיטי מרקט נכסים"
                    />
                  );
                })()}
              </div>
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
