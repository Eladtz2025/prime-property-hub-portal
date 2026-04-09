import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageSquare, Clock, Home, Briefcase, Wallet, AlertCircle } from "lucide-react";
import { CustomerMatchesCell } from "./CustomerMatchesCell";
import type { Customer } from "@/hooks/useCustomerData";

interface CustomerTableRowProps {
  customer: Customer;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onSave: () => void;
}

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-warning/20 text-warning-foreground',
  urgent: 'bg-destructive/20 text-destructive',
};

const priorityLabels: Record<string, string> = {
  low: 'נמוך',
  medium: 'בינוני',
  high: 'גבוה',
  urgent: 'דחוף',
};

const propertyTypeLabels: Record<string, string> = {
  rental: 'השכרה',
  sale: 'מכירה',
  both: 'שניהם',
  rent: 'השכרה',
  purchase: 'מכירה',
};

const getTimeSinceContact = (lastContactDate: string | null, createdAt: string) => {
  const date = lastContactDate ? new Date(lastContactDate) : new Date(createdAt);
  const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) return { text: 'היום', className: 'bg-accent text-accent-foreground' };
  if (daysDiff === 1) return { text: 'אתמול', className: 'bg-accent text-accent-foreground' };
  if (daysDiff <= 3) return { text: `${daysDiff} ימים`, className: 'bg-accent text-accent-foreground' };
  if (daysDiff <= 7) return { text: `${daysDiff} ימים`, className: 'bg-warning/20 text-warning-foreground' };
  if (daysDiff <= 14) return { text: `${daysDiff} ימים`, className: 'bg-warning/40 text-warning-foreground' };
  return { text: `${daysDiff} ימים`, className: 'bg-destructive/20 text-destructive' };
};

const formatBudget = (min?: number | null, max?: number | null) => {
  if (!min && !max) return '-';
  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return n.toString();
  };
  if (min && max) return `₪${formatNum(min)}-${formatNum(max)}`;
  if (min) return `₪${formatNum(min)}+`;
  if (max) return `עד ₪${formatNum(max)}`;
  return '-';
};

export const CustomerTableRow = ({
  customer,
  isExpanded,
  onToggleExpand,
  onUpdatePriority,
  onSave
}: CustomerTableRowProps) => {
  const timeSince = getTimeSinceContact(customer.last_contact_date, customer.created_at);
  const isEligibleForMatching = customer.matching_status === 'eligible';
  const eligibilityReason = customer.eligibility_reason;

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (customer.phone) {
      const message = encodeURIComponent(
        `שלום ${customer.name}, אני מ-City Market נדל"ן.\n` +
        (customer.preferred_cities?.length ? `ראיתי שאתה מחפש דירה ב${customer.preferred_cities[0]}` : 'ראיתי שאתה מחפש דירה') +
        `.\nיש לי כמה נכסים שיכולים להתאים לך, מתי נוח לדבר?`
      );
      window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  return (
    <TableRow 
      className={`hover:bg-muted/30 cursor-pointer transition-colors ${customer.is_hidden ? 'opacity-50 bg-muted/20' : ''} ${isExpanded ? 'bg-muted/40' : ''}`}
      onClick={onToggleExpand}
    >
      <TableCell className="font-medium text-right">
        <div className="flex items-center gap-2">
          {customer.phone && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0" 
              onClick={handleWhatsApp} 
              title="WhatsApp"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              {customer.phone ? (
                <a 
                  href={`tel:${customer.phone}`}
                  className="font-medium text-sm text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {customer.name}
                </a>
              ) : (
                <span className="font-medium text-sm">{customer.name}</span>
              )}
              {!isEligibleForMatching && eligibilityReason && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-4 w-4 text-warning cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="text-sm">{eligibilityReason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {customer.is_hidden && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">לא רלוונטי</Badge>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {customer.property_type ? (
          <Badge variant="outline" className="gap-1">
            {customer.property_type === 'rental' ? (
              <Home className="h-3 w-3" />
            ) : customer.property_type === 'sale' ? (
              <Briefcase className="h-3 w-3" />
            ) : (
              <Wallet className="h-3 w-3" />
            )}
            {propertyTypeLabels[customer.property_type] || customer.property_type}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center gap-1 text-sm">
          <Wallet className="h-3 w-3 text-muted-foreground" />
          <span>{formatBudget(customer.budget_min, customer.budget_max)}</span>
        </div>
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <Select 
          value={customer.priority} 
          onValueChange={(value) => onUpdatePriority(customer.id, value)}
        >
          <SelectTrigger className="h-7 text-xs w-[80px] border-0 bg-transparent p-0">
            <Badge className={`${priorityColors[customer.priority]} text-xs`}>
              {priorityLabels[customer.priority]}
            </Badge>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">נמוך</SelectItem>
            <SelectItem value="medium">בינוני</SelectItem>
            <SelectItem value="high">גבוה</SelectItem>
            <SelectItem value="urgent">דחוף</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <CustomerMatchesCell 
          customerId={customer.id} 
          customerName={customer.name} 
          customerPhone={customer.phone}
          preferredCities={customer.preferred_cities}
          preferredNeighborhoods={customer.preferred_neighborhoods}
          budgetMin={customer.budget_min}
          budgetMax={customer.budget_max}
          roomsMin={customer.rooms_min}
          roomsMax={customer.rooms_max}
          propertyType={customer.property_type}
          rejectionSummary={customer.rejection_summary}
          onRefresh={onSave}
        />
      </TableCell>
      <TableCell className="text-right">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${timeSince.className}`}>
          <Clock className="h-3 w-3" />
          {timeSince.text}
        </span>
      </TableCell>
    </TableRow>
  );
};
