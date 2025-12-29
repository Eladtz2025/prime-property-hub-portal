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
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Phone, MessageSquare, Clock, Home, Briefcase, Wallet, Trash2, EyeOff, RotateCcw, ChevronDown, ChevronUp, Save, X, Dog, Car, Building2, TrendingUp, Baby, Wrench, Eye, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/hooks/useCustomerData";

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
  rental: 'שכירות',
  sale: 'מכירה',
  both: 'שניהם',
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
  const [formData, setFormData] = useState<Partial<Customer>>(customer);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);

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

  const handleSaveForm = async () => {
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
          next_followup_date: formData.next_followup_date,
          pets: isRental ? formData.pets : null,
          tenant_type: isRental ? formData.tenant_type : null,
          flexible_move_date: isRental ? formData.flexible_move_date : null,
          parking_required: isRental ? formData.parking_required : null,
          balcony_required: isRental ? formData.balcony_required : null,
          elevator_required: isRental ? formData.elevator_required : null,
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

      toast({ title: 'עודכן בהצלחה', description: 'פרטי הלקוח עודכנו' });
      onSave();
      onToggleExpand();
    } catch (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לעדכן את פרטי הלקוח', variant: 'destructive' });
    } finally {
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
        <TableCell colSpan={9} className="p-0 border-0">
          <Collapsible open={isExpanded}>
            <CollapsibleContent className="bg-muted/20 border-t">
              <div className="p-4 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">שם מלא</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">אימייל</Label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">טלפון</Label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-8 text-sm"
                    />
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

                {/* Budget & Rooms */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">תקציב מינימום</Label>
                    <Input
                      type="number"
                      value={formData.budget_min || ''}
                      onChange={(e) => setFormData({ ...formData, budget_min: parseInt(e.target.value) || null })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">תקציב מקסימום</Label>
                    <Input
                      type="number"
                      value={formData.budget_max || ''}
                      onChange={(e) => setFormData({ ...formData, budget_max: parseInt(e.target.value) || null })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">חדרים מינימום</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.rooms_min || ''}
                      onChange={(e) => setFormData({ ...formData, rooms_min: parseFloat(e.target.value) || null })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">חדרים מקסימום</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.rooms_max || ''}
                      onChange={(e) => setFormData({ ...formData, rooms_max: parseFloat(e.target.value) || null })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Locations & Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">ערים מועדפות (מופרד בפסיקים)</Label>
                    <Input
                      value={formData.preferred_cities?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, preferred_cities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="תל אביב, רמת גן"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">שכונות מועדפות (מופרד בפסיקים)</Label>
                    <Input
                      value={formData.preferred_neighborhoods?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, preferred_neighborhoods: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="רוטשילד, דיזנגוף"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">תאריך כניסה</Label>
                    <Input
                      type="date"
                      value={formData.move_in_date || ''}
                      onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">מעקב הבא</Label>
                    <Input
                      type="datetime-local"
                      value={formData.next_followup_date || ''}
                      onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">סוכן מטפל</Label>
                    <Select 
                      value={formData.assigned_agent_id || 'none'} 
                      onValueChange={(value) => setFormData({ ...formData, assigned_agent_id: value === 'none' ? null : value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
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
                </div>

                {/* Rental-specific fields */}
                {isRental && (
                  <div className="space-y-2 p-3 bg-background/50 rounded-lg">
                    <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      פרטי שכירות
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                      <div className="flex items-center gap-2 pt-5">
                        <Checkbox id={`pets-${customer.id}`} checked={!!formData.pets} onCheckedChange={(c) => setFormData({ ...formData, pets: !!c })} />
                        <Label htmlFor={`pets-${customer.id}`} className="text-xs flex items-center gap-1 cursor-pointer"><Dog className="h-3 w-3" />חיות</Label>
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <Checkbox id={`parking-${customer.id}`} checked={!!formData.parking_required} onCheckedChange={(c) => setFormData({ ...formData, parking_required: !!c })} />
                        <Label htmlFor={`parking-${customer.id}`} className="text-xs flex items-center gap-1 cursor-pointer"><Car className="h-3 w-3" />חניה</Label>
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <Checkbox id={`elevator-${customer.id}`} checked={!!formData.elevator_required} onCheckedChange={(c) => setFormData({ ...formData, elevator_required: !!c })} />
                        <Label htmlFor={`elevator-${customer.id}`} className="text-xs flex items-center gap-1 cursor-pointer"><Building2 className="h-3 w-3" />מעלית</Label>
                      </div>
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
