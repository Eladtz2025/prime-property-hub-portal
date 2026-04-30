import React, { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useDealListings, type DealListing } from '@/hooks/useDealListings';
import { ExternalLink, Flame, TrendingDown, Clock, User, Home, Square, MapPin, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const formatPrice = (price: number, type: 'rent' | 'sale') => {
  if (type === 'sale') {
    return `${(price / 1_000_000).toFixed(2)}M ₪`;
  }
  return `${price.toLocaleString('he-IL')} ₪`;
};

const formatRelative = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = diffMs / (1000 * 60 * 60);
  if (hours < 1) return 'לפני פחות משעה';
  if (hours < 24) return `לפני ${Math.floor(hours)} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
};

const DealCard: React.FC<{ deal: DealListing }> = ({ deal }) => {
  const isSale = deal.property_type === 'sale';
  const discountPct = Math.round(deal.discount_pct * 100);
  const isFresh = Date.now() - new Date(deal.first_seen_at).getTime() < 24 * 60 * 60 * 1000;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow border-r-4" style={{
      borderRightColor: deal.deal_tier === 'strong' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
    }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {deal.deal_tier === 'strong' && (
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white gap-1">
                <Flame className="h-3 w-3" />
                מציאה חזקה
              </Badge>
            )}
            {deal.deal_tier === 'regular' && (
              <Badge variant="secondary" className="gap-1">
                <TrendingDown className="h-3 w-3" />
                מציאה
              </Badge>
            )}
            {isFresh && (
              <Badge className="bg-green-600 hover:bg-green-700 text-white gap-1">
                <Clock className="h-3 w-3" />
                חדש
              </Badge>
            )}
            {deal.is_private === true && (
              <Badge variant="outline" className="gap-1">
                <User className="h-3 w-3" />
                פרטי
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm line-clamp-2">{deal.title || deal.address}</h3>
        </div>
        <div className="text-left shrink-0">
          <div className="text-xs text-muted-foreground">ציון</div>
          <div className="text-2xl font-bold text-primary leading-none">{deal.deal_score}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
        <MapPin className="h-3 w-3" />
        <span>{deal.neighborhood} · {deal.city}</span>
      </div>

      <div className="flex gap-3 text-xs text-muted-foreground mb-3">
        {deal.rooms && (
          <div className="flex items-center gap-1">
            <Home className="h-3 w-3" />
            <span>{deal.rooms} חד׳</span>
          </div>
        )}
        {deal.size && (
          <div className="flex items-center gap-1">
            <Square className="h-3 w-3" />
            <span>{deal.size} מ״ר</span>
          </div>
        )}
        {deal.floor !== null && <span>קומה {deal.floor}</span>}
      </div>

      <div className="bg-muted/50 rounded-md p-2 mb-3 space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">מחיר:</span>
          <span className="font-bold text-base">{formatPrice(deal.price, isSale ? 'sale' : 'rent')}</span>
        </div>
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            ₪/מ״ר
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                <TooltipContent>
                  מדיאן באזור: {deal.median_per_sqm.toLocaleString('he-IL')} ₪/מ״ר
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
          <span>
            <span className="font-semibold">{deal.price_per_sqm.toLocaleString('he-IL')}</span>
            <span className="text-muted-foreground"> / {deal.median_per_sqm.toLocaleString('he-IL')}</span>
          </span>
        </div>
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">הנחה מהמדיאן:</span>
          <span className="font-bold text-green-600">−{discountPct}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{formatRelative(deal.first_seen_at)} · {deal.source}</span>
        {deal.source_url && (
          <Button asChild size="sm" variant="outline" className="h-7 gap-1">
            <a href={deal.source_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              פתח מודעה
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
};

const DealsList: React.FC<{ propertyType: 'rent' | 'sale' }> = ({ propertyType }) => {
  const { data, isLoading, error } = useDealListings(propertyType, 100);
  const [onlyFresh, setOnlyFresh] = useState(false);
  const [onlyPrivate, setOnlyPrivate] = useState(false);
  const [onlyStrong, setOnlyStrong] = useState(false);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((d) => {
      if (onlyFresh && Date.now() - new Date(d.first_seen_at).getTime() > 24 * 60 * 60 * 1000) return false;
      if (onlyPrivate && d.is_private !== true) return false;
      if (onlyStrong && d.deal_tier !== 'strong') return false;
      return true;
    });
  }, [data, onlyFresh, onlyPrivate, onlyStrong]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-sm p-4">שגיאה בטעינת מציאות: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Switch id="fresh" checked={onlyFresh} onCheckedChange={setOnlyFresh} />
          <Label htmlFor="fresh" className="text-sm cursor-pointer">חדש (24ש׳)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="private" checked={onlyPrivate} onCheckedChange={setOnlyPrivate} />
          <Label htmlFor="private" className="text-sm cursor-pointer">פרטי בלבד</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="strong" checked={onlyStrong} onCheckedChange={setOnlyStrong} />
          <Label htmlFor="strong" className="text-sm cursor-pointer">מציאות חזקות (≥25%)</Label>
        </div>
        <div className="mr-auto text-sm text-muted-foreground">
          {filtered.length} מתוך {data?.length ?? 0} מציאות
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>לא נמצאו מציאות התואמות את הסינון.</p>
          <p className="text-xs mt-1">המערכת מחפשת נכסים פעילים מ-21 הימים האחרונים, 15-40% מתחת למדיאן השכונתי.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
};

export const DealsDashboard: React.FC = () => {
  const [activeType, setActiveType] = useState<'rent' | 'sale'>('rent');

  return (
    <div className="space-y-4" dir="rtl">
      <Card className="p-4 bg-gradient-to-l from-primary/5 to-transparent">
        <div className="flex items-start gap-3">
          <Flame className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">דירות מציאה — מרכז ת״א וצפון ישן</p>
            <p className="text-muted-foreground">
              דירות שמחירן 15%-40% מתחת למדיאן ₪/מ״ר באותה שכונה. כולל רוטשילד, נווה צדק וכרם התימנים.
              נכסים חשודים (הנחה {'>'}40%) לא מוצגים. הציון משקלל הנחה, חידוש והאם הנכס פרטי.
            </p>
          </div>
        </div>
      </Card>

      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as 'rent' | 'sale')}>
        <TabsList>
          <TabsTrigger value="rent">השכרה</TabsTrigger>
          <TabsTrigger value="sale">מכירה</TabsTrigger>
        </TabsList>
        <TabsContent value="rent" className="mt-4">
          <DealsList propertyType="rent" />
        </TabsContent>
        <TabsContent value="sale" className="mt-4">
          <DealsList propertyType="sale" />
        </TabsContent>
      </Tabs>
    </div>
  );
};
