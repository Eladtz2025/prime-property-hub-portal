import { useState } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Phone, MessageSquare, Clock, Home, Briefcase, Wallet, Trash2, EyeOff, RotateCcw, Save, X, Dog, AlertCircle } from "lucide-react";
import { PropertyRequirementsDropdown } from "@/components/PropertyRequirementsDropdown";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/hooks/useCustomerData";
import { phoneSchema, emailSchema, requiredNameSchema, validateField } from "@/utils/formValidation";
import { cn } from "@/lib/utils";
import { CustomerMatchesCell } from "@/components/customers/CustomerMatchesCell";
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
  const { countryCode: initialCountryCode, localNumber: initialLocalNumber } = parsePhoneNumber(customer.phone);
  const [phoneCountry, setPhoneCountry] = useState(initialCountryCode);
  const [localPhone, setLocalPhone] = useState(initialLocalNumber);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean; email?: boolean }>({});

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

  const getMissingRecommendedFields = (data: typeof formData): string[] => {
    const missing: string[] = [];
    if (!data.property_type) missing.push('סוג עסקה');
    if (!data.budget_min) missing.push('תקציב מינימום');
    if (!data.rooms_min) missing.push('חדרים מינימום');
    if (!data.preferred_cities?.length) missing.push('ערים');
    if (!data.preferred_neighborhoods?.length) missing.push('שכונות');
    if (!data.move_in_date) missing.push('תאריך כניסה');
    
    const isRentalType = data.property_type === 'rental' || data.property_type === 'rent';
    if (isRentalType) {
      if (!data.tenant_type) missing.push('סוג דייר');
      if (data.pets === undefined || data.pets === null) missing.push('חיות');
    }
    
    return missing;
  };

  const handleSaveForm = async () => {
    const nameError = validateField(requiredNameSchema, formData.name || '');
    const phoneError = validateField(phoneSchema, localPhone || '');
    const emailError = validateField(emailSchema, formData.email || '');
    
    setTouched({ name: true, phone: true, email: true });
    setErrors({ name: nameError || undefined, phone: phoneError || undefined, email: emailError || undefined });
    
    if (nameError || phoneError || emailError) {
      toast({ title: 'שגיאה בטופס', description: 'אנא תקן את השגיאות לפני השמירה', variant: 'destructive' });
      return;
    }
    
    const missingFields = getMissingRecommendedFields(formData);
    if (missingFields.length > 0) {
      toast({ 
        title: 'שדות מומלצים חסרים', 
        description: `מומלץ למלא: ${missingFields.join(', ')}`,
        variant: 'default' 
      });
    }
    
    setLoading(true);
    try {
      const normalizedPropertyType = normalizePropertyType(formData.property_type);
      const isRental = normalizedPropertyType === 'rental' || normalizedPropertyType === 'both';
      const isSale = normalizedPropertyType === 'sale' || normalizedPropertyType === 'both';

      const preferencesChanged = 
        JSON.stringify(formData.preferred_cities?.sort()) !== JSON.stringify(customer.preferred_cities?.sort()) ||
        JSON.stringify(formData.preferred_neighborhoods?.sort()) !== JSON.stringify(customer.preferred_neighborhoods?.sort()) ||
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
          phone_2: formData.phone_2 || null,
          status: formData.status,
          priority: formData.priority,
          assigned_agent_id: formData.assigned_agent_id,
          budget_min: formData.budget_min,
          budget_max: formData.budget_max,
          rooms_min: formData.rooms_min,
          rooms_max: formData.rooms_max,
          size_min: formData.size_min ?? null,
          size_max: formData.size_max ?? null,
          preferred_cities: formData.preferred_cities,
          preferred_neighborhoods: formData.preferred_neighborhoods,
          property_type: normalizedPropertyType,
          move_in_date: formData.move_in_date,
          immediate_entry: formData.immediate_entry ?? false,
          notes: formData.notes,
          next_followup_date: formData.next_followup_date,
          pets: isRental ? formData.pets : null,
          tenant_type: isRental ? formData.tenant_type : null,
          flexible_move_date: isRental ? formData.flexible_move_date : null,
          parking_required: formData.parking_required ?? null,
          balcony_required: formData.balcony_required ?? null,
          elevator_required: formData.elevator_required ?? null,
          yard_required: formData.yard_required ?? null,
          roof_required: formData.roof_required ?? null,
          parking_flexible: formData.parking_flexible ?? true,
          balcony_flexible: formData.balcony_flexible ?? true,
          elevator_flexible: formData.elevator_flexible ?? true,
          yard_flexible: formData.yard_flexible ?? true,
          roof_flexible: formData.roof_flexible ?? true,
          outdoor_space_any: formData.outdoor_space_any ?? false,
          mamad_required: formData.mamad_required ?? null,
          mamad_flexible: formData.mamad_flexible ?? true,
          furnished_required: formData.furnished_required ?? null,
          furnished_flexible: formData.furnished_flexible ?? true,
          pets_flexible: formData.pets_flexible ?? true,
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

      toast({ title: 'עודכן בהצלחה', description: 'פרטי הלקוח נשמרו' });
      onSave();
      onToggleExpand();
      setLoading(false);

      // Re-run matching in background if preferences changed
      if (preferencesChanged) {
        supabase.functions.invoke('trigger-matching', {
          body: { lead_id: customer.id, send_whatsapp: false }
        })
        .then(() => {
          toast({ description: 'ההתאמות עודכנו בהצלחה' });
          onSave();
        })
        .catch((matchError) => {
          console.error('Error re-matching:', matchError);
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
      {/* Table Row */}
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

      {/* Expanded Edit Section */}
      <TableRow className={isExpanded ? '' : 'hidden'}>
        <TableCell colSpan={6} className="p-0 border-0">
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
                  <div className="space-y-1">
                    <Label className="text-xs">טלפון 2</Label>
                    <Input
                      value={formData.phone_2 || ''}
                      onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })}
                      placeholder="מספר נוסף (אופציונלי)"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Row 2: Transaction Type + Budget + Rooms + Size */}
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
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
                    <Label className="text-xs">מ"ר מינ.</Label>
                    <Input
                      type="number"
                      value={formData.size_min || ''}
                      onChange={(e) => setFormData({ ...formData, size_min: parseInt(e.target.value) || null })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">מ"ר מקס.</Label>
                    <Input
                      type="number"
                      value={formData.size_max || ''}
                      onChange={(e) => setFormData({ ...formData, size_max: parseInt(e.target.value) || null })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Row 3: Location + Entry Date + Dynamic fields + Agent */}
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
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
                  <div>
                    <Label className="text-xs">תאריך כניסה</Label>
                    <Input
                      type="date"
                      value={formData.move_in_date || ''}
                      onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                      className="h-8 text-sm"
                      disabled={formData.immediate_entry === true}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Checkbox 
                          id={`immediate-entry-${customer.id}`}
                          checked={formData.immediate_entry === true}
                          onCheckedChange={(c) => setFormData({ 
                            ...formData, 
                            immediate_entry: !!c,
                            move_in_date: c ? null : formData.move_in_date
                          })}
                        />
                        <Label htmlFor={`immediate-entry-${customer.id}`} className="text-[10px] text-muted-foreground cursor-pointer">מיידי</Label>
                      </div>
                      <div className="flex items-center gap-1">
                        <Checkbox 
                          id={`move-date-flex-${customer.id}`}
                          checked={formData.flexible_move_date === true}
                          onCheckedChange={(c) => setFormData({ ...formData, flexible_move_date: !!c })}
                          disabled={formData.immediate_entry === true}
                        />
                        <Label htmlFor={`move-date-flex-${customer.id}`} className="text-[10px] text-muted-foreground cursor-pointer">גמיש</Label>
                      </div>
                    </div>
                  </div>
                  {isRental && (
                    <>
                      <div>
                        <Label className="text-xs">סוג דייר</Label>
                        <Select value={formData.tenant_type || ''} onValueChange={(value) => setFormData({ ...formData, tenant_type: value })}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="בחר" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">יחיד/ה</SelectItem>
                            <SelectItem value="couple">זוג</SelectItem>
                            <SelectItem value="family">משפחה</SelectItem>
                            <SelectItem value="roommates">שותפים</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">חיות</Label>
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
                      <div>
                        <Label className="text-xs text-muted-foreground">דרישות מהנכס:</Label>
                        <PropertyRequirementsDropdown
                          values={{
                            parking_required: formData.parking_required,
                            parking_flexible: formData.parking_flexible,
                            balcony_required: formData.balcony_required,
                            balcony_flexible: formData.balcony_flexible,
                            elevator_required: formData.elevator_required,
                            elevator_flexible: formData.elevator_flexible,
                            yard_required: formData.yard_required,
                            yard_flexible: formData.yard_flexible,
                            roof_required: formData.roof_required,
                            roof_flexible: formData.roof_flexible,
                            outdoor_space_any: formData.outdoor_space_any,
                            mamad_required: formData.mamad_required,
                            mamad_flexible: formData.mamad_flexible,
                            furnished_required: formData.furnished_required,
                            furnished_flexible: formData.furnished_flexible,
                          }}
                          onChange={(vals) => setFormData({
                            ...formData,
                            parking_required: vals.parking_required,
                            parking_flexible: vals.parking_flexible,
                            balcony_required: vals.balcony_required,
                            balcony_flexible: vals.balcony_flexible,
                            elevator_required: vals.elevator_required,
                            elevator_flexible: vals.elevator_flexible,
                            yard_required: vals.yard_required,
                            yard_flexible: vals.yard_flexible,
                            roof_required: vals.roof_required,
                            roof_flexible: vals.roof_flexible,
                            outdoor_space_any: vals.outdoor_space_any,
                            mamad_required: vals.mamad_required,
                            mamad_flexible: vals.mamad_flexible,
                            furnished_required: vals.furnished_required,
                            furnished_flexible: vals.furnished_flexible,
                          })}
                          compact
                          className="w-full"
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
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">דרישות מהנכס:</Label>
                      <PropertyRequirementsDropdown
                        values={{
                          parking_required: formData.parking_required,
                          parking_flexible: formData.parking_flexible,
                          balcony_required: formData.balcony_required,
                          balcony_flexible: formData.balcony_flexible,
                          elevator_required: formData.elevator_required,
                          elevator_flexible: formData.elevator_flexible,
                          yard_required: formData.yard_required,
                          yard_flexible: formData.yard_flexible,
                          roof_required: formData.roof_required,
                          roof_flexible: formData.roof_flexible,
                          outdoor_space_any: formData.outdoor_space_any,
                          mamad_required: formData.mamad_required,
                          mamad_flexible: formData.mamad_flexible,
                          furnished_required: formData.furnished_required,
                          furnished_flexible: formData.furnished_flexible,
                        }}
                        onChange={(vals) => setFormData({
                          ...formData,
                          parking_required: vals.parking_required,
                          parking_flexible: vals.parking_flexible,
                          balcony_required: vals.balcony_required,
                          balcony_flexible: vals.balcony_flexible,
                          elevator_required: vals.elevator_required,
                          elevator_flexible: vals.elevator_flexible,
                          yard_required: vals.yard_required,
                          yard_flexible: vals.yard_flexible,
                          roof_required: vals.roof_required,
                          roof_flexible: vals.roof_flexible,
                          outdoor_space_any: vals.outdoor_space_any,
                          mamad_required: vals.mamad_required,
                          mamad_flexible: vals.mamad_flexible,
                          furnished_required: vals.furnished_required,
                          furnished_flexible: vals.furnished_flexible,
                        })}
                        compact
                        className="w-full"
                      />
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
