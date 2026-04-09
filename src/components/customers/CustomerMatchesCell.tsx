import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, X, Copy, Loader2, RefreshCcw, EyeOff, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useCustomerMatches, GroupedMatch } from "@/hooks/useCustomerMatches";
import { useDismissMatch, useRestoreMatch } from "@/hooks/useDismissedMatches";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScoutedPropertyCard } from "./PropertyMatchCard";
import { logger } from '@/utils/logger';

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
  rejectionSummary?: { total_rejected: number; reasons: Record<string, number> } | null;
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
  rejectionSummary,
  onRefresh
}: CustomerMatchesCellProps) => {
  const { toast } = useToast();
  const [isMatching, setIsMatching] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [expandedDuplicateGroups, setExpandedDuplicateGroups] = useState<Record<string, boolean>>({});
  const [duplicatesDialogOpen, setDuplicatesDialogOpen] = useState(false);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<{
    groupId: string;
    winnerId: string;
  } | null>(null);
  
  const { data: scoutedMatchGroups = [], isLoading } = useCustomerMatches(customerId, showDismissed);

  // Sort groups: private first, then unknown, then brokerage
  const sortedMatchGroups = useMemo(() => {
    const getPrivacyOrder = (isPrivate: boolean | null) => {
      if (isPrivate === true) return 0;
      if (isPrivate === null) return 1;
      return 2; // false = brokerage
    };
    return [...scoutedMatchGroups].map(group => ({
      ...group,
      matches: [...group.matches].sort((a, b) => getPrivacyOrder(a.is_private) - getPrivacyOrder(b.is_private)),
    })).sort((a, b) => {
      const aPrivacy = getPrivacyOrder(a.matches[0]?.is_private);
      const bPrivacy = getPrivacyOrder(b.matches[0]?.is_private);
      if (aPrivacy !== bPrivacy) return aPrivacy - bPrivacy;
      // Within same privacy level, keep score-based order
      const aScore = Math.max(...a.matches.map(m => m.matchScore));
      const bScore = Math.max(...b.matches.map(m => m.matchScore));
      return bScore - aScore;
    });
  }, [scoutedMatchGroups]);

  const dismissMatch = useDismissMatch();
  const restoreMatch = useRestoreMatch();

  // Query for fetching all properties in a duplicate group
  const { data: duplicatesInGroup = [] } = useQuery({
    queryKey: ['duplicate-group-matches', selectedDuplicateGroup?.groupId],
    queryFn: async () => {
      if (!selectedDuplicateGroup?.groupId) return [];
      const { data } = await supabase
        .from('scouted_properties')
        .select('id, source, source_url, price, is_private, updated_at, address, title, is_primary_listing')
        .eq('duplicate_group_id', selectedDuplicateGroup.groupId)
        .eq('is_active', true)
        .order('is_primary_listing', { ascending: false })
        .order('price', { ascending: true, nullsFirst: false });
      return data || [];
    },
    enabled: !!selectedDuplicateGroup?.groupId && duplicatesDialogOpen
  });

  const getSourceBadge = useCallback((source: string) => {
    const sourceColors: Record<string, string> = {
      'yad2': 'bg-orange-100 text-orange-800',
      'madlan': 'bg-blue-100 text-blue-800',
      'homeless': 'bg-purple-100 text-purple-800',
      'facebook': 'bg-indigo-100 text-indigo-800',
    };
    return (
      <Badge variant="outline" className={`text-[10px] ${sourceColors[source] || 'bg-gray-100 text-gray-800'}`}>
        {source}
      </Badge>
    );
  }, []);

  const handleOpenDuplicatesDialog = useCallback((groupId: string, winnerId: string) => {
    setSelectedDuplicateGroup({ groupId, winnerId });
    setDuplicatesDialogOpen(true);
  }, []);

  const handleMatchLead = async () => {
    setIsMatching(true);
    try {
      await supabase.functions.invoke('trigger-matching', {
        body: { lead_id: customerId }
      });
      toast({ title: 'התאמה הושלמה', description: 'ההתאמות עודכנו בהצלחה' });
      onRefresh();
    } catch (error) {
      logger.error('Match error:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן להתאים נכסים', variant: 'destructive' });
    } finally {
      setIsMatching(false);
    }
  };

  const handleDismissScoutedProperty = (propertyId: string) => {
    dismissMatch.mutate({ leadId: customerId, scoutedPropertyId: propertyId });
  };

  const handleRestoreScoutedProperty = (propertyId: string) => {
    restoreMatch.mutate({ leadId: customerId, scoutedPropertyId: propertyId });
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


  const hasCities = preferredCities && preferredCities.length > 0;
  const hasNeighborhoods = preferredNeighborhoods && preferredNeighborhoods.length > 0;

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
  const totalActiveMatches = scoutedMatchGroups.reduce((acc, group) => 
    acc + group.matches.filter(m => !m.isDismissed).length, 0);

  // Count dismissed for toggle label
  const totalDismissedCount = scoutedMatchGroups.reduce((acc, group) => 
    acc + group.matches.filter(m => m.isDismissed).length, 0);

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

  // Build rejection tooltip content
  const rejectionTooltipContent = rejectionSummary ? (() => {
    const sortedReasons = Object.entries(rejectionSummary.reasons)
      .sort(([, a], [, b]) => b - a);
    return (
      <div className="text-right space-y-1" dir="rtl">
        <p className="font-medium">{rejectionSummary.total_rejected} נכסים נדחו:</p>
        {sortedReasons.map(([reason, count]) => (
          <p key={reason} className="text-xs">• {reason} — {count}</p>
        ))}
      </div>
    );
  })() : null;

  return (
    <>
    <Dialog>
      <div className="flex items-center gap-1">
        <DialogTrigger asChild>
          <div className="flex items-center gap-1 cursor-pointer">
            {totalActiveMatches > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 bg-primary/10 text-primary hover:bg-primary/20">
                <Home className="h-3 w-3" />
                {totalActiveMatches}
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
        {rejectionSummary && rejectionSummary.total_rejected > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="h-5 w-5 bg-destructive/15 text-destructive rounded-full text-[10px] flex items-center justify-center cursor-help font-medium shrink-0">
                  !
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {rejectionTooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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
        
        <div className="flex-1 overflow-y-auto mt-4">
          {sortedMatchGroups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">לא נמצאו התאמות</p>
          ) : (
            <div className="space-y-3">
              {sortedMatchGroups.map((group, groupIndex) => {
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
                          {group.matches[0]?.duplicatesCount || group.matches.length} כפילויות - אותה דירה ממקורות שונים
                        </div>
                        {group.matches[0]?.duplicateGroupId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDuplicatesDialog(
                                group.matches[0].duplicateGroupId!,
                                group.matches[0].id
                              );
                            }}
                          >
                            <ExternalLink className="h-3 w-3 ml-1" />
                            הצג את כל המודעות
                          </Button>
                        )}
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
        </div>
      </DialogContent>
    </Dialog>

      {/* Duplicates Dialog */}
      <Dialog open={duplicatesDialogOpen} onOpenChange={setDuplicatesDialogOpen}>
        <DialogContent className="max-w-md z-[60]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              מודעות זהות ({duplicatesInGroup.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {duplicatesInGroup.length <= 1 ? (
              <p className="text-center text-muted-foreground py-4">
                אין מודעות נוספות בקבוצה זו
              </p>
            ) : duplicatesInGroup.map((dup) => (
              <div 
                key={dup.id} 
                className={`p-3 border rounded-lg flex items-center justify-between gap-2 ${
                  dup.is_primary_listing ? "bg-primary/5 border-primary/30" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getSourceBadge(dup.source)}
                    {dup.is_private === true && (
                      <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700">פרטי</Badge>
                    )}
                    {dup.is_private === false && (
                      <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700">תיווך</Badge>
                    )}
                    {dup.is_primary_listing && (
                      <Badge className="text-[10px] bg-primary">מנצח</Badge>
                    )}
                  </div>
                  <p className="text-sm mt-1 truncate" title={dup.title || dup.address || ''}>
                    {dup.title || dup.address || 'ללא כותרת'}
                  </p>
                  <p className="text-sm font-medium">
                    {dup.price ? `₪${dup.price.toLocaleString()}` : 'ללא מחיר'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => window.open(dup.source_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
