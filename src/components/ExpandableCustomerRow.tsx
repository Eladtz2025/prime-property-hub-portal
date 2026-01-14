import { useState } from "react";
import { formatIsraeliPhone } from "@/utils/phoneFormatter";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Phone, MessageSquare, Clock, Home, Briefcase, Wallet, Trash2, EyeOff, RotateCcw, ChevronDown, ChevronUp, Save, X, Dog, Car, Building2, AlertCircle, ExternalLink, RefreshCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/hooks/useCustomerData";
import { phoneSchema, emailSchema, requiredNameSchema, validateField } from "@/utils/formValidation";
import { cn } from "@/lib/utils";
import { useCustomerMatches } from "@/hooks/useCustomerMatches";
import { CitySelectorDropdown } from "@/components/ui/city-selector";
import { NeighborhoodSelectorDropdown } from "@/components/ui/neighborhood-selector";
import { COUNTRY_CODES, parsePhoneNumber, combinePhoneNumber } from '@/utils/phoneCountryCodes';

interface Agent {
  id: string;
  full_name: string | null;
  email: string;
}

interface ExpandableCustomerRowProps {
  customer: Customer;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onAssignAgent?: (id: string, agentId: string | null) => void;
  onDeleteCustomer?: (id: string) => void;
  onHideCustomer?: (id: string) => void;
  onUnhideCustomer?: (id: string) => void;
  onSave: () => void;
  agents?: Agent[];
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500 text-white',
  contacted: 'bg-yellow-500 text-black',
  active: 'bg-green-500 text-white',
  viewing_scheduled: 'bg-purple-500 text-white',
  offer_made: 'bg-orange-500 text-white',
  closed_won: 'bg-emerald-600 text-white',
  closed_lost: 'bg-gray-500 text-white',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  active: 'פעיל',
  viewing_scheduled: 'צפייה קבועה',
  offer_made: 'הצעה בוצעה',
  closed_won: 'נסגר בהצלחה',
  closed_lost: 'נסגר ללא הצלחה',
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
  // Legacy values for backwards compatibility
  rent: 'השכרה',
  purchase: 'מכירה',
  RENT: 'השכרה',
  SALE: 'מכירה',
};

// Normalize property_type to standard values
const normalizePropertyType = (type: string | null | undefined): string | null => {
  if (!type) return null;
  const lower = type.toLowerCase();
  if (lower === 'rent') return 'rental';
  if (lower === 'purchase') return 'sale';
  return type;
};

const getTimeSinceContact = (lastContactDate: string | null, createdAt: string) => {
  const date = lastContactDate ? new Date(lastContactDate) : new Date(createdAt);
  const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) return { text: 'היום', color: 'text-green-600', bg: 'bg-green-100' };
  if (daysDiff === 1) return { text: 'אתמול', color: 'text-green-600', bg: 'bg-green-100' };
  if (daysDiff <= 3) return { text: `${daysDiff} ימים`, color: 'text-green-600', bg: 'bg-green-100' };
  if (daysDiff <= 7) return { text: `${daysDiff} ימים`, color: 'text-yellow-600', bg: 'bg-yellow-100' };
  if (daysDiff <= 14) return { text: `${daysDiff} ימים`, color: 'text-orange-600', bg: 'bg-orange-100' };
  return { text: `${daysDiff} ימים`, color: 'text-red-600', bg: 'bg-red-100' };
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

// Separate component for matches to avoid hook call in render
const CustomerMatchesCell = ({ customerId, customerName, customerPhone }: { customerId: string; customerName: string; customerPhone?: string | null }) => {
  const { data: matches = [], isLoading } = useCustomerMatches(customerId);

  const handleSendWhatsApp = (property: { title: string | null; city: string | null; price: number | null; rooms: number | null; size: number | null; source_url: string }) => {
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

  if (isLoading) {
    return <span className="text-muted-foreground text-sm">...</span>;
  }

  if (matches.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-primary hover:text-primary">
          <Home className="h-3 w-3" />
          {matches.length} דירות
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            דירות שהותאמו ל{customerName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {matches.map((match) => (
            <div key={match.id} className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{match.title || 'דירה ללא כותרת'}</p>
                  <p className="text-sm text-muted-foreground">
                    {match.city && <span>{match.city}</span>}
                    {match.rooms && <span> | {match.rooms} חד'</span>}
                    {match.size && <span> | {match.size} מ"ר</span>}
                    {match.price && <span> | ₪{match.price.toLocaleString()}</span>}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {match.matchScore}% התאמה
                </Badge>
              </div>
              
              {match.matchReasons && match.matchReasons.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {match.matchReasons.map((reason, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => window.open(match.source_url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 ml-1" />
                  צפה במקור
                </Button>
                {customerPhone && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-green-600 hover:text-green-700"
                    onClick={() => handleSendWhatsApp(match)}
                  >
                    <MessageSquare className="h-3 w-3 ml-1" />
                    שלח ב-WhatsApp
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ExpandableCustomerRow = ({
  customer,
  isExpanded,
  onToggleExpand,
  onUpdateStatus,
  onUpdatePriority,
  onAssignAgent,
  onDeleteCustomer,
  onHideCustomer,
  onUnhideCustomer,
  onSave,
  agents = [],
}: ExpandableCustomerRowProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Customer>>(() => ({
    ...customer,
    property_type: normalizePropertyType(customer.property_type) || customer.property_type,
  }));
  // Parse phone on mount
  const { countryCode: initialCountryCode, localNumber: initialLocalNumber } = parsePhoneNumber(customer.phone);
  const [phoneCountry, setPhoneCountry] = useState(initialCountryCode);
  const [localPhone, setLocalPhone] = useState(initialLocalNumber);
  const [loading, setLoading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean; email?: boolean }>({});

  const handleMatchLead = async () => {
    setIsMatching(true);
    try {
      await supabase.functions.invoke('match-scouted-to-leads', {
        body: { lead_id: customer.id, send_whatsapp: false }
      });
      toast({ title: 'התאמה הושלמה', description: 'ההתאמות עודכנו בהצלחה' });
      onSave(); // Refresh data
    } catch (error) {
      console.error('Match error:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן להתאים נכסים', variant: 'destructive' });
    } finally {
      setIsMatching(false);
    }
  };

  const handleFieldBlur = (field: 'name' | 'phone' | 'email') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field === 'phone' ? localPhone : (formData[field] || '');
    let error: string | null = null;
    
    if (field === 'name') {
      error = validateField(requiredNameSchema, value);
    } else if (field === 'phone') {
      error = validateField(phoneSchema, value);
    } else if (field === 'email') {
      error = validateField(emailSchema, value);
    }
    
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

  const timeSince = getTimeSinceContact(customer.last_contact_date, customer.created_at);
  const assignedAgent = agents.find(a => a.id === customer.assigned_agent_id);

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

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (customer.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  // Get missing recommended fields (for warning display, not blocking save)
  const getMissingRecommendedFields = (data: typeof formData): string[] => {
    const missing: string[] = [];
    
    if (!data.property_type) missing.push('סוג עסקה');
    if (!data.budget_min) missing.push('תקציב מינימום');
    if (!data.rooms_min) missing.push('חדרים מינימום');
    if (!data.preferred_cities?.length) missing.push('ערים');
    if (!data.preferred_neighborhoods?.length) missing.push('שכונות');
    if (!data.move_in_date) missing.push('תאריך כניסה');
    
    // Rental-specific recommended fields
    const isRental = data.property_type === 'rental' || data.property_type === 'rent';
    if (isRental) {
      if (!data.tenant_type) missing.push('סוג דייר');
      if (data.pets === undefined || data.pets === null) missing.push('חיות');
    }
    
    return missing;
  };

  // Check if customer has missing fields (for row display)
  const getCustomerMissingFields = (): string[] => {
    const missing: string[] = [];
    
    if (!customer.property_type) missing.push('סוג עסקה');
    if (!customer.budget_min) missing.push('תקציב מינימום');
    if (!customer.rooms_min) missing.push('חדרים מינימום');
    if (!customer.preferred_cities?.length) missing.push('ערים');
    if (!customer.preferred_neighborhoods?.length) missing.push('שכונות');
    if (!customer.move_in_date) missing.push('תאריך כניסה');
    
    const isRental = customer.property_type === 'rental' || customer.property_type === 'rent';
    if (isRental) {
      if (!customer.tenant_type) missing.push('סוג דייר');
      if (customer.pets === undefined || customer.pets === null) missing.push('חיות');
    }
    
    return missing;
  };
  
  const customerMissingFields = getCustomerMissingFields();

  const handleSaveForm = async () => {
    // Validate basic fields
    const nameError = validateField(requiredNameSchema, formData.name || '');
    const phoneError = validateField(phoneSchema, localPhone || '');
    const emailError = validateField(emailSchema, formData.email || '');
    
    setTouched({ name: true, phone: true, email: true });
    setErrors({ name: nameError || undefined, phone: phoneError || undefined, email: emailError || undefined });
    
    if (nameError || phoneError || emailError) {
      toast({ title: 'שגיאה בטופס', description: 'אנא תקן את השגיאות לפני השמירה', variant: 'destructive' });
      return;
    }
    
    // Check for missing recommended fields (warning only, don't block save)
    const missingFields = getMissingRecommendedFields(formData);
    if (missingFields.length > 0) {
      toast({ 
        title: 'שדות מומלצים חסרים', 
        description: `מומלץ למלא: ${missingFields.join(', ')}`,
        variant: 'default' 
      });
      // Don't return - allow save to continue
    }
    
    setLoading(true);
    try {
      // Normalize property_type before save
      const normalizedPropertyType = normalizePropertyType(formData.property_type);
      const isRental = normalizedPropertyType === 'rental' || normalizedPropertyType === 'both';
      const isSale = normalizedPropertyType === 'sale' || normalizedPropertyType === 'both';

      // Check if any matching-related preferences changed
      const citiesChanged = JSON.stringify(formData.preferred_cities?.sort()) !== JSON.stringify(customer.preferred_cities?.sort());
      const neighborhoodsChanged = JSON.stringify(formData.preferred_neighborhoods?.sort()) !== JSON.stringify(customer.preferred_neighborhoods?.sort());
      const preferencesChanged = citiesChanged || neighborhoodsChanged || 
        formData.budget_min !== customer.budget_min || formData.budget_max !== customer.budget_max ||
        formData.rooms_min !== customer.rooms_min || formData.rooms_max !== customer.rooms_max ||
        normalizedPropertyType !== normalizePropertyType(customer.property_type) ||
        formData.parking_required !== customer.parking_required ||
        formData.elevator_required !== customer.elevator_required ||
        formData.balcony_required !== customer.balcony_required ||
        formData.pets !== customer.pets;

      const fullPhone = combinePhoneNumber(phoneCountry, localPhone);

      const { error } = await supabase
        .from('contact_leads')
        .update({
          name: formData.name,
          email: formData.email,
          phone: fullPhone,
          status: formData.status,
          priority: formData.priority,
          assigned_agent_id: formData.assigned_agent_id,
          budget_min: formData.budget_min,
          budget_max: formData.budget_max,
          rooms_min: formData.rooms_min,
          rooms_max: formData.rooms_max,
          preferred_cities: formData.preferred_cities,
          preferred_neighborhoods: formData.preferred_neighborhoods,
          property_type: normalizedPropertyType,
          move_in_date: formData.move_in_date,
          notes: formData.notes,
          next_followup_date: formData.next_followup_date,
          pets: isRental ? formData.pets : null,
          tenant_type: isRental ? formData.tenant_type : null,
          flexible_move_date: isRental ? formData.flexible_move_date : null,
          parking_required: formData.parking_required ?? null,
          balcony_required: formData.balcony_required ?? null,
          elevator_required: formData.elevator_required ?? null,
          yard_required: formData.yard_required ?? null,
          // Flexibility flags
          parking_flexible: formData.parking_flexible ?? true,
          balcony_flexible: formData.balcony_flexible ?? true,
          elevator_flexible: formData.elevator_flexible ?? true,
          yard_flexible: formData.yard_flexible ?? true,
          purchase_purpose: isSale ? formData.purchase_purpose : null,
          cash_available: isSale ? formData.cash_available : null,
          property_to_sell: isSale ? formData.property_to_sell : null,
          lawyer_details: isSale ? formData.lawyer_details : null,
          urgency_level: isSale ? formData.urgency_level : null,
          renovation_budget: isSale ? formData.renovation_budget : null,
          new_or_second_hand: isSale ? formData.new_or_second_hand : null,
          floor_preference: isSale ? formData.floor_preference : null,
          view_preference: isSale ? formData.view_preference : null,
        })
        .eq('id', customer.id);

      if (error) throw error;

      // Save completed - show success toast immediately
      toast({ title: 'עודכן בהצלחה', description: 'פרטי הלקוח נשמרו' });
      onSave();
      onToggleExpand();
      setLoading(false);

      // Re-run matching in background if preferences changed
      if (preferencesChanged) {
        setIsMatching(true);
        supabase.functions.invoke('match-scouted-to-leads', {
          body: { lead_id: customer.id, send_whatsapp: false }
        })
        .then(() => {
          toast({ description: 'ההתאמות עודכנו בהצלחה' });
          onSave(); // Refresh to show new matches
        })
        .catch((matchError) => {
          console.error('Error re-matching:', matchError);
          toast({ description: 'שגיאה בעדכון התאמות', variant: 'destructive' });
        })
        .finally(() => {
          setIsMatching(false);
        });
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לעדכן את פרטי הלקוח', variant: 'destructive' });
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(customer);
    onToggleExpand();
  };

  const confirmDelete = () => {
    onDeleteCustomer?.(customer.id);
    setDeleteDialogOpen(false);
  };

  const confirmHide = () => {
    onHideCustomer?.(customer.id);
    setHideDialogOpen(false);
  };

  const isRental = formData.property_type === 'rental' || formData.property_type === 'both';
  const isSale = formData.property_type === 'sale' || formData.property_type === 'both';

  return (
    <>
      <TableRow 
        className={`hover:bg-muted/30 cursor-pointer transition-colors ${customer.is_hidden ? 'opacity-50 bg-muted/20' : ''} ${isExpanded ? 'bg-muted/40' : ''}`}
        onClick={onToggleExpand}
      >
        <TableCell className="font-medium text-right">
          <div className="flex items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                {customer.name}
                {customerMissingFields.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-4 w-4 text-amber-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <p className="text-sm">שדות חסרים: {customerMissingFields.join(', ')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {customer.is_hidden && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">לא רלוונטי</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                {customer.email}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right">
          {customer.phone ? formatIsraeliPhone(customer.phone) : '-'}
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
          <span className="text-sm font-medium">
            {formatBudget(customer.budget_min, customer.budget_max)}
          </span>
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <Select 
            value={customer.status} 
            onValueChange={(value) => onUpdateStatus(customer.id, value)}
          >
            <SelectTrigger className="h-7 text-xs w-[100px] border-0 bg-transparent p-0">
              <Badge className={`${statusColors[customer.status]} text-xs`}>
                {statusLabels[customer.status]}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">חדש</SelectItem>
              <SelectItem value="contacted">נוצר קשר</SelectItem>
              <SelectItem value="active">פעיל</SelectItem>
              <SelectItem value="viewing_scheduled">צפייה קבועה</SelectItem>
              <SelectItem value="offer_made">הצעה בוצעה</SelectItem>
              <SelectItem value="closed_won">נסגר בהצלחה</SelectItem>
              <SelectItem value="closed_lost">נסגר ללא הצלחה</SelectItem>
            </SelectContent>
          </Select>
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
          {onAssignAgent && agents.length > 0 ? (
            <Select 
              value={customer.assigned_agent_id || "none"} 
              onValueChange={(value) => onAssignAgent(customer.id, value === "none" ? null : value)}
            >
              <SelectTrigger className="h-7 text-xs w-[100px]">
                <SelectValue placeholder="בחר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.full_name || agent.email.split('@')[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-muted-foreground text-sm">
              {assignedAgent?.full_name || assignedAgent?.email.split('@')[0] || '-'}
            </span>
          )}
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <CustomerMatchesCell customerId={customer.id} customerName={customer.name} customerPhone={customer.phone} />
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0"
              onClick={() => handleMatchLead()}
              disabled={isMatching}
              title="התאם נכסים"
            >
              {isMatching ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCcw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${timeSince.bg} ${timeSince.color}`}>
            <Clock className="h-3 w-3" />
            {timeSince.text}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex gap-1 items-center">
            {customer.phone && (
              <>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCall} title="התקשר">
                  <Phone className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:text-green-700" onClick={handleWhatsApp} title="WhatsApp">
                  <MessageSquare className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Edit Section */}
      <TableRow className={isExpanded ? '' : 'hidden'}>
        <TableCell colSpan={10} className="p-0 border-0">
          <Collapsible open={isExpanded}>
            <CollapsibleContent className="bg-muted/20 border-t">
              <div className="p-4 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">שם מלא *</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onBlur={() => handleFieldBlur('name')}
                      className={cn("h-8 text-sm", touched.name && errors.name && 'border-destructive')}
                    />
                    {touched.name && errors.name && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">אימייל</Label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onBlur={() => handleFieldBlur('email')}
                      className={cn("h-8 text-sm", touched.email && errors.email && 'border-destructive')}
                    />
                    {touched.email && errors.email && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">טלפון</Label>
                    <div className="flex gap-1">
                      <Select value={phoneCountry} onValueChange={setPhoneCountry}>
                        <SelectTrigger className="h-8 text-xs w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_CODES.map(country => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={localPhone}
                        onChange={(e) => setLocalPhone(e.target.value)}
                        onBlur={() => handleFieldBlur('phone')}
                        placeholder={phoneCountry === 'IL' ? '050-1234567' : '555-1234'}
                        className={cn("h-8 text-sm flex-1", touched.phone && errors.phone && 'border-destructive')}
                      />
                    </div>
                    {touched.phone && errors.phone && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">סוג עסקה</Label>
                    <Select value={formData.property_type || 'rental'} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rental">השכרה</SelectItem>
                        <SelectItem value="sale">מכירה</SelectItem>
                        <SelectItem value="both">שניהם</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Budget, Rooms, Cities, Neighborhoods - Combined Row */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div>
                    <Label className="text-xs">תקציב מינ.</Label>
                    <Input
                      type="number"
                      value={formData.budget_min || ''}
                      onChange={(e) => setFormData({ ...formData, budget_min: parseInt(e.target.value) || null })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">תקציב מקס.</Label>
                    <Input
                      type="number"
                      value={formData.budget_max || ''}
                      onChange={(e) => setFormData({ ...formData, budget_max: parseInt(e.target.value) || null })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">חד' מינ.</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.rooms_min || ''}
                      onChange={(e) => setFormData({ ...formData, rooms_min: parseFloat(e.target.value) || null })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">חד' מקס.</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.rooms_max || ''}
                      onChange={(e) => setFormData({ ...formData, rooms_max: parseFloat(e.target.value) || null })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ערים</Label>
                    <CitySelectorDropdown
                      selectedCities={formData.preferred_cities || []}
                      onChange={(cities) => setFormData({ ...formData, preferred_cities: cities })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">שכונות</Label>
                    <NeighborhoodSelectorDropdown
                      selectedCities={formData.preferred_cities || []}
                      selectedNeighborhoods={formData.preferred_neighborhoods || []}
                      onChange={(neighborhoods) => setFormData({ ...formData, preferred_neighborhoods: neighborhoods })}
                    />
                  </div>
                </div>

                {/* Dates, Tenant Type, Pets, Features - Combined Row (Rental) / Agent (All) */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div>
                    <Label className="text-xs">מתאריך</Label>
                    <Input
                      type="date"
                      value={formData.move_in_date || ''}
                      onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">עד תאריך</Label>
                    <Input
                      type="date"
                      value={formData.move_out_date || ''}
                      onChange={(e) => setFormData({ ...formData, move_out_date: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  {isRental ? (
                    <>
                      <div>
                        <Label className="text-xs">סוג דייר</Label>
                        <Select value={formData.tenant_type || ''} onValueChange={(value) => setFormData({ ...formData, tenant_type: value })}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="בחר" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">סטודנט</SelectItem>
                            <SelectItem value="employee">שכיר</SelectItem>
                            <SelectItem value="family">משפחה</SelectItem>
                            <SelectItem value="couple">זוג</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs flex items-center gap-1"><Dog className="h-3 w-3" />חיות</Label>
                        <Select 
                          value={formData.pets === true ? 'yes' : formData.pets === false ? 'no' : ''} 
                          onValueChange={(value) => setFormData({ ...formData, pets: value === 'yes' ? true : value === 'no' ? false : null })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="בחר" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">יש</SelectItem>
                            <SelectItem value="no">אין</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs text-muted-foreground">דרישות מהנכס:</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {/* Parking */}
                          <div className="flex items-center gap-1 p-1.5 rounded border bg-background">
                            <Checkbox id={`parking-${customer.id}`} checked={!!formData.parking_required} onCheckedChange={(c) => setFormData({ ...formData, parking_required: !!c })} />
                            <Label htmlFor={`parking-${customer.id}`} className="text-xs flex items-center gap-0.5 cursor-pointer flex-1"><Car className="h-3 w-3" />חניה</Label>
                            {formData.parking_required && (
                              <div className="flex items-center gap-0.5 border-r pr-1">
                                <Checkbox 
                                  id={`parking-flex-${customer.id}`} 
                                  checked={formData.parking_flexible !== false}
                                  onCheckedChange={(c) => setFormData({ ...formData, parking_flexible: !!c })} 
                                />
                                <Label htmlFor={`parking-flex-${customer.id}`} className="text-[10px] text-muted-foreground cursor-pointer">גמיש</Label>
                              </div>
                            )}
                          </div>
                          {/* Elevator */}
                          <div className="flex items-center gap-1 p-1.5 rounded border bg-background">
                            <Checkbox id={`elevator-${customer.id}`} checked={!!formData.elevator_required} onCheckedChange={(c) => setFormData({ ...formData, elevator_required: !!c })} />
                            <Label htmlFor={`elevator-${customer.id}`} className="text-xs flex items-center gap-0.5 cursor-pointer flex-1"><Building2 className="h-3 w-3" />מעלית</Label>
                            {formData.elevator_required && (
                              <div className="flex items-center gap-0.5 border-r pr-1">
                                <Checkbox 
                                  id={`elevator-flex-${customer.id}`} 
                                  checked={formData.elevator_flexible !== false}
                                  onCheckedChange={(c) => setFormData({ ...formData, elevator_flexible: !!c })} 
                                />
                                <Label htmlFor={`elevator-flex-${customer.id}`} className="text-[10px] text-muted-foreground cursor-pointer">גמיש</Label>
                              </div>
                            )}
                          </div>
                          {/* Balcony */}
                          <div className="flex items-center gap-1 p-1.5 rounded border bg-background">
                            <Checkbox id={`balcony-${customer.id}`} checked={!!formData.balcony_required} onCheckedChange={(c) => setFormData({ ...formData, balcony_required: !!c })} />
                            <Label htmlFor={`balcony-${customer.id}`} className="text-xs cursor-pointer flex-1">מרפסת</Label>
                            {formData.balcony_required && (
                              <div className="flex items-center gap-0.5 border-r pr-1">
                                <Checkbox 
                                  id={`balcony-flex-${customer.id}`} 
                                  checked={formData.balcony_flexible !== false}
                                  onCheckedChange={(c) => setFormData({ ...formData, balcony_flexible: !!c })} 
                                />
                                <Label htmlFor={`balcony-flex-${customer.id}`} className="text-[10px] text-muted-foreground cursor-pointer">גמיש</Label>
                              </div>
                            )}
                          </div>
                          {/* Yard */}
                          <div className="flex items-center gap-1 p-1.5 rounded border bg-background">
                            <Checkbox id={`yard-${customer.id}`} checked={!!formData.yard_required} onCheckedChange={(c) => setFormData({ ...formData, yard_required: !!c })} />
                            <Label htmlFor={`yard-${customer.id}`} className="text-xs cursor-pointer flex-1">חצר</Label>
                            {formData.yard_required && (
                              <div className="flex items-center gap-0.5 border-r pr-1">
                                <Checkbox 
                                  id={`yard-flex-${customer.id}`} 
                                  checked={formData.yard_flexible !== false}
                                  onCheckedChange={(c) => setFormData({ ...formData, yard_flexible: !!c })} 
                                />
                                <Label htmlFor={`yard-flex-${customer.id}`} className="text-[10px] text-muted-foreground cursor-pointer">גמיש</Label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs">מעקב הבא</Label>
                        <Input
                          type="datetime-local"
                          value={formData.next_followup_date || ''}
                          onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label className="text-xs">סוכן</Label>
                    <Select 
                      value={formData.assigned_agent_id || 'none'} 
                      onValueChange={(value) => setFormData({ ...formData, assigned_agent_id: value === 'none' ? null : value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="בחר" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ללא</SelectItem>
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.full_name || agent.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rental followup - separate small row */}
                {isRental && (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div>
                      <Label className="text-xs">מעקב הבא</Label>
                      <Input
                        type="datetime-local"
                        value={formData.next_followup_date || ''}
                        onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Purchase-specific fields */}
                {isSale && (
                  <div className="space-y-2 p-3 bg-background/50 rounded-lg">
                    <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      פרטי רכישה
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">מטרת הרכישה</Label>
                        <Select value={formData.purchase_purpose || ''} onValueChange={(value) => setFormData({ ...formData, purchase_purpose: value })}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="בחר" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residence">מגורים</SelectItem>
                            <SelectItem value="investment">השקעה</SelectItem>
                            <SelectItem value="for_child">לילד/ה</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">הון עצמי (₪)</Label>
                        <Input
                          type="number"
                          value={formData.cash_available || ''}
                          onChange={(e) => setFormData({ ...formData, cash_available: parseInt(e.target.value) || null })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">תקציב שיפוץ (₪)</Label>
                        <Input
                          type="number"
                          value={formData.renovation_budget || ''}
                          onChange={(e) => setFormData({ ...formData, renovation_budget: parseInt(e.target.value) || null })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <Checkbox id={`sell-${customer.id}`} checked={!!formData.property_to_sell} onCheckedChange={(c) => setFormData({ ...formData, property_to_sell: !!c })} />
                        <Label htmlFor={`sell-${customer.id}`} className="text-xs cursor-pointer">נכס למכירה</Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label className="text-xs">הערות</Label>
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 justify-between pt-2 border-t">
                  <div className="flex gap-2">
                    {customer.is_hidden ? (
                      <Button variant="outline" size="sm" onClick={() => onUnhideCustomer?.(customer.id)}>
                        <RotateCcw className="h-3 w-3 ml-1" />
                        שחזר
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setHideDialogOpen(true)}>
                        <EyeOff className="h-3 w-3 ml-1" />
                        לא רלוונטי
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="h-3 w-3 ml-1" />
                      מחק
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="h-3 w-3 ml-1" />
                      ביטול
                    </Button>
                    <Button size="sm" onClick={handleSaveForm} disabled={loading}>
                      <Save className="h-3 w-3 ml-1" />
                      {loading ? 'שומר...' : 'שמור'}
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TableCell>
      </TableRow>

      {/* Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>פעולה זו תמחק את הלקוח לצמיתות.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>סמן כלא רלוונטי?</AlertDialogTitle>
            <AlertDialogDescription>הלקוח יוסתר מהרשימה אבל ניתן יהיה לשחזר אותו.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmHide}>אישור</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
