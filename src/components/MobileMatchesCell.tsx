import { useState } from "react";
import { useCustomerMatches } from "@/hooks/useCustomerMatches";
import { useOwnPropertyMatches } from "@/hooks/useOwnPropertyMatches";
import { Button } from "@/components/ui/button";
import { MobileMatchesSheet } from "@/components/MobileMatchesSheet";
import { X } from "lucide-react";

interface MobileMatchesCellProps {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  preferredNeighborhoods?: string[] | null;
  preferredCities?: string[] | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  roomsMin?: number | null;
  roomsMax?: number | null;
  propertyType?: string | null;
}

export const MobileMatchesCell = ({
  customerId,
  customerName,
  customerPhone,
  preferredNeighborhoods,
  preferredCities,
  budgetMin,
  budgetMax,
  roomsMin,
  roomsMax,
  propertyType,
}: MobileMatchesCellProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const { data: scoutedMatchGroups = [], isLoading: isLoadingScouted } = useCustomerMatches(customerId);
  const { data: ownMatches = [], isLoading: isLoadingOwn } = useOwnPropertyMatches({
    id: customerId,
    budget_min: budgetMin,
    budget_max: budgetMax,
    rooms_min: roomsMin,
    rooms_max: roomsMax,
    preferred_cities: preferredCities,
    preferred_neighborhoods: preferredNeighborhoods,
    property_type: propertyType,
  });

  const hasNeighborhoods = preferredNeighborhoods && preferredNeighborhoods.length > 0;
  const isLoading = isLoadingScouted || isLoadingOwn;

  if (isLoading) {
    return <span className="text-[10px] text-muted-foreground">...</span>;
  }

  if (!hasNeighborhoods) {
    return <X className="h-3 w-3 text-red-500 mx-auto" />;
  }

  const scoutedMatchCount = scoutedMatchGroups.reduce((acc, group) => acc + group.matches.length, 0);
  const totalMatches = scoutedMatchCount + ownMatches.length;

  if (totalMatches === 0) {
    return <span className="text-[10px] text-muted-foreground">0</span>;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-[10px] font-medium text-primary hover:text-primary hover:bg-primary/10"
        onClick={(e) => {
          e.stopPropagation();
          setSheetOpen(true);
        }}
      >
        {totalMatches}
      </Button>
      <MobileMatchesSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        customerName={customerName}
        customerPhone={customerPhone}
        ownMatches={ownMatches}
        scoutedMatchGroups={scoutedMatchGroups}
      />
    </>
  );
};
