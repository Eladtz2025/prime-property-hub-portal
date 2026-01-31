import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Home, Building2, MessageSquare, ExternalLink, X, Copy, Loader2, RefreshCcw } from "lucide-react";
import { useCustomerMatches, GroupedMatch } from "@/hooks/useCustomerMatches";
import { useOwnPropertyMatches } from "@/hooks/useOwnPropertyMatches";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface CustomerMatchesCellProps {
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  preferredCities?: string[] | null;
  preferredNeighborhoods?: string[] | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  roomsMin?: number | null;
  roomsMax?: number | null;
  propertyType?: string | null;
  onRefresh: () => void;
}

export const CustomerMatchesCell = ({
  customerId,
  customerName,
  customerPhone,
  preferredCities,
  preferredNeighborhoods,
  budgetMin,
  budgetMax,
  roomsMin,
  roomsMax,
  propertyType,
  onRefresh
}: CustomerMatchesCellProps) => {
  const { toast } = useToast();
  const [isMatching, setIsMatching] = useState(false);
  
  const { data: scoutedMatchGroups = [], isLoading: isLoadingScouted } = useCustomerMatches(customerId);
  const { data: ownMatches = [], isLoading: isLoadingOwn } = useOwnPropertyMatches({
    id: customerId,
    budget_min: budgetMin,
    budget_max: budgetMax,
    rooms_min: roomsMin,
    rooms_max: roomsMax,
    preferred_cities: preferredCities,
    preferred_neighborhoods: preferredNeighborhoods,
    property_type: propertyType
  });

  const handleMatchLead = async () => {
    setIsMatching(true);
    try {
      await supabase.functions.invoke('trigger-matching', {
        body: { lead_id: customerId, send_whatsapp: false }
      });
      toast({ title: 'התאמה הושלמה', description: 'ההתאמות עודכנו בהצלחה' });
      onRefresh();
    } catch (error) {
      console.error('Match error:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן להתאים נכסים', variant: 'destructive' });
    } finally {
      setIsMatching(false);
    }
  };

  const handleSendWhatsAppScouted = (property: { title: string | null; city: string | null; price: number | null; rooms: number | null; size: number | null; source_url: string }) => {
    if (!customerPhone) return;
    
    const message = encodeURIComponent(
      `שלום ${customerName}!\n\n` +
      `מצאתי דירה שיכולה להתאים לך:\n` +
      `📍 ${property.city || ''}\n` +
      `🏠 ${property.rooms ? `${property.rooms} חדרים` : ''} ${property.size ? `| ${property.size} מ"ר` : ''}\n` +
      `💰 ${property.price ? `₪${property.price.toLocaleString()}` : ''}\n\n` +
      `לפרטים נוספים: ${property.source_url}\n\n` +
      `אשמח לתאם צפייה, מה אומר/ת?`
    );
    window.open(`https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleSendWhatsAppOwn = (property: { title: string | null; address: string; city: string; rooms: number | null; property_size: number | null; monthly_rent: number | null }) => {
    if (!customerPhone) return;
    
    const message = encodeURIComponent(
      `שלום ${customerName}!\n\n` +
      `מצאתי דירה שיכולה להתאים לך:\n` +
      `📍 ${property.city}, ${property.address}\n` +
      `🏠 ${property.rooms ? `${property.rooms} חדרים` : ''} ${property.property_size ? `| ${property.property_size} מ"ר` : ''}\n` +
      `💰 ${property.monthly_rent ? `₪${property.monthly_rent.toLocaleString()}` : ''}\n\n` +
      `אשמח לתאם צפייה, מה אומר/ת?`
    );
    window.open(`https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const hasCities = preferredCities && preferredCities.length > 0;
  const hasNeighborhoods = preferredNeighborhoods && preferredNeighborhoods.length > 0;
  const isLoading = isLoadingScouted || isLoadingOwn;

  if (isLoading) {
    return <span className="text-muted-foreground text-sm">...</span>;
  }

  // Missing neighborhoods
  if (!hasNeighborhoods) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center justify-center">
              <X className="h-4 w-4 text-destructive" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>חסרות שכונות מועדפות</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Missing cities
  if (!hasCities) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center justify-center">
              <X className="h-4 w-4 text-destructive" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>חסרה עיר מועדפת</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const scoutedMatchCount = scoutedMatchGroups.reduce((acc, group) => acc + group.matches.length, 0);
  const totalMatches = scoutedMatchCount + ownMatches.length;

  if (totalMatches === 0) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground text-sm">אין התאמה</span>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 w-7 p-0"
          onClick={handleMatchLead}
          disabled={isMatching}
          title="התאם נכסים"
        >
          {isMatching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
        </Button>
      </div>
    );
  }

  return (
    <Dialog>
      <div className="flex items-center gap-1">
        <DialogTrigger asChild>
          <div className="flex items-center gap-1 cursor-pointer">
            {ownMatches.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 bg-accent/50 text-accent-foreground hover:bg-accent">
                <Building2 className="h-3 w-3" />
                {ownMatches.length}
              </Button>
            )}
            {scoutedMatchCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 bg-primary/10 text-primary hover:bg-primary/20">
                <Home className="h-3 w-3" />
                {scoutedMatchCount}
              </Button>
            )}
          </div>
        </DialogTrigger>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 w-7 p-0"
          onClick={handleMatchLead}
          disabled={isMatching}
          title="התאם נכסים"
        >
          {isMatching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
        </Button>
      </div>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col" dir="rtl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            דירות שהותאמו ל{customerName}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={ownMatches.length > 0 ? "own" : "scouted"} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="own" className="gap-2">
              <Building2 className="h-4 w-4" />
              נכסים שלנו ({ownMatches.length})
            </TabsTrigger>
            <TabsTrigger value="scouted" className="gap-2">
              <Home className="h-4 w-4" />
              נכסים נסרקים ({scoutedMatchCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="own" className="flex-1 overflow-y-auto mt-4">
            {ownMatches.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">לא נמצאו התאמות מנכסים שלנו</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ownMatches.map((match) => (
                  <div key={match.id} className="p-3 border rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{match.title || match.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {match.city && <span>{match.city}</span>}
                          {match.neighborhood && <span> - {match.neighborhood}</span>}
                          {match.rooms && <span> | {match.rooms} חד'</span>}
                          {match.property_size && <span> | {match.property_size} מ"ר</span>}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {match.monthly_rent ? `₪${match.monthly_rent.toLocaleString()}` : ''}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">שלנו</Badge>
                    </div>
                    
                    <div className="mt-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2"
                        onClick={() => window.open(`/admin-dashboard?property=${match.id}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 ml-1" />
                        צפה
                      </Button>
                      {customerPhone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => handleSendWhatsAppOwn(match)}
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="scouted" className="flex-1 overflow-y-auto mt-4">
            {scoutedMatchCount === 0 ? (
              <p className="text-center text-muted-foreground py-8">לא נמצאו התאמות מנכסים נסרקים</p>
            ) : (
              <div className="space-y-3">
                {scoutedMatchGroups.map((group) => (
                  <div 
                    key={group.groupId} 
                    className={group.matches.length > 1 
                      ? "border-2 border-warning rounded-lg p-3 bg-warning/10" 
                      : ""
                    }
                  >
                    {group.matches.length > 1 && (
                      <div className="text-xs text-warning font-medium mb-2 flex items-center gap-1">
                        <Copy className="h-3 w-3" />
                        {group.matches.length} כפילויות - אותה דירה ממקורות שונים
                      </div>
                    )}
                    <div className={group.matches.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-2" : ""}>
                      {group.matches.map((match) => (
                        <div 
                          key={match.id} 
                          className="p-3 border rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                        >
                          <div className="flex items-center gap-1 flex-wrap mb-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {match.source}
                            </Badge>
                            {match.is_private === true && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">פרטי</Badge>
                            )}
                            {match.is_private === false && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">תיווך</Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mr-auto bg-primary/20 text-primary">
                              {match.matchScore}%
                            </Badge>
                          </div>
                          
                          <p className="font-medium truncate text-sm">{match.title || 'דירה ללא כותרת'}</p>
                          <p className="text-xs text-muted-foreground">
                            {match.city && <span>{match.city}</span>}
                            {match.rooms && <span> | {match.rooms} חד'</span>}
                            {match.size && <span> | {match.size} מ"ר</span>}
                          </p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            {match.price ? `₪${match.price.toLocaleString()}` : 'מחיר לא צוין'}
                          </p>
                          
                          {/* Match Reasons */}
                          {match.matchReasons && match.matchReasons.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {match.matchReasons.slice(0, 3).map((reason, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                                  ✓ {reason}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-2 flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs px-2"
                              onClick={() => window.open(match.source_url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 ml-1" />
                              צפה
                            </Button>
                            {customerPhone && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs px-2"
                                onClick={() => handleSendWhatsAppScouted(match)}
                              >
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
