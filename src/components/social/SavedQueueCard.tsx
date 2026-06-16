import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Building2, Newspaper, Clock, Facebook, Instagram, Eye, RotateCcw, Edit2, Trash2, Lock, Globe, AlertTriangle } from 'lucide-react';
import { formatPropertyPrice, propertyTypeLabel } from '@/lib/social-content';
import { RotationList } from './RotationList';
import { AutoPublishArticles } from './AutoPublishArticles';
import { FacebookPostPreview } from './FacebookPostPreview';
import cityMarketLogo from '@/assets/city-market-icon.png';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

interface CycleInfo {
  cycle: number;
  currentIdx: number;
  totalProps: number;
  progress: number;
}

interface SavedQueueCardProps {
  queue: any;
  /** getNextProperty(queue) — null for article queues; computed in the parent. */
  nextProp: any | null;
  /** getCycleInfo(queue) — null for article queues. */
  cycleInfo: CycleInfo | null;
  /** getFrequencyLabel(freqDays), computed in the parent. */
  frequencyLabel: string;
  /** getFilteredProperties(queue) — [] for non-rotation queues. */
  filteredProperties: any[];
  /** buildPreviewText(queue) — '' when there's no next property. */
  previewText: string;
  isPreviewOpen: boolean;
  onTogglePreview: () => void;
  onToggleActive: (isActive: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * One saved auto-publish queue row (extracted from AutoPublishManager). Purely
 * presentational: reads only the immutable queue record + values computed by the
 * parent, and writes only through callbacks (previewQueueId, toggle, edit, delete
 * all stay owned by the parent).
 */
export const SavedQueueCard: React.FC<SavedQueueCardProps> = ({
  queue,
  nextProp,
  cycleInfo,
  frequencyLabel,
  filteredProperties,
  previewText,
  isPreviewOpen,
  onTogglePreview,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className={`transition-all ${queue.is_active ? 'border-primary/20 shadow-sm' : 'opacity-50 border-muted'}`}>
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
              {queue.is_private ? (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-orange-400 text-orange-600 gap-0.5">
                  <Lock className="h-2 w-2" />פרטי
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-green-400 text-green-600 gap-0.5">
                  <Globe className="h-2 w-2" />ציבורי
                </Badge>
              )}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {(queue.publish_times as string[] | null)?.length > 1
                    ? (queue.publish_times as string[]).join(' · ')
                    : queue.publish_time}
                </span>
                <span>·</span>
                <span>{frequencyLabel}</span>
                <span>·</span>
                {(queue.platforms as string[])?.map((p: string) => (
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
              onCheckedChange={onToggleActive}
              className="scale-90"
            />
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onEdit} aria-label="ערוך תור" title="ערוך">
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={onDelete} aria-label="מחק תור" title="מחק">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Progress bar for property rotation */}
        {queue.queue_type === 'property_rotation' && cycleInfo && queue.is_active && (() => {
          // Staleness check: an active queue that hasn't published within its expected
          // cadence (frequency_days + 1 day grace) is almost certainly stuck — surface
          // that loudly instead of a benign "last published" date that's easy to miss.
          const lastPub = queue.last_published_at ? new Date(queue.last_published_at) : null;
          const daysSince = lastPub ? Math.floor((Date.now() - lastPub.getTime()) / 86400000) : null;
          const freqDays = (queue.frequency_days as number) || 1;
          const isStale = daysSince === null || daysSince > freqDays + 1;
          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <RotateCcw className="h-2.5 w-2.5" />
                  סבב {cycleInfo.cycle} · פורסמו: {cycleInfo.currentIdx}/{cycleInfo.totalProps}
                </span>
                {lastPub ? (
                  <span className={isStale ? 'flex items-center gap-0.5 text-red-600 font-medium' : ''}>
                    {isStale && <AlertTriangle className="h-2.5 w-2.5" />}
                    אחרון: {lastPub.toLocaleDateString('he-IL')}
                    {isStale && daysSince !== null && ` · לא פורסם ${daysSince} ימים!`}
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                    <AlertTriangle className="h-2.5 w-2.5" />טרם פורסם
                  </span>
                )}
              </div>
              <Progress value={cycleInfo.progress} className={`h-1.5 ${isStale ? '[&>div]:bg-red-500' : ''}`} />
            </div>
          );
        })()}

        {/* Rotation list */}
        {queue.queue_type === 'property_rotation' && queue.is_active && (
          <RotationList
            queueId={queue.id}
            filteredProperties={filteredProperties}
            currentIndex={(queue.current_index as number) || 0}
          />
        )}
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
                <span className="text-[10px] text-muted-foreground font-medium">
                  הבא בתור: {nextProp.address}, {nextProp.neighborhood || nextProp.city} — {formatPropertyPrice(nextProp, { rentOnly: true })}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 text-[10px] px-1.5 gap-0.5 text-muted-foreground"
                  onClick={onTogglePreview}
                >
                  <Eye className="h-2.5 w-2.5" />
                  {isPreviewOpen ? 'הסתר' : 'תצוגה מקדימה'}
                </Button>
              </div>
            </div>
            {isPreviewOpen && (() => {
              const propertyLink = `https://www.ctmarketproperties.com/property/${nextProp.id}`;
              const queuePostStyle = queue.post_style || 'photos';
              // For link-style posts, don't embed URL in text — it appears as OG Link Card
              const fullText = queuePostStyle === 'link' ? previewText : `${previewText}\n\n${propertyLink}`;
              const sortedImages = ((nextProp as any).property_images || [])
                .filter((img: any) => img.show_on_website !== false && img.image_url);
              // Put main image first, then sort by order_index
              const mainImage = sortedImages.find((img: any) => img.is_main);
              const otherImages = sortedImages
                .filter((img: any) => !img.is_main)
                .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
              const images = (mainImage ? [mainImage, ...otherImages] : otherImages).map((img: any) => img.image_url);

              if (queuePostStyle === 'link') {
                const typeLabel = propertyTypeLabel(nextProp.property_type, 'preposition');
                const price = formatPropertyPrice(nextProp, { rentOnly: true });
                const descParts: string[] = [];
                if (nextProp.rooms) descParts.push(`🛏️ ${nextProp.rooms} חד'`);
                if (nextProp.property_size) descParts.push(`📐 ${nextProp.property_size} מ"ר`);
                if (nextProp.floor != null) descParts.push(`🏢 קומה ${nextProp.floor}`);
                if (price) descParts.push(`💰 ${price}`);
                descParts.push(`📍 ${nextProp.neighborhood || nextProp.city || ''}`);
                return (
                  <div className="mt-1">
                    <FacebookPostPreview
                      text={fullText}
                      hashtags={queue.hashtags as string || ''}
                      linkUrl={propertyLink}
                      linkTitle={`${typeLabel}: ${nextProp.address || 'נכס'}`}
                      linkDescription={descParts.join(' | ')}
                      linkImage={images[0]}
                      pageAvatarUrl={cityMarketLogo}
                      isPublic={!(queue.is_private as boolean)}
                    />
                  </div>
                );
              }

              return (
                <div className="mt-1">
                  <FacebookPostPreview
                    text={fullText}
                    hashtags={queue.hashtags as string || ''}
                    imageUrls={images}
                    pageAvatarUrl={cityMarketLogo}
                    isPublic={!(queue.is_private as boolean)}
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* Articles management */}
        {queue.queue_type === 'article_oneshot' && (
          <AutoPublishArticles queueId={queue.id} />
        )}
      </CardContent>
    </Card>
  );
};
