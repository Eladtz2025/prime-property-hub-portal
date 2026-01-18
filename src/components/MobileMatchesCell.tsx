import { useCustomerMatches } from "@/hooks/useCustomerMatches";
import { useOwnPropertyMatches } from "@/hooks/useOwnPropertyMatches";
import { X } from "lucide-react";

interface MobileMatchesCellProps {
  customerId: string;
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
  preferredNeighborhoods,
  preferredCities,
  budgetMin,
  budgetMax,
  roomsMin,
  roomsMax,
  propertyType,
}: MobileMatchesCellProps) => {
  const { data: scoutedMatches = [], isLoading: isLoadingScouted } = useCustomerMatches(customerId);
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

  const totalMatches = scoutedMatches.length + ownMatches.length;

  if (totalMatches === 0) {
    return <span className="text-[10px] text-muted-foreground">0</span>;
  }

  return (
    <span className="text-[10px] font-medium text-primary">
      {totalMatches}
    </span>
  );
};
