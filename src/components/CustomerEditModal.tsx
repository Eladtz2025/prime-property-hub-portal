import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/hooks/useCustomerData";
import { CustomerPropertyMatches } from "@/components/CustomerPropertyMatches";
import { Dog, Home, Briefcase, Baby, TrendingUp, Wrench, Eye, Layers, AlertCircle } from "lucide-react";
import { PropertyRequirementsDropdown } from "@/components/PropertyRequirementsDropdown";
import { phoneSchema, emailSchema, requiredNameSchema, validateField } from "@/utils/formValidation";
import { cn } from "@/lib/utils";
import { CitySelectorCompact } from "@/components/ui/city-selector";
import { NeighborhoodSelectorCompact } from "@/components/ui/neighborhood-selector";
import { COUNTRY_CODES, parsePhoneNumber, combinePhoneNumber } from '@/utils/phoneCountryCodes';

interface Agent {
  id: string;
  full_name: string | null;
  email: string;
}

interface CustomerEditModalProps {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  agents?: Agent[];
}

export const CustomerEditModal = ({ customer, open, onClose, onSave, agents = [] }: CustomerEditModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>(customer || {});
  const [phoneCountry, setPhoneCountry] = useState('IL');
  const [localPhone, setLocalPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean; email?: boolean }>({});

  useEffect(() => {
    if (customer) {
      setFormData(customer);
      // Parse phone number to extract country code and local number
      const { countryCode, localNumber } = parsePhoneNumber(customer.phone);
      setPhoneCountry(countryCode);
      setLocalPhone(localNumber);
      setErrors({});
      setTouched({});
    }
  }, [customer]);

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

  const handleSave = async () => {
    if (!customer) return;
    
    // Validate all fields before save
    const nameError = validateField(requiredNameSchema, formData.name || '');
    const phoneError = validateField(phoneSchema, localPhone || '');
    const emailError = validateField(emailSchema, formData.email || '');
    
    setTouched({ name: true, phone: true, email: true });
    setErrors({ name: nameError || undefined, phone: phoneError || undefined, email: emailError || undefined });
    
    if (nameError || phoneError || emailError) {
      toast({
        title: 'שגיאה בטופס',
        description: 'אנא תקן את השגיאות לפני השמירה',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      const isRental = formData.property_type === 'rental' || formData.property_type === 'both';
      const isSale = formData.property_type === 'sale' || formData.property_type === 'both';
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
          property_type: formData.property_type,
          move_in_date: formData.move_in_date,
          notes: formData.notes,
          // Rental-specific
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
          // Purchase-specific
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

      toast({
        title: 'עודכן בהצלחה',
        description: 'פרטי הלקוח עודכנו',
      });
      
      onSave();
      onClose();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן את פרטי הלקוח',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  const isRental = formData.property_type === 'rental' || formData.property_type === 'both';
  const isSale = formData.property_type === 'sale' || formData.property_type === 'both';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת לקוח - {customer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>שם מלא *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={() => handleFieldBlur('name')}
                className={cn(touched.name && errors.name && 'border-destructive')}
              />
              {touched.name && errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>אימייל</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={() => handleFieldBlur('email')}
                className={cn(touched.email && errors.email && 'border-destructive')}
              />
              {touched.email && errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>טלפון</Label>
              <div className="flex gap-2">
                <Select value={phoneCountry} onValueChange={setPhoneCountry}>
                  <SelectTrigger className="w-[130px]">
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
                  placeholder={phoneCountry === 'IL' ? '050-1234567' : '555-123-4567'}
                  className={cn("flex-1", touched.phone && errors.phone && 'border-destructive')}
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>
            <div>
              <Label>סטטוס</Label>
              <Select value={formData.status || 'new'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
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
              <Label>עדיפות</Label>
              <Select value={formData.priority || 'medium'} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>סוכן מטפל</Label>
              <Select 
                value={formData.assigned_agent_id || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, assigned_agent_id: value === 'none' ? null : value })}
              >
                <SelectTrigger>
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
            <div>
              <Label>סוג עסקה</Label>
              <Select value={formData.property_type || 'rental'} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                <SelectTrigger>
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

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>תקציב מינימום</Label>
              <Input
                type="number"
                value={formData.budget_min || ''}
                onChange={(e) => setFormData({ ...formData, budget_min: parseInt(e.target.value) || null })}
              />
            </div>
            <div>
              <Label>תקציב מקסימום</Label>
              <Input
                type="number"
                value={formData.budget_max || ''}
                onChange={(e) => setFormData({ ...formData, budget_max: parseInt(e.target.value) || null })}
              />
            </div>
            <div>
              <Label>חדרים מינימום</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.rooms_min || ''}
                onChange={(e) => setFormData({ ...formData, rooms_min: parseFloat(e.target.value) || null })}
              />
            </div>
            <div>
              <Label>חדרים מקסימום</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.rooms_max || ''}
                onChange={(e) => setFormData({ ...formData, rooms_max: parseFloat(e.target.value) || null })}
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">ערים מועדפות</Label>
            <CitySelectorCompact
              selectedCities={formData.preferred_cities || []}
              onChange={(cities) => setFormData({ ...formData, preferred_cities: cities })}
            />
          </div>

          {(formData.preferred_cities?.length || 0) > 0 && (
            <div>
              <Label className="mb-2 block">שכונות מועדפות</Label>
              <NeighborhoodSelectorCompact
                selectedCities={formData.preferred_cities || []}
                selectedNeighborhoods={formData.preferred_neighborhoods || []}
                onChange={(neighborhoods) => setFormData({ ...formData, preferred_neighborhoods: neighborhoods })}
              />
            </div>
          )}

          <div>
            <Label>תאריך כניסה מבוקש</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={formData.move_in_date || ''}
                onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                className="flex-1"
              />
              <div className="flex items-center gap-1.5">
                <Checkbox 
                  id="move-date-flex-edit"
                  checked={formData.flexible_move_date !== false}
                  onCheckedChange={(c) => setFormData({ ...formData, flexible_move_date: !!c })}
                />
                <Label htmlFor="move-date-flex-edit" className="text-xs text-muted-foreground cursor-pointer">גמיש</Label>
              </div>
            </div>
          </div>

          {/* Rental-specific fields */}
          {isRental && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  פרטי שכירות
                </h3>
                
                <div>
                  <Label>סוג דייר</Label>
                  <Select value={formData.tenant_type || ''} onValueChange={(value) => setFormData({ ...formData, tenant_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סוג דייר" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">סטודנט</SelectItem>
                      <SelectItem value="employee">שכיר</SelectItem>
                      <SelectItem value="family">משפחה</SelectItem>
                      <SelectItem value="couple">זוג</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1">
                      <Dog className="h-4 w-4" />
                      חיות מחמד
                    </Label>
                    <Select 
                      value={formData.pets === true ? 'yes' : formData.pets === false ? 'no' : ''} 
                      onValueChange={(value) => setFormData({ ...formData, pets: value === 'yes' ? true : value === 'no' ? false : null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">יש חיות מחמד</SelectItem>
                        <SelectItem value="no">אין חיות מחמד</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id="edit-flexible"
                      checked={!!formData.flexible_move_date}
                      onCheckedChange={(checked) => setFormData({ ...formData, flexible_move_date: !!checked })}
                    />
                    <Label htmlFor="edit-flexible" className="cursor-pointer">גמישות בתאריך כניסה</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">דרישות מהנכס:</Label>
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
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}

          {/* Purchase-specific fields */}
          {isSale && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  פרטי רכישה
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>מטרת הרכישה</Label>
                    <Select value={formData.purchase_purpose || ''} onValueChange={(value) => setFormData({ ...formData, purchase_purpose: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר מטרה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residence">
                          <span className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            מגורים
                          </span>
                        </SelectItem>
                        <SelectItem value="investment">
                          <span className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            השקעה
                          </span>
                        </SelectItem>
                        <SelectItem value="for_child">
                          <span className="flex items-center gap-2">
                            <Baby className="h-4 w-4" />
                            לילד/ה
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>דחיפות</Label>
                    <Select value={formData.urgency_level || ''} onValueChange={(value) => setFormData({ ...formData, urgency_level: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר דחיפות" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">נמוכה</SelectItem>
                        <SelectItem value="medium">בינונית</SelectItem>
                        <SelectItem value="high">גבוהה</SelectItem>
                        <SelectItem value="immediate">מיידי</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>הון עצמי (₪)</Label>
                    <Input
                      type="number"
                      value={formData.cash_available || ''}
                      onChange={(e) => setFormData({ ...formData, cash_available: parseInt(e.target.value) || null })}
                      placeholder="500,000"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1">
                      <Wrench className="h-4 w-4" />
                      תקציב שיפוץ (₪)
                    </Label>
                    <Input
                      type="number"
                      value={formData.renovation_budget || ''}
                      onChange={(e) => setFormData({ ...formData, renovation_budget: parseInt(e.target.value) || null })}
                      placeholder="100,000"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-property-to-sell"
                    checked={!!formData.property_to_sell}
                    onCheckedChange={(checked) => setFormData({ ...formData, property_to_sell: !!checked })}
                  />
                  <Label htmlFor="edit-property-to-sell" className="cursor-pointer">יש נכס קיים למכירה</Label>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      חדש/יד שניה
                    </Label>
                    <Select value={formData.new_or_second_hand || ''} onValueChange={(value) => setFormData({ ...formData, new_or_second_hand: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">חדש</SelectItem>
                        <SelectItem value="second_hand">יד שניה</SelectItem>
                        <SelectItem value="both">שניהם</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>העדפת קומה</Label>
                    <Select value={formData.floor_preference || ''} onValueChange={(value) => setFormData({ ...formData, floor_preference: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ground">קרקע</SelectItem>
                        <SelectItem value="low">נמוכה (1-3)</SelectItem>
                        <SelectItem value="mid">בינונית (4-7)</SelectItem>
                        <SelectItem value="high">גבוהה (8+)</SelectItem>
                        <SelectItem value="top">עליונה</SelectItem>
                        <SelectItem value="any">לא משנה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      העדפת נוף
                    </Label>
                    <Select value={formData.view_preference || ''} onValueChange={(value) => setFormData({ ...formData, view_preference: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sea">ים</SelectItem>
                        <SelectItem value="city">עיר</SelectItem>
                        <SelectItem value="park">פארק/ירוק</SelectItem>
                        <SelectItem value="any">לא משנה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>פרטי עורך דין</Label>
                  <Input
                    value={formData.lawyer_details || ''}
                    onChange={(e) => setFormData({ ...formData, lawyer_details: e.target.value })}
                    placeholder="שם ומספר טלפון"
                  />
                </div>
              </div>
            </>
          )}

          <Separator />

          <div>
            <Label>הערות</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Property Matches Section */}
          <Separator />
          <CustomerPropertyMatches customer={customer} maxResults={5} />

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
