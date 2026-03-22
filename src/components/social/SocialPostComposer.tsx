import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Clock, Save, Image, X, CalendarDays, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useCreateSocialPost, usePublishPost, useSocialTemplates, useSocialAccounts } from '@/hooks/useSocialPosts';
import { useToast } from '@/hooks/use-toast';

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

  // Load properties for selection
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

    // If a property is selected, fill placeholders
    if (selectedPropertyId) {
      const prop = properties.find(p => p.id === selectedPropertyId);
      if (prop) {
        text = fillPropertyPlaceholders(text, prop);
      }
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

    // Auto-fill from property if no template selected
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

      // Auto hashtags
      const tags = ['#נדלן', '#דירה' + typeLabel.replace('ל', 'ל')];
      if (prop.city) tags.push(`#${prop.city.replace(/\s/g, '')}`);
      if (prop.neighborhood) tags.push(`#${prop.neighborhood.replace(/\s/g, '')}`);
      setHashtags(tags.join(' '));
    } else {
      // Re-apply template with property data
      applyTemplate(selectedTemplateId);
    }

    // Load property images
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

  const handleSave = async (action: 'draft' | 'schedule' | 'publish') => {
    if (!contentText.trim()) {
      toast({ title: 'יש להזין טקסט לפוסט', variant: 'destructive' });
      return;
    }

    const selectedPlatforms: string[] = [];
    if (platforms.facebook) selectedPlatforms.push('facebook_page');
    if (platforms.instagram) selectedPlatforms.push('instagram');

    if (selectedPlatforms.length === 0) {
      toast({ title: 'יש לבחור לפחות פלטפורמה אחת', variant: 'destructive' });
      return;
    }

    let scheduledAt: string | undefined;
    if (action === 'schedule') {
      if (!scheduleDate) {
        toast({ title: 'יש לבחור תאריך לתזמון', variant: 'destructive' });
        return;
      }
      const [hours, mins] = scheduleTime.split(':').map(Number);
      const dt = new Date(scheduleDate);
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
        status: action === 'publish' ? 'scheduled' : action === 'schedule' ? 'scheduled' : 'draft',
        scheduled_at: action === 'publish' ? new Date().toISOString() : scheduledAt,
        property_id: selectedPropertyId || undefined,
        template_id: selectedTemplateId || undefined,
      });

      // Publish immediately
      if (action === 'publish' && post?.id) {
        await publishPost.mutateAsync(post.id);
      }
    }

    // Reset form
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">יצירת פוסט חדש</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source & Template */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">מקור</Label>
              <Select value={selectedPropertyId} onValueChange={handleSelectProperty}>
                <SelectTrigger className="text-sm">
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
              <Label className="text-xs">תבנית</Label>
              <Select value={selectedTemplateId} onValueChange={applyTemplate}>
                <SelectTrigger className="text-sm">
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
          <div className="flex items-center gap-4">
            <Label className="text-xs">פלטפורמה:</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={platforms.facebook}
                onCheckedChange={c => setPlatforms(p => ({ ...p, facebook: !!c }))}
                id="fb"
              />
              <label htmlFor="fb" className="text-sm cursor-pointer">פייסבוק דף</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={platforms.instagram}
                onCheckedChange={c => setPlatforms(p => ({ ...p, instagram: !!c }))}
                id="ig"
              />
              <label htmlFor="ig" className="text-sm cursor-pointer">אינסטגרם</label>
            </div>
          </div>

          {/* Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">טקסט הפוסט</Label>
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
              className="min-h-[120px] text-sm"
              dir="rtl"
            />
          </div>

          {/* Hashtags */}
          <div>
            <Label className="text-xs">האשטגים</Label>
            <Input
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="#נדלן #תלאביב #דירהלהשכרה"
              className="text-sm"
              dir="ltr"
            />
          </div>

          {/* Images */}
          <div>
            <Label className="text-xs">תמונות {platforms.instagram && '(עד 10 לקרוסלה)'}</Label>
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
              <div className="flex flex-wrap gap-2 mt-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative group w-16 h-16 rounded-md overflow-hidden border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-0 left-0 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">תזמון</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-sm">
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
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button onClick={() => handleSave('publish')} disabled={createPost.isPending || publishPost.isPending}>
              <Send className="h-4 w-4 ml-1" />
              פרסם עכשיו
            </Button>
            <Button variant="outline" onClick={() => handleSave('schedule')} disabled={createPost.isPending}>
              <Clock className="h-4 w-4 ml-1" />
              תזמן
            </Button>
            <Button variant="ghost" onClick={() => handleSave('draft')} disabled={createPost.isPending}>
              <Save className="h-4 w-4 ml-1" />
              שמור כטיוטא
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {contentText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">תצוגה מקדימה</CardTitle>
          </CardHeader>
          <CardContent>
            {imageUrls.length > 0 && (
              <div className="mb-3 rounded-lg overflow-hidden">
                <img src={imageUrls[0]} alt="" className="w-full max-h-64 object-cover" />
                {imageUrls.length > 1 && (
                  <div className="text-[10px] text-muted-foreground mt-1">+{imageUrls.length - 1} תמונות נוספות</div>
                )}
              </div>
            )}
            <p className="text-sm whitespace-pre-wrap">{contentText}</p>
            {hashtags && <p className="text-sm text-primary mt-2" dir="ltr">{hashtags}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
