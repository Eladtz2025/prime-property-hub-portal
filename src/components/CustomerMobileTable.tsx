import { useState } from "react";
import { formatIsraeliPhone } from "@/utils/phoneFormatter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Phone, MessageSquare, Save, X, Trash2, EyeOff, RotateCcw, Home, Briefcase, Dog } from "lucide-react";
import { PropertyRequirementsDropdown } from "@/components/PropertyRequirementsDropdown";
import { CitySelectorDropdown } from "@/components/ui/city-selector";
import { NeighborhoodSelectorDropdown } from "@/components/ui/neighborhood-selector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/hooks/useCustomerData";

interface Agent {
  id: string;
  full_name: string | null;
  email: string;
}

interface CustomerMobileTableProps {
  customers: Customer[];
  onSave: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onAssignAgent?: (id: string, agentId: string | null) => void;
  onDeleteCustomer?: (id: string) => void;
  onHideCustomer?: (id: string) => void;
  onUnhideCustomer?: (id: string) => void;
  agents?: Agent[];
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  active: 'bg-green-500',
  viewing_scheduled: 'bg-purple-500',
  offer_made: 'bg-orange-500',
  closed_won: 'bg-emerald-600',
  closed_lost: 'bg-gray-400',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  new: 'חדש',
  contacted: 'קשר',
  active: 'פעיל',
  viewing_scheduled: 'צפייה',
  offer_made: 'הצעה',
  closed_won: '✓',
  closed_lost: '✗',
};

const priorityLabels: Record<string, string> = {
  low: 'נמוך',
  medium: 'בינוני',
  high: 'גבוה',
  urgent: 'דחוף',
};

const getTimeAgo = (lastContactDate: string | null, createdAt: string) => {
  const date = lastContactDate ? new Date(lastContactDate) : new Date(createdAt);
  const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) return { text: 'היום', color: 'text-green-600' };
  if (daysDiff === 1) return { text: 'אתמול', color: 'text-green-600' };
  if (daysDiff <= 3) return { text: `${daysDiff}י`, color: 'text-green-600' };
  if (daysDiff <= 7) return { text: `${daysDiff}י`, color: 'text-yellow-600' };
  if (daysDiff <= 14) return { text: `${daysDiff}י`, color: 'text-orange-600' };
  return { text: `${daysDiff}י`, color: 'text-red-600' };
};

const propertyTypeLabels: Record<string, string> = {
  rental: 'ש',
  sale: 'מ',
  both: 'שמ',
};

const formatBudget = (min: number | null, max: number | null) => {
  if (!min && !max) return '-';
  const formatNum = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}K` : n.toString();
  if (min && max) return `₪${formatNum(min)}-${formatNum(max)}`;
  if (min) return `₪${formatNum(min)}+`;
  if (max) return `עד ₪${formatNum(max)}`;
  return '-';
};

export const CustomerMobileTable = ({ 
  customers, 
  onSave,
  onUpdateStatus,
  onUpdatePriority,
  onAssignAgent,
  onDeleteCustomer,
  onHideCustomer,
  onUnhideCustomer,
  agents = [],
}: CustomerMobileTableProps) => {
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(customer);
    setSheetOpen(true);
  };

  const handleWhatsApp = () => {
    if (selectedCustomer?.phone) {
      const message = encodeURIComponent(
        `שלום ${selectedCustomer.name}, אני מ-City Market נדל"ן.\n` +
        (selectedCustomer.preferred_cities?.length ? `ראיתי שאתה מחפש דירה ב${selectedCustomer.preferred_cities[0]}` : 'ראיתי שאתה מחפש דירה') +
        `.\nיש לי כמה נכסים שיכולים להתאים לך, מתי נוח לדבר?`
      );
      window.open(`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  const handleCall = () => {
    if (selectedCustomer?.phone) {
      window.location.href = `tel:${selectedCustomer.phone}`;
    }
  };

  const handleSaveForm = async () => {
    if (!selectedCustomer) return;
    
    setLoading(true);
    try {
      const isRental = formData.property_type === 'rental' || formData.property_type === 'both';
      const isSale = formData.property_type === 'sale' || formData.property_type === 'both';

      const { error } = await supabase
        .from('contact_leads')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          priority: formData.priority,
          assigned_agent_id: formData.assigned_agent_id,
          budget_min: formData.budget_min,
          budget_max: formData.budget_max,
          rooms_min: formData.rooms_min,
          rooms_max: formData.rooms_max,
          preferred_cities: formData.preferred_cities,
          preferred_neighborhoods: formData.preferred_neighborhoods,
          property_type: formData.property_type,
          move_in_date: formData.move_in_date,
          notes: formData.notes,
          pets: isRental ? formData.pets : null,
          tenant_type: isRental ? formData.tenant_type : null,
          flexible_move_date: isRental ? formData.flexible_move_date : null,
          parking_required: isRental ? formData.parking_required : null,
          balcony_required: isRental ? formData.balcony_required : null,
          elevator_required: isRental ? formData.elevator_required : null,
          yard_required: isRental ? formData.yard_required : null,
          parking_flexible: isRental ? formData.parking_flexible : null,
          balcony_flexible: isRental ? formData.balcony_flexible : null,
          elevator_flexible: isRental ? formData.elevator_flexible : null,
          yard_flexible: isRental ? formData.yard_flexible : null,
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
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      toast({ title: 'עודכן בהצלחה', description: 'פרטי הלקוח עודכנו' });
      onSave();
      setSheetOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לעדכן את פרטי הלקוח', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    if (selectedCustomer) {
      onDeleteCustomer?.(selectedCustomer.id);
      setDeleteDialogOpen(false);
      setSheetOpen(false);
      setSelectedCustomer(null);
    }
  };

  const confirmHide = () => {
    if (selectedCustomer) {
      onHideCustomer?.(selectedCustomer.id);
      setHideDialogOpen(false);
      setSheetOpen(false);
      setSelectedCustomer(null);
    }
  };

  const handleUnhide = () => {
    if (selectedCustomer) {
      onUnhideCustomer?.(selectedCustomer.id);
      setSheetOpen(false);
      setSelectedCustomer(null);
    }
  };

  const isRental = formData.property_type === 'rental' || formData.property_type === 'both';
  const isSale = formData.property_type === 'sale' || formData.property_type === 'both';

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-semibold py-2 px-2 text-xs">שם</TableHead>
              <TableHead className="text-center font-semibold py-2 px-1 text-xs w-9">סוג</TableHead>
              <TableHead className="text-right font-semibold py-2 px-1 text-xs w-16">תקציב</TableHead>
              <TableHead className="text-center font-semibold py-2 px-1 text-xs w-12">עדיפות</TableHead>
              <TableHead className="text-center font-semibold py-2 px-1 text-xs w-10">התאמות</TableHead>
              <TableHead className="text-center font-semibold py-2 px-1 text-xs w-10">זמן</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              const timeAgo = getTimeAgo(customer.last_contact_date, customer.created_at);
              
              return (
                <TableRow
                  key={customer.id}
                  className={`cursor-pointer active:bg-muted/80 transition-colors ${customer.is_hidden ? 'opacity-50' : ''}`}
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <TableCell className="py-2.5 px-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm truncate max-w-[100px] flex items-center gap-1">
                        {customer.name}
                        {customer.is_hidden && <Badge variant="secondary" className="text-[8px] px-1 py-0">מוסתר</Badge>}
                      </span>
                      {customer.phone && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {formatIsraeliPhone(customer.phone)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 px-1 text-center">
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      {propertyTypeLabels[customer.property_type] || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 px-1 text-right">
                    <span className="text-[10px] text-muted-foreground">
                      {formatBudget(customer.budget_min, customer.budget_max)}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 px-1 text-center">
                    <span 
                      className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-medium text-white ${priorityColors[customer.priority]}`}
                    >
                      {priorityLabels[customer.priority]}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 px-1 text-center">
                    <span className="text-[10px] text-muted-foreground">-</span>
                  </TableCell>
                  <TableCell className={`py-2.5 px-1 text-center text-[10px] font-medium ${timeAgo.color}`}>
                    {timeAgo.text}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center justify-between gap-2">
              <span className="text-base truncate max-w-[200px]">עריכה - {selectedCustomer?.name}</span>
              <div className="flex gap-1 shrink-0">
                {selectedCustomer?.phone && (
                  <>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={handleCall}>
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-green-600" onClick={handleWhatsApp}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">שם מלא</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">טלפון</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">אימייל</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">סטטוס</Label>
                <Select value={formData.status || 'new'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
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
              </div>
              <div>
                <Label className="text-xs">עדיפות</Label>
                <Select value={formData.priority || 'medium'} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">נמוך</SelectItem>
                    <SelectItem value="medium">בינוני</SelectItem>
                    <SelectItem value="high">גבוה</SelectItem>
                    <SelectItem value="urgent">דחוף</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">סוג עסקה</Label>
                <Select value={formData.property_type || 'rental'} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                  <SelectTrigger className="h-9">
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

            {/* Budget & Rooms */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">תקציב מינימום</Label>
                <Input
                  type="number"
                  value={formData.budget_min || ''}
                  onChange={(e) => setFormData({ ...formData, budget_min: parseInt(e.target.value) || null })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">תקציב מקסימום</Label>
                <Input
                  type="number"
                  value={formData.budget_max || ''}
                  onChange={(e) => setFormData({ ...formData, budget_max: parseInt(e.target.value) || null })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">חדרים מינימום</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.rooms_min || ''}
                  onChange={(e) => setFormData({ ...formData, rooms_min: parseFloat(e.target.value) || null })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">חדרים מקסימום</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.rooms_max || ''}
                  onChange={(e) => setFormData({ ...formData, rooms_max: parseFloat(e.target.value) || null })}
                  className="h-9"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="text-xs">ערים מועדפות</Label>
              <CitySelectorDropdown
                selectedCities={formData.preferred_cities || []}
                onChange={(cities) => setFormData({ ...formData, preferred_cities: cities })}
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs">שכונות מועדפות</Label>
              <NeighborhoodSelectorDropdown
                selectedCities={formData.preferred_cities || []}
                selectedNeighborhoods={formData.preferred_neighborhoods || []}
                onChange={(neighborhoods) => setFormData({ ...formData, preferred_neighborhoods: neighborhoods })}
                className="h-9"
              />
            </div>

            {/* Dates */}
            <div>
              <Label className="text-xs">תאריך כניסה</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={formData.move_in_date || ''}
                  onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                  className="h-9 flex-1"
                />
                <div className="flex items-center gap-1">
                  <Checkbox 
                    id={`move-date-flex-mobile`}
                    checked={formData.flexible_move_date !== false}
                    onCheckedChange={(c) => setFormData({ ...formData, flexible_move_date: !!c })}
                  />
                  <Label htmlFor={`move-date-flex-mobile`} className="text-[10px] text-muted-foreground cursor-pointer">גמיש</Label>
                </div>
              </div>
            </div>

            {/* Agent */}
            <div>
              <Label className="text-xs">סוכן מטפל</Label>
              <Select 
                value={formData.assigned_agent_id || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, assigned_agent_id: value === 'none' ? null : value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="בחר סוכן" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא סוכן</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.full_name || agent.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rental-specific */}
            {isRental && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <h4 className="text-xs font-semibold flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  פרטי שכירות
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">סוג דייר</Label>
                    <Select value={formData.tenant_type || ''} onValueChange={(value) => setFormData({ ...formData, tenant_type: value })}>
                      <SelectTrigger className="h-9">
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
                  <div className="flex items-center gap-2 pt-5">
                    <div className="flex items-center gap-1">
                      <Checkbox id="m-pets" checked={!!formData.pets} onCheckedChange={(c) => setFormData({ ...formData, pets: !!c })} />
                      <Label htmlFor="m-pets" className="text-xs flex items-center gap-1"><Dog className="h-3 w-3" />חיות</Label>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">דרישות מהנכס</Label>
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
                    })}
                    compact
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Purchase-specific */}
            {isSale && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <h4 className="text-xs font-semibold flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  פרטי רכישה
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">מטרת הרכישה</Label>
                    <Select value={formData.purchase_purpose || ''} onValueChange={(value) => setFormData({ ...formData, purchase_purpose: value })}>
                      <SelectTrigger className="h-9">
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
                      className="h-9"
                    />
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
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-4 border-t">
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSaveForm} disabled={loading}>
                  <Save className="h-4 w-4 ml-1" />
                  {loading ? 'שומר...' : 'שמור שינויים'}
                </Button>
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                {selectedCustomer?.is_hidden ? (
                  <Button variant="outline" className="flex-1" onClick={handleUnhide}>
                    <RotateCcw className="h-4 w-4 ml-1" />
                    שחזר לקוח
                  </Button>
                ) : (
                  <Button variant="outline" className="flex-1" onClick={() => setHideDialogOpen(true)}>
                    <EyeOff className="h-4 w-4 ml-1" />
                    לא רלוונטי
                  </Button>
                )}
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
