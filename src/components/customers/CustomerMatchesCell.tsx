import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, Building2, X, Copy, Loader2, RefreshCcw, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { useCustomerMatches, GroupedMatch } from "@/hooks/useCustomerMatches";
import { useOwnPropertyMatches } from "@/hooks/useOwnPropertyMatches";
import { useDismissMatch, useRestoreMatch } from "@/hooks/useDismissedMatches";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ScoutedPropertyCard, OwnPropertyCard } from "./PropertyMatchCard";

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
  const [showDismissed, setShowDismissed] = useState(false);
  const [expandedDuplicateGroups, setExpandedDuplicateGroups] = useState<Record<string, boolean>>({});
  
  const { data: scoutedMatchGroups = [], isLoading: isLoadingScouted } = useCustomerMatches(customerId, showDismissed);
  const { data: ownMatches = [], isLoading: isLoadingOwn } = useOwnPropertyMatches({
    id: customerId,
    budget_min: budgetMin,
    budget_max: budgetMax,
    rooms_min: roomsMin,
    rooms_max: roomsMax,
    preferred_cities: preferredCities,
    preferred_neighborhoods: preferredNeighborhoods,
    property_type: propertyType
  }, showDismissed);

  const dismissMatch = useDismissMatch();
  const restoreMatch = useRestoreMatch();

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

  const handleDismissScoutedProperty = (propertyId: string) => {
    dismissMatch.mutate({ leadId: customerId, scoutedPropertyId: propertyId });
  };

  const handleDismissOwnProperty = (propertyId: string) => {
    dismissMatch.mutate({ leadId: customerId, propertyId });
  };

  const handleRestoreScoutedProperty = (propertyId: string) => {
    restoreMatch.mutate({ leadId: customerId, scoutedPropertyId: propertyId });
  };

  const handleRestoreOwnProperty = (propertyId: string) => {
    restoreMatch.mutate({ leadId: customerId, propertyId });
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

  // Count only non-dismissed matches for display
  const activeScoutedMatchCount = scoutedMatchGroups.reduce((acc, group) => 
    acc + group.matches.filter(m => !m.isDismissed).length, 0);
  const activeOwnMatchCount = ownMatches.filter(m => !m.isDismissed).length;
  const totalActiveMatches = activeScoutedMatchCount + activeOwnMatchCount;

  // Count dismissed for toggle label
  const dismissedScoutedCount = scoutedMatchGroups.reduce((acc, group) => 
    acc + group.matches.filter(m => m.isDismissed).length, 0);
  const dismissedOwnCount = ownMatches.filter(m => m.isDismissed).length;
  const totalDismissedCount = dismissedScoutedCount + dismissedOwnCount;

  if (totalActiveMatches === 0 && !showDismissed) {
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
            {activeOwnMatchCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 bg-accent/50 text-accent-foreground hover:bg-accent">
                <Building2 className="h-3 w-3" />
                {activeOwnMatchCount}
              </Button>
            )}
            {activeScoutedMatchCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 bg-primary/10 text-primary hover:bg-primary/20">
                <Home className="h-3 w-3" />
                {activeScoutedMatchCount}
              </Button>
            )}
            {totalActiveMatches === 0 && totalDismissedCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-muted-foreground">
                <EyeOff className="h-3 w-3" />
                {totalDismissedCount}
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
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              דירות שהותאמו ל{customerName}
            </DialogTitle>
            {totalDismissedCount > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox 
                  checked={showDismissed} 
                  onCheckedChange={(checked) => setShowDismissed(checked === true)}
                />
                <span className="text-muted-foreground">
                  הצג מוסתרים ({totalDismissedCount})
                </span>
              </label>
            )}
          </div>
        </DialogHeader>
        
        <Tabs defaultValue={activeOwnMatchCount > 0 ? "own" : "scouted"} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="own" className="gap-2">
              <Building2 className="h-4 w-4" />
              נכסים שלנו ({showDismissed ? ownMatches.length : activeOwnMatchCount})
            </TabsTrigger>
            <TabsTrigger value="scouted" className="gap-2">
              <Home className="h-4 w-4" />
              נכסים נסרקים ({showDismissed ? scoutedMatchGroups.reduce((acc, g) => acc + g.matches.length, 0) : activeScoutedMatchCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="own" className="flex-1 overflow-y-auto mt-4">
            {ownMatches.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">לא נמצאו התאמות מנכסים שלנו</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ownMatches.map((match) => (
                  <OwnPropertyCard
                    key={match.id}
                    match={match}
                    customerName={customerName}
                    customerPhone={customerPhone}
                    onDismiss={handleDismissOwnProperty}
                    onRestore={handleRestoreOwnProperty}
                    onSendWhatsApp={handleSendWhatsAppOwn}
                    isLoading={dismissMatch.isPending || restoreMatch.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="scouted" className="flex-1 overflow-y-auto mt-4">
            {scoutedMatchGroups.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">לא נמצאו התאמות מנכסים נסרקים</p>
            ) : (
              <div className="space-y-3">
                {scoutedMatchGroups.map((group, groupIndex) => {
                  const groupKey = group.groupId || group.matches[0]?.id || `group-${groupIndex}`;
                  const hasDuplicates = group.matches.length > 1;
                  const isExpanded = !!expandedDuplicateGroups[groupKey];
                  const matchesToRender = hasDuplicates && !isExpanded 
                    ? group.matches.slice(0, 1) 
                    : group.matches;

                  return (
                    <div 
                      key={groupKey} 
                      className={hasDuplicates ? "border-2 border-warning rounded-lg p-3 bg-warning/10" : ""}
                    >
                      {hasDuplicates && (
                        <div className="text-xs text-warning font-medium mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Copy className="h-3 w-3" />
                            {group.matches.length} כפילויות - אותה דירה ממקורות שונים
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-warning hover:text-warning hover:bg-warning/20"
                            onClick={() => setExpandedDuplicateGroups(prev => ({
                              ...prev,
                              [groupKey]: !isExpanded
                            }))}
                          >
                            {isExpanded ? (
                              <>הסתר <ChevronUp className="h-3 w-3 mr-1" /></>
                            ) : (
                              <>הצג הכל <ChevronDown className="h-3 w-3 mr-1" /></>
                            )}
                          </Button>
                        </div>
                      )}
                      <div className={hasDuplicates ? "grid grid-cols-1 md:grid-cols-2 gap-2" : ""}>
                        {matchesToRender.map((match) => (
                          <ScoutedPropertyCard
                            key={match.id}
                            match={match}
                            customerName={customerName}
                            customerPhone={customerPhone}
                            onDismiss={handleDismissScoutedProperty}
                            onRestore={handleRestoreScoutedProperty}
                            onSendWhatsApp={handleSendWhatsAppScouted}
                            isLoading={dismissMatch.isPending || restoreMatch.isPending}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
