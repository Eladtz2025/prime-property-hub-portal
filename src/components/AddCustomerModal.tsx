import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dog, Car, Building2, Home, Briefcase, Baby, TrendingUp, Wrench, Eye, Layers, AlertCircle } from "lucide-react";
import { validateField, requiredPhoneSchema, emailSchema, requiredNameSchema, FormErrors, FormTouched } from '@/utils/formValidation';
import { CitySelectorCompact } from "@/components/ui/city-selector";
import { NeighborhoodSelectorCompact } from "@/components/ui/neighborhood-selector";
import { COUNTRY_CODES, combinePhoneNumber } from '@/utils/phoneCountryCodes';

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

type FormFields = 'name' | 'phone' | 'email';

export const AddCustomerModal = ({ open, onClose, onSave }: AddCustomerModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors<FormFields>>({});
  const [touched, setTouched] = useState<FormTouched<FormFields>>({});
  const [phoneCountry, setPhoneCountry] = useState('IL');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    status: 'new',
    priority: 'medium',
    source: 'manual',
    property_type: 'rental',
    budget_min: null as number | null,
    budget_max: null as number | null,
    rooms_min: null as number | null,
    rooms_max: null as number | null,
    size_min: null as number | null,
    size_max: null as number | null,
    preferred_cities: [] as string[],
    preferred_neighborhoods: [] as string[],
    move_in_date: '',
    notes: '',
    // Rental-specific
    pets: null as boolean | null,
    tenant_type: '' as string,
    flexible_move_date: false,
    parking_required: false,
    balcony_required: false,
    elevator_required: false,
    yard_required: false,
    // Flexibility flags
    parking_flexible: true,
    balcony_flexible: true,
    elevator_flexible: true,
    yard_flexible: true,
    // Purchase-specific
    purchase_purpose: '' as string,
    cash_available: null as number | null,
    property_to_sell: false,
    lawyer_details: '',
    urgency_level: '' as string,
    renovation_budget: null as number | null,
    new_or_second_hand: '' as string,
    floor_preference: '' as string,
    view_preference: '' as string,
  });

  const validateFormField = (field: FormFields, value: string) => {
    let error: string | null = null;
    switch (field) {
      case 'name':
        error = validateField(requiredNameSchema, value);
        break;
      case 'phone':
        error = validateField(requiredPhoneSchema, value);
        break;
      case 'email':
        error = validateField(emailSchema, value);
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
    return !error;
  };

  const handleFieldChange = (field: FormFields, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateFormField(field, value);
    }
  };

  const handleFieldBlur = (field: FormFields) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateFormField(field, formData[field]);
  };

  const handleSave = async () => {
    // Validate all required fields
    const nameValid = validateFormField('name', formData.name);
    const phoneValid = validateFormField('phone', formData.phone);
    const emailValid = validateFormField('email', formData.email);
    
    setTouched({ name: true, phone: true, email: true });

    if (!nameValid || !phoneValid) {
      toast({
        title: 'שגיאה',
        description: 'נא לתקן את השדות המסומנים',
        variant: 'destructive',
      });
      return;
    }

    if (formData.email && !emailValid) {
      toast({
        title: 'שגיאה',
        description: 'כתובת אימייל לא תקינה',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      const fullPhone = combinePhoneNumber(phoneCountry, formData.phone);
      
      const { error } = await supabase
        .from('contact_leads')
        .insert({
          name: formData.name,
          email: formData.email || null,
          phone: fullPhone,
          message: formData.message || 'לקוח נוסף ידנית',
          status: formData.status,
          priority: formData.priority,
          source: formData.source,
          property_type: formData.property_type,
          budget_min: formData.budget_min,
          budget_max: formData.budget_max,
          rooms_min: formData.rooms_min,
          rooms_max: formData.rooms_max,
          size_min: formData.size_min,
          size_max: formData.size_max,
          preferred_cities: formData.preferred_cities.length > 0 ? formData.preferred_cities : null,
          preferred_neighborhoods: formData.preferred_neighborhoods.length > 0 ? formData.preferred_neighborhoods : null,
          move_in_date: formData.move_in_date || null,
          notes: formData.notes || null,
          // Rental-specific
          pets: formData.property_type === 'rental' || formData.property_type === 'both' ? formData.pets : null,
          tenant_type: formData.property_type === 'rental' || formData.property_type === 'both' ? formData.tenant_type || null : null,
          flexible_move_date: formData.property_type === 'rental' || formData.property_type === 'both' ? formData.flexible_move_date : null,
          parking_required: formData.property_type === 'rental' || formData.property_type === 'both' ? formData.parking_required : null,
          balcony_required: formData.property_type === 'rental' || formData.property_type === 'both' ? formData.balcony_required : null,
          elevator_required: formData.property_type === 'rental' || formData.property_type === 'both' ? formData.elevator_required : null,
          yard_required: formData.property_type === 'rental' || formData.property_type === 'both' ? formData.yard_required : null,
          parking_flexible: formData.property_type === 'rental' || formData.property_type === 'both' ? formData.parking_flexible : null,
          balcony_flexible: formData.property_type === 'rental' || formData.property_type === 'both' ? formData.balcony_flexible : null,
          elevator_flexible: formData.property_type === 'rental' || formData.property_type === 'both' ? formData.elevator_flexible : null,
          yard_flexible: formData.property_type === 'rental' || formData.property_type === 'both' ? formData.yard_flexible : null,
          // Purchase-specific
          purchase_purpose: formData.property_type === 'sale' || formData.property_type === 'both' ? formData.purchase_purpose || null : null,
          cash_available: formData.property_type === 'sale' || formData.property_type === 'both' ? formData.cash_available : null,
          property_to_sell: formData.property_type === 'sale' || formData.property_type === 'both' ? formData.property_to_sell : null,
          lawyer_details: formData.property_type === 'sale' || formData.property_type === 'both' ? formData.lawyer_details || null : null,
          urgency_level: formData.property_type === 'sale' || formData.property_type === 'both' ? formData.urgency_level || null : null,
          renovation_budget: formData.property_type === 'sale' || formData.property_type === 'both' ? formData.renovation_budget : null,
          new_or_second_hand: formData.property_type === 'sale' || formData.property_type === 'both' ? formData.new_or_second_hand || null : null,
          floor_preference: formData.property_type === 'sale' || formData.property_type === 'both' ? formData.floor_preference || null : null,
          view_preference: formData.property_type === 'sale' || formData.property_type === 'both' ? formData.view_preference || null : null,
          assigned_agent_id: user?.id || null,
          created_by: user?.id || null,
        });

      if (error) throw error;

      toast({
        title: 'נוסף בהצלחה',
        description: 'לקוח חדש נוסף למערכת',
      });
      
      // Reset form
      setPhoneCountry('IL');
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        status: 'new',
        priority: 'medium',
        source: 'manual',
        property_type: 'rental',
        budget_min: null,
        budget_max: null,
        rooms_min: null,
        rooms_max: null,
        size_min: null,
        size_max: null,
        preferred_cities: [],
        preferred_neighborhoods: [],
        move_in_date: '',
        notes: '',
        pets: null,
        tenant_type: '',
        flexible_move_date: false,
        parking_required: false,
        balcony_required: false,
        elevator_required: false,
        yard_required: false,
        parking_flexible: true,
        balcony_flexible: true,
        elevator_flexible: true,
        yard_flexible: true,
        purchase_purpose: '',
        cash_available: null,
        property_to_sell: false,
        lawyer_details: '',
        urgency_level: '',
        renovation_budget: null,
        new_or_second_hand: '',
        floor_preference: '',
        view_preference: '',
      });
      
      onSave();
      onClose();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף לקוח חדש',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isRental = formData.property_type === 'rental' || formData.property_type === 'both';
  const isSale = formData.property_type === 'sale' || formData.property_type === 'both';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הוספת לקוח חדש</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>שם מלא *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                onBlur={() => handleFieldBlur('name')}
                placeholder="שם מלא"
                className={touched.name && errors.name ? 'border-destructive' : ''}
              />
              {touched.name && errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <Label>טלפון *</Label>
              <div className="flex gap-2">
                <Select value={phoneCountry} onValueChange={setPhoneCountry}>
                  <SelectTrigger className="w-[140px]">
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
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  onBlur={() => handleFieldBlur('phone')}
                  placeholder={phoneCountry === 'IL' ? '050-1234567' : '555-123-4567'}
                  className={`flex-1 ${touched.phone && errors.phone ? 'border-destructive' : ''}`}
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>אימייל</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                placeholder="email@example.com"
                className={touched.email && errors.email ? 'border-destructive' : ''}
              />
              {touched.email && errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <Label>מקור</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">ידני</SelectItem>
                  <SelectItem value="website">אתר</SelectItem>
                  <SelectItem value="phone">טלפון</SelectItem>
                  <SelectItem value="facebook">פייסבוק</SelectItem>
                  <SelectItem value="referral">המלצה</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">חדש</SelectItem>
                  <SelectItem value="contacted">יצרנו קשר</SelectItem>
                  <SelectItem value="qualified">מתאים</SelectItem>
                  <SelectItem value="viewing_scheduled">קבוע צפייה</SelectItem>
                  <SelectItem value="offer_made">הצעה נשלחה</SelectItem>
                  <SelectItem value="closed_won">סגור - זכייה</SelectItem>
                  <SelectItem value="closed_lost">סגור - אובדן</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>עדיפות</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">נמוכה</SelectItem>
                  <SelectItem value="medium">בינונית</SelectItem>
                  <SelectItem value="high">גבוהה</SelectItem>
                  <SelectItem value="urgent">דחוף</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Property Type - This determines which fields to show */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>סוג עסקה</Label>
              <Select value={formData.property_type} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
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
            <div>
              <Label>תאריך כניסה/רכישה משוער</Label>
              <Input
                type="date"
                value={formData.move_in_date}
                onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
              />
            </div>
          </div>

          {/* Common Property Preferences */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>תקציב מינימום (₪)</Label>
              <Input
                type="number"
                value={formData.budget_min || ''}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value ? Number(e.target.value) : null })}
                placeholder={isSale ? "1,000,000" : "3000"}
              />
            </div>
            <div>
              <Label>תקציב מקסימום (₪)</Label>
              <Input
                type="number"
                value={formData.budget_max || ''}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value ? Number(e.target.value) : null })}
                placeholder={isSale ? "3,000,000" : "8000"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>מינימום חדרים</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.rooms_min || ''}
                onChange={(e) => setFormData({ ...formData, rooms_min: e.target.value ? Number(e.target.value) : null })}
                placeholder="2"
              />
            </div>
            <div>
              <Label>מקסימום חדרים</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.rooms_max || ''}
                onChange={(e) => setFormData({ ...formData, rooms_max: e.target.value ? Number(e.target.value) : null })}
                placeholder="4"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>גודל מינימום (מ"ר)</Label>
              <Input
                type="number"
                value={formData.size_min || ''}
                onChange={(e) => setFormData({ ...formData, size_min: e.target.value ? Number(e.target.value) : null })}
                placeholder="60"
              />
            </div>
            <div>
              <Label>גודל מקסימום (מ"ר)</Label>
              <Input
                type="number"
                value={formData.size_max || ''}
                onChange={(e) => setFormData({ ...formData, size_max: e.target.value ? Number(e.target.value) : null })}
                placeholder="120"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">ערים מועדפות</Label>
            <CitySelectorCompact
              selectedCities={formData.preferred_cities}
              onChange={(cities) => setFormData({ ...formData, preferred_cities: cities })}
            />
          </div>

          {formData.preferred_cities.length > 0 && (
            <div>
              <Label className="mb-2 block">שכונות מועדפות</Label>
              <NeighborhoodSelectorCompact
                selectedCities={formData.preferred_cities}
                selectedNeighborhoods={formData.preferred_neighborhoods}
                onChange={(neighborhoods) => setFormData({ ...formData, preferred_neighborhoods: neighborhoods })}
              />
            </div>
          )}

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
                  <Select value={formData.tenant_type} onValueChange={(value) => setFormData({ ...formData, tenant_type: value })}>
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
                      id="flexible_move_date"
                      checked={formData.flexible_move_date}
                      onCheckedChange={(checked) => setFormData({ ...formData, flexible_move_date: !!checked })}
                    />
                    <Label htmlFor="flexible_move_date" className="cursor-pointer">גמישות בתאריך כניסה</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">דרישות מהנכס:</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Parking */}
                    <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                      <Checkbox
                        id="parking_required"
                        checked={formData.parking_required}
                        onCheckedChange={(checked) => setFormData({ ...formData, parking_required: !!checked })}
                      />
                      <Label htmlFor="parking_required" className="flex items-center gap-1 cursor-pointer flex-1">
                        <Car className="h-4 w-4" />
                        חניה
                      </Label>
                      {formData.parking_required && (
                        <div className="flex items-center gap-1 border-r pr-2">
                          <Checkbox
                            id="parking_flexible"
                            checked={formData.parking_flexible !== false}
                            onCheckedChange={(checked) => setFormData({ ...formData, parking_flexible: !!checked })}
                          />
                          <Label htmlFor="parking_flexible" className="text-xs text-muted-foreground cursor-pointer">גמיש</Label>
                        </div>
                      )}
                    </div>
                    {/* Balcony */}
                    <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                      <Checkbox
                        id="balcony_required"
                        checked={formData.balcony_required}
                        onCheckedChange={(checked) => setFormData({ ...formData, balcony_required: !!checked })}
                      />
                      <Label htmlFor="balcony_required" className="cursor-pointer flex-1">מרפסת</Label>
                      {formData.balcony_required && (
                        <div className="flex items-center gap-1 border-r pr-2">
                          <Checkbox
                            id="balcony_flexible"
                            checked={formData.balcony_flexible !== false}
                            onCheckedChange={(checked) => setFormData({ ...formData, balcony_flexible: !!checked })}
                          />
                          <Label htmlFor="balcony_flexible" className="text-xs text-muted-foreground cursor-pointer">גמיש</Label>
                        </div>
                      )}
                    </div>
                    {/* Elevator */}
                    <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                      <Checkbox
                        id="elevator_required"
                        checked={formData.elevator_required}
                        onCheckedChange={(checked) => setFormData({ ...formData, elevator_required: !!checked })}
                      />
                      <Label htmlFor="elevator_required" className="flex items-center gap-1 cursor-pointer flex-1">
                        <Building2 className="h-4 w-4" />
                        מעלית
                      </Label>
                      {formData.elevator_required && (
                        <div className="flex items-center gap-1 border-r pr-2">
                          <Checkbox
                            id="elevator_flexible"
                            checked={formData.elevator_flexible !== false}
                            onCheckedChange={(checked) => setFormData({ ...formData, elevator_flexible: !!checked })}
                          />
                          <Label htmlFor="elevator_flexible" className="text-xs text-muted-foreground cursor-pointer">גמיש</Label>
                        </div>
                      )}
                    </div>
                    {/* Yard */}
                    <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                      <Checkbox
                        id="yard_required"
                        checked={formData.yard_required}
                        onCheckedChange={(checked) => setFormData({ ...formData, yard_required: !!checked })}
                      />
                      <Label htmlFor="yard_required" className="cursor-pointer flex-1">חצר</Label>
                      {formData.yard_required && (
                        <div className="flex items-center gap-1 border-r pr-2">
                          <Checkbox
                            id="yard_flexible"
                            checked={formData.yard_flexible !== false}
                            onCheckedChange={(checked) => setFormData({ ...formData, yard_flexible: !!checked })}
                          />
                          <Label htmlFor="yard_flexible" className="text-xs text-muted-foreground cursor-pointer">גמיש</Label>
                        </div>
                      )}
                    </div>
                  </div>
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
                    <Select value={formData.purchase_purpose} onValueChange={(value) => setFormData({ ...formData, purchase_purpose: value })}>
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
                    <Select value={formData.urgency_level} onValueChange={(value) => setFormData({ ...formData, urgency_level: value })}>
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
                      onChange={(e) => setFormData({ ...formData, cash_available: e.target.value ? Number(e.target.value) : null })}
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
                      onChange={(e) => setFormData({ ...formData, renovation_budget: e.target.value ? Number(e.target.value) : null })}
                      placeholder="100,000"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="property_to_sell"
                    checked={formData.property_to_sell}
                    onCheckedChange={(checked) => setFormData({ ...formData, property_to_sell: !!checked })}
                  />
                  <Label htmlFor="property_to_sell" className="cursor-pointer">יש נכס קיים למכירה</Label>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      חדש/יד שניה
                    </Label>
                    <Select value={formData.new_or_second_hand} onValueChange={(value) => setFormData({ ...formData, new_or_second_hand: value })}>
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
                    <Select value={formData.floor_preference} onValueChange={(value) => setFormData({ ...formData, floor_preference: value })}>
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
                    <Select value={formData.view_preference} onValueChange={(value) => setFormData({ ...formData, view_preference: value })}>
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
                    value={formData.lawyer_details}
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
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="הערות נוספות..."
            />
          </div>

          <div className="flex flex-row-reverse gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'שומר...' : 'שמור'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
