import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Clock, Save, Image, X, CalendarDays, Facebook, Instagram } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { HashtagGroupSelector } from './HashtagGroupSelector';
import { useCreateSocialPost, usePublishPost, useSocialTemplates, useSocialAccounts } from '@/hooks/useSocialPosts';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from './ConfirmDialog';

const PLACEHOLDERS: Record<string, string> = {
  '{address}': 'כתובת',
  '{price}': 'מחיר',
  '{rooms}': 'חדרים',
  '{size}': 'גודל',
  '{floor}': 'קומה',
  '{neighborhood}': 'שכונה',
  '{city}': 'עיר',
  '{description}': 'תיאור',
  '{property_type}': 'סוג עסקה',
};

export const SocialPostComposer: React.FC = () => {
  const { toast } = useToast();
  const createPost = useCreateSocialPost();
  const publishPost = usePublishPost();
  const { data: templates } = useSocialTemplates();
  const { data: accounts } = useSocialAccounts();

  const [contentText, setContentText] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [platforms, setPlatforms] = useState({ facebook: true, instagram: false });
  const [postType, setPostType] = useState('property_listing');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'publish' | 'schedule' | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingProperties(true);
      const { data } = await supabase
        .from('properties')
        .select('id, address, city, rooms, property_size, floor, neighborhood, monthly_rent, current_market_value, description, property_type')
        .eq('available', true)
        .order('created_at', { ascending: false })
        .limit(100);
      setProperties(data || []);
      setLoadingProperties(false);
    };
    load();
  }, []);

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates?.find(t => t.id === templateId);
    if (!tmpl) return;
    let text = tmpl.template_text;
    if (selectedPropertyId) {
      const prop = properties.find(p => p.id === selectedPropertyId);
      if (prop) text = fillPropertyPlaceholders(text, prop);
    }
    setContentText(text);
    if (tmpl.hashtags) setHashtags(tmpl.hashtags);
  };

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

  const addImageUrl = () => {
    if (newImageUrl && !imageUrls.includes(newImageUrl)) {
      setImageUrls([...imageUrls, newImageUrl]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const validateBeforeSave = (action: 'draft' | 'schedule' | 'publish'): boolean => {
    if (!contentText.trim()) {
      toast({ title: 'יש להזין טקסט לפוסט', variant: 'destructive' });
      return false;
    }
    const selectedPlatforms: string[] = [];
    if (platforms.facebook) selectedPlatforms.push('facebook_page');
    if (platforms.instagram) selectedPlatforms.push('instagram');
    if (selectedPlatforms.length === 0) {
      toast({ title: 'יש לבחור לפחות פלטפורמה אחת', variant: 'destructive' });
      return false;
    }
    // Instagram requires at least one image
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
    if (!validateBeforeSave(action)) return;
    if (action === 'publish' || action === 'schedule') {
      setPendingAction(action);
      setPublishConfirmOpen(true);
    } else {
      executeSave('draft');
    }
  };

  const executeSave = async (action: 'draft' | 'schedule' | 'publish') => {
    const selectedPlatforms: string[] = [];
    if (platforms.facebook) selectedPlatforms.push('facebook_page');
    if (platforms.instagram) selectedPlatforms.push('instagram');

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
        post_type: postType,
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

    setContentText('');
    setHashtags('');
    setImageUrls([]);
    setSelectedPropertyId('');
    setSelectedTemplateId('');
    setScheduleDate(undefined);
  };

  const charCount = contentText.length + (hashtags ? hashtags.length + 2 : 0);
  const igLimit = 2200;
  const fbLimit = 63206;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Composer - Left/Main */}
        <div className="lg:col-span-3 space-y-4">
           <Card>
            <CardContent className="pt-4 space-y-4">
              {/* Source & Template */}
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
                      {templates?.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Platforms */}
              <div>
                <Label className="text-xs font-medium mb-2 block">פלטפורמה</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={platforms.facebook ? 'default' : 'outline'}
                    size="sm"
                    className={cn("gap-1.5", platforms.facebook && "bg-[#1877F2] hover:bg-[#1877F2]/90")}
                    onClick={() => setPlatforms(p => ({ ...p, facebook: !p.facebook }))}
                  >
                    <Facebook className="h-3.5 w-3.5" />
                    פייסבוק
                  </Button>
                  <Button
                    type="button"
                    variant={platforms.instagram ? 'default' : 'outline'}
                    size="sm"
                    className={cn("gap-1.5", platforms.instagram && "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90")}
                    onClick={() => setPlatforms(p => ({ ...p, instagram: !p.instagram }))}
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    אינסטגרם
                  </Button>
                </div>
              </div>

              {/* Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-medium">טקסט הפוסט</Label>
                  <span className={cn(
                    "text-[10px]",
                    platforms.instagram && charCount > igLimit ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {charCount} / {platforms.instagram ? igLimit : fbLimit}
                  </span>
                </div>
                <Textarea
                  value={contentText}
                  onChange={e => setContentText(e.target.value)}
                  placeholder="כתוב את תוכן הפוסט..."
                  className="min-h-[140px] text-sm"
                  dir="rtl"
                />
              </div>

              {/* Hashtags */}
              <div>
                <Label className="text-xs font-medium">האשטגים</Label>
                <HashtagGroupSelector value={hashtags} onChange={setHashtags} />
              </div>

              {/* Images */}
              <div>
                <Label className="text-xs font-medium">
                  תמונות {platforms.instagram && <span className="text-muted-foreground">(חובה, עד 10 לקרוסלה)</span>}
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

              {/* Schedule */}
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

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <Button onClick={() => handleActionClick('publish')} disabled={createPost.isPending || publishPost.isPending} className="gap-1.5">
                  <Send className="h-4 w-4" />
                  פרסם עכשיו
                </Button>
                <Button variant="outline" onClick={() => handleActionClick('schedule')} disabled={createPost.isPending} className="gap-1.5">
                  <Clock className="h-4 w-4" />
                  תזמן
                </Button>
                <Button variant="ghost" onClick={() => handleActionClick('draft')} disabled={createPost.isPending} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  שמור כטיוטא
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview - Right */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">תצוגה מקדימה</CardTitle>
            </CardHeader>
            <CardContent>
              {!contentText && !imageUrls.length ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Image className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>התחל לכתוב כדי לראות תצוגה מקדימה</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Platform indicators */}
                  <div className="flex gap-1.5">
                    {platforms.facebook && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Facebook className="h-3 w-3" /> פייסבוק
                      </Badge>
                    )}
                    {platforms.instagram && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Instagram className="h-3 w-3" /> אינסטגרם
                      </Badge>
                    )}
                  </div>

                  {imageUrls.length > 0 && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img src={imageUrls[0]} alt="" className="w-full max-h-48 object-cover" />
                      {imageUrls.length > 1 && (
                        <div className="text-[10px] text-muted-foreground px-2 py-1 bg-muted">
                          +{imageUrls.length - 1} תמונות נוספות
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{contentText}</p>
                  {hashtags && <p className="text-sm text-primary" dir="ltr">{hashtags}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
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
    </>
  );
};
