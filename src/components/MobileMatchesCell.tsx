import { useCustomerMatches } from "@/hooks/useCustomerMatches";
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
  onMatchesClick?: (data: {
    scoutedMatchGroups: any[];
  }) => void;
}

export function MobileMatchesCell({
  customerId,
  preferredNeighborhoods,
  onMatchesClick,
}: MobileMatchesCellProps) {
  const { data: scoutedMatchGroups = [], isLoading } = useCustomerMatches(customerId);

  const hasNeighborhoods = preferredNeighborhoods && preferredNeighborhoods.length > 0;

  if (isLoading) {
    return <span className="text-[10px] text-muted-foreground">...</span>;
  }

  if (!hasNeighborhoods) {
    return <X className="h-3 w-3 text-red-500 mx-auto" />;
  }

  const totalMatches = scoutedMatchGroups.reduce((acc, group) => acc + group.matches.length, 0);

  if (totalMatches === 0) {
    return <span className="text-[10px] text-muted-foreground">0</span>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMatchesClick?.({ scoutedMatchGroups });
  };

  return (
    <button
      type="button"
      className="text-[10px] font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer bg-transparent border-none p-0"
      onClick={handleClick}
    >
      {totalMatches}
    </button>
  );
}
