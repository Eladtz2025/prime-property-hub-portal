import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, ExternalLink, MapPin } from "lucide-react";
import { useMemo } from "react";

interface CustomerMatch {
  id: string;
  title: string | null;
  city: string | null;
  price: number | null;
  rooms: number | null;
  size: number | null;
  matchScore: number;
  source_url: string;
  is_private?: boolean | null;
}

interface GroupedMatch {
  groupId: string | null;
  matches: CustomerMatch[];
}

interface MobileMatchesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerPhone?: string;
  scoutedMatchGroups: GroupedMatch[];
}

const formatPrice = (price: number | undefined | null) => {
  if (!price) return '-';
  return `₪${price.toLocaleString()}`;
};

const getPrivacyOrder = (isPrivate: boolean | null | undefined) => {
  if (isPrivate === true) return 0;
  if (isPrivate === null || isPrivate === undefined) return 1;
  return 2;
};

export function MobileMatchesSheet({
  open,
  onOpenChange,
  customerName,
  customerPhone,
  scoutedMatchGroups,
}: MobileMatchesSheetProps) {
  const sortedMatches = useMemo(() => {
    return scoutedMatchGroups
      .flatMap(group => group.matches)
      .sort((a, b) => {
        const privDiff = getPrivacyOrder(a.is_private) - getPrivacyOrder(b.is_private);
        if (privDiff !== 0) return privDiff;
        return b.matchScore - a.matchScore;
      });
  }, [scoutedMatchGroups]);

  const handleSendWhatsApp = (property: { title?: string | null; city?: string | null; price?: number | null; rooms?: number | null }) => {
    if (!customerPhone) return;
    const propertyTitle = property.title || 'נכס';
    const city = property.city || '';
    const price = property.price ? `₪${property.price.toLocaleString()}` : '';
    const rooms = property.rooms ? `${property.rooms} חדרים` : '';
    const message = encodeURIComponent(
      `שלום ${customerName}! 🏠\n\n` +
      `מצאתי עבורך נכס שיכול להתאים לך:\n\n` +
      `📍 ${propertyTitle}${city ? `, ${city}` : ''}\n` +
      `${rooms ? `🛏️ ${rooms}\n` : ''}` +
      `${price ? `💰 ${price}\n` : ''}\n` +
      `האם תרצה לקבוע צפייה?`
    );
    window.open(`https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="text-base text-right">
            התאמות עבור {customerName} ({sortedMatches.length})
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {sortedMatches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                לא נמצאו התאמות
              </div>
            ) : (
              sortedMatches.map((match) => (
                <div key={match.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {match.title || 'נכס נסרק'}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{match.city}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {match.matchScore > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {match.matchScore}%
                        </Badge>
                      )}
                      {match.is_private === true && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">
                          פרטי
                        </Badge>
                      )}
                      {match.is_private === false && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px]">
                          תיווך
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {match.rooms && <span>{match.rooms} חד'</span>}
                    {match.size && <span>{match.size} מ"ר</span>}
                    <span className="font-medium text-foreground">
                      {formatPrice(match.price)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {customerPhone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-1 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => handleSendWhatsApp(match)}
                      >
                        <MessageSquare className="h-3 w-3" />
                        שלח
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 text-xs gap-1"
                      onClick={() => match.source_url && window.open(match.source_url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      צפה
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
