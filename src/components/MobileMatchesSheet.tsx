import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, ExternalLink, Home, MapPin, Building2 } from "lucide-react";

interface OwnPropertyMatch {
  id: string;
  title?: string;
  address: string;
  city: string;
  rooms?: number;
  property_size?: number;
  monthly_rent?: number;
  price?: number;
  property_type?: string;
}

interface CustomerMatch {
  id: string;
  title: string | null;
  city: string | null;
  price: number | null;
  rooms: number | null;
  size: number | null;
  matchScore: number;
  source_url: string;
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
  ownMatches: OwnPropertyMatch[];
  scoutedMatchGroups: GroupedMatch[];
}

const formatPrice = (price: number | undefined | null) => {
  if (!price) return '-';
  return `₪${price.toLocaleString()}`;
};

export function MobileMatchesSheet({
  open,
  onOpenChange,
  customerName,
  customerPhone,
  ownMatches,
  scoutedMatchGroups,
}: MobileMatchesSheetProps) {
  const scoutedMatchCount = scoutedMatchGroups.reduce((acc, group) => acc + group.matches.length, 0);

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

  const handleViewProperty = (propertyId: string, isOwn: boolean, sourceUrl?: string) => {
    if (isOwn) {
      window.open(`/admin-dashboard?property=${propertyId}`, '_blank');
    } else if (sourceUrl) {
      window.open(sourceUrl, '_blank');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="text-base text-right">
            התאמות עבור {customerName}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="own" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-2 mx-4 mt-3 shrink-0">
            <TabsTrigger value="own" className="text-xs gap-1">
              <Home className="h-3 w-3" />
              נכסים שלנו ({ownMatches.length})
            </TabsTrigger>
            <TabsTrigger value="scouted" className="text-xs gap-1">
              <Building2 className="h-3 w-3" />
              נסרקים ({scoutedMatchCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="own" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {ownMatches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    לא נמצאו התאמות מנכסים שלנו
                  </div>
                ) : (
                  ownMatches.map((property) => (
                    <div key={property.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {property.title || property.address}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{property.city}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] shrink-0">
                          שלנו
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {property.rooms && <span>{property.rooms} חד'</span>}
                        {property.property_size && <span>{property.property_size} מ"ר</span>}
                        <span className="font-medium text-foreground">
                          {formatPrice(property.monthly_rent || property.price)}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        {customerPhone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 flex-1 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleSendWhatsApp(property)}
                          >
                            <MessageSquare className="h-3 w-3" />
                            שלח
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1 text-xs gap-1"
                          onClick={() => handleViewProperty(property.id, true)}
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
          </TabsContent>

          <TabsContent value="scouted" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {scoutedMatchCount === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    לא נמצאו התאמות מנכסים נסרקים
                  </div>
                ) : (
                  scoutedMatchGroups.flatMap((group) =>
                    group.matches.map((match) => (
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
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px]">
                              נסרק
                            </Badge>
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
                              onClick={() => handleSendWhatsApp({
                                title: match.title,
                                city: match.city,
                                price: match.price,
                                rooms: match.rooms,
                              })}
                            >
                              <MessageSquare className="h-3 w-3" />
                              שלח
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 flex-1 text-xs gap-1"
                            onClick={() => handleViewProperty(match.id, false, match.source_url)}
                          >
                            <ExternalLink className="h-3 w-3" />
                            צפה
                          </Button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
