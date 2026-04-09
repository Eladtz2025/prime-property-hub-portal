import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Home, CheckCircle2, Loader2, ChevronDown, ListChecks } from 'lucide-react';
import { z } from 'zod';

import { CitySelectorDropdown } from '@/components/ui/city-selector';
import { NeighborhoodSelectorDropdown } from '@/components/ui/neighborhood-selector';
import { cn } from '@/lib/utils';
import { normalizePhoneForComparison, getPhoneSuffix } from '@/utils/phoneNormalization';
import { logger } from '@/utils/logger';

// Validation schema
const clientIntakeSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  phone: z.string().regex(/^0[0-9]{8,9}$/, 'מספר טלפון לא תקין'),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  property_type: z.enum(['rental', 'sale']),
  budget_max: z.number().min(0).optional(),
  rooms_min: z.number().min(1).max(10).optional(),
  size_min: z.number().min(0).optional(),
  preferred_cities: z.string().optional(),
  preferred_neighborhoods: z.string().optional(),
  move_in_date: z.string().optional(),
  parking_required: z.boolean(),
  elevator_required: z.boolean(),
  balcony_required: z.boolean(),
  yard_required: z.boolean(),
  roof_required: z.boolean(),
  pets: z.boolean(),
  flexible_move_date: z.boolean(),
  parking_flexible: z.boolean(),
  elevator_flexible: z.boolean(),
  balcony_flexible: z.boolean(),
  yard_flexible: z.boolean(),
  roof_flexible: z.boolean(),
  
  outdoor_space_any: z.boolean(),
  message: z.string().optional(),
  tenant_type: z.string().optional(),
});

type FormData = z.infer<typeof clientIntakeSchema>;

const TENANT_TYPES = [
  { value: 'single', label: 'יחיד/ה' },
  { value: 'couple', label: 'זוג' },
  { value: 'family', label: 'משפחה' },
  { value: 'roommates', label: 'שותפים' },
];

const REQUIREMENTS_OPTIONS = [
  { value: 'parking', label: 'חניה', field: 'parking_required', flexibleField: 'parking_flexible' },
  { value: 'elevator', label: 'מעלית', field: 'elevator_required', flexibleField: 'elevator_flexible' },
  { value: 'balcony', label: 'מרפסת', field: 'balcony_required', flexibleField: 'balcony_flexible' },
  { value: 'yard', label: 'חצר/גינה', field: 'yard_required', flexibleField: 'yard_flexible' },
  { value: 'roof', label: 'גג/גישה לגג', field: 'roof_required', flexibleField: 'roof_flexible' },
] as const;

export default function ClientIntakePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  
  const agentPhone = searchParams.get('ref');
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    property_type: 'rental',
    budget_max: undefined,
    rooms_min: undefined,
    size_min: undefined,
    preferred_cities: '',
    preferred_neighborhoods: '',
    move_in_date: '',
    parking_required: false,
    elevator_required: false,
    balcony_required: false,
    yard_required: false,
    roof_required: false,
    pets: false,
    flexible_move_date: true,
    parking_flexible: true,
    elevator_flexible: true,
    balcony_flexible: true,
    yard_flexible: true,
    roof_flexible: true,
    
    outdoor_space_any: false,
    message: '',
    tenant_type: '',
  });

  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getSelectedRequirementsCount = () => {
    return REQUIREMENTS_OPTIONS.filter(opt => formData[opt.field as keyof FormData]).length;
  };

  const getSelectedRequirementsText = () => {
    const selected = REQUIREMENTS_OPTIONS.filter(opt => formData[opt.field as keyof FormData]);
    if (selected.length === 0) return 'דרישות נוספות';
    if (selected.length <= 2) return selected.map(s => s.label).join(', ');
    return `${selected.length} דרישות נבחרו`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const dataToValidate = {
        ...formData,
        preferred_cities: selectedCities.join(', '),
      };
      
      const result = clientIntakeSchema.safeParse(dataToValidate);
      
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }

      let assignedAgentId: string | null = null;
      if (agentPhone) {
        const normalizedPhone = agentPhone.replace(/[-\s]/g, '');
        const { data: agent } = await supabase
          .from('profiles')
          .select('id')
          .or(`phone.eq.${normalizedPhone},phone.eq.${agentPhone}`)
          .single();
        
        if (agent) {
          assignedAgentId = agent.id;
        }
      }

      const neighborhoodsArray = selectedNeighborhoods.length > 0 ? selectedNeighborhoods : null;
      const phoneSuffix = getPhoneSuffix(formData.phone, 9);

      const { data: existingCustomers } = await supabase
        .from('contact_leads')
        .select('id, phone, preferred_cities, preferred_neighborhoods, assigned_agent_id, status, notes, message, property_type');
      
      const existingCustomer = existingCustomers?.find(customer => {
        const customerSuffix = getPhoneSuffix(customer.phone, 9);
        return customerSuffix === phoneSuffix && phoneSuffix.length >= 9;
      }) || null;

      // Determine notes: save user comments to `notes` field (admin reads from `notes`)
      const userMessage = formData.message?.trim();
      let finalNotes: string | null;
      if (existingCustomer) {
        const existingNotes = existingCustomer.notes || '';
        if (userMessage) {
          finalNotes = existingNotes && existingNotes !== userMessage
            ? `${existingNotes}\n---\n${userMessage}`
            : userMessage;
        } else {
          finalNotes = existingNotes || null;
        }
      } else {
        finalNotes = userMessage || null;
      }
      const defaultMessage = `לקוח מחפש ${formData.property_type === 'rental' ? 'שכירות' : 'רכישה'}`;

      // Build the common data object
      const commonData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || null,
        property_type: formData.property_type,
        budget_min: null,
        budget_max: formData.budget_max || null,
        rooms_min: formData.rooms_min || null,
        rooms_max: null,
        size_min: formData.size_min || null,
        size_max: null,
        move_in_date: formData.move_in_date || null,
        flexible_move_date: formData.flexible_move_date ?? true,
        parking_required: formData.parking_required,
        elevator_required: formData.elevator_required,
        balcony_required: formData.balcony_required,
        yard_required: formData.yard_required,
        roof_required: formData.roof_required,
        outdoor_space_any: formData.outdoor_space_any,
        parking_flexible: formData.parking_flexible,
        elevator_flexible: formData.elevator_flexible,
        balcony_flexible: formData.balcony_flexible,
        yard_flexible: formData.yard_flexible,
        roof_flexible: formData.roof_flexible,
        
        pets: formData.property_type === 'rental' ? formData.pets : false,
        message: defaultMessage,
        notes: finalNotes,
        tenant_type: formData.property_type === 'rental' && formData.tenant_type ? formData.tenant_type : null,
        cash_available: null,
        new_or_second_hand: null,
      };

      // Check if existing customer has different property_type - create new record instead of overwriting
      const shouldCreateNew = existingCustomer && existingCustomer.property_type !== formData.property_type;

      if (existingCustomer && !shouldCreateNew) {
        const existingCities = existingCustomer.preferred_cities || [];
        const existingNeighborhoods = existingCustomer.preferred_neighborhoods || [];
        
        const mergedCities = [...new Set([...existingCities, ...selectedCities])];
        const mergedNeighborhoods = [...new Set([...existingNeighborhoods, ...(neighborhoodsArray || [])])];

        const { error: updateError } = await supabase
          .from('contact_leads')
          .update({
            ...commonData,
            preferred_cities: mergedCities.length > 0 ? mergedCities : null,
            preferred_neighborhoods: mergedNeighborhoods.length > 0 ? mergedNeighborhoods : null,
            source: 'merged_form',
            assigned_agent_id: existingCustomer.assigned_agent_id || assignedAgentId,
          })
          .eq('id', existingCustomer.id);

        if (updateError) throw updateError;
      } else {
        const { error } = await supabase
          .from('contact_leads')
          .insert({
            ...commonData,
            preferred_cities: selectedCities.length > 0 ? selectedCities : null,
            preferred_neighborhoods: neighborhoodsArray,
            source: 'client_form',
            status: 'new',
            priority: 'medium',
            assigned_agent_id: assignedAgentId,
          });

        if (error) throw error;
      }

      setIsSubmitted(true);
      toast.success('הפרטים נשלחו בהצלחה!');

    } catch (error) {
      logger.error('Error submitting form:', error);
      toast.error('שגיאה בשליחת הטופס, נסה שוב');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">תודה רבה!</h2>
            <p className="text-muted-foreground mb-6">
              הפרטים שלך התקבלו בהצלחה.<br />
              ניצור איתך קשר בהקדם עם נכסים מתאימים.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.close()}
              className="min-h-[44px]"
            >
              סגור חלון
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-6 px-4" dir="rtl">
      <div className="max-w-lg mx-auto">
        {/* Language Toggle */}
        <div className="flex justify-start mb-3">
          <button
            type="button"
            onClick={() => navigate('/client-intake/en')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:hover:bg-red-900/40 transition-colors"
          >
            <span>🇺🇸</span>
            <span>English</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Home className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">מחפשים דירה?</h1>
          <p className="text-muted-foreground mt-1">ספרו לנו מה אתם מחפשים ונמצא לכם</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Details */}
          <Card className="mb-4">
            <CardContent className="pt-4 space-y-3">
              <div>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="שם מלא *"
                  className={cn("min-h-[44px]", errors.name && "border-destructive")}
                />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="טלפון * (050-1234567)"
                    className={cn("min-h-[44px]", errors.phone && "border-destructive")}
                  />
                  {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
                </div>

                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="אימייל (אופציונלי)"
                  className={cn("min-h-[44px]", errors.email && "border-destructive")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Preferences */}
          <Card className="mb-4">
            <CardContent className="pt-4 space-y-4">
              {/* Transaction Type */}
              <RadioGroup
                value={formData.property_type}
                onValueChange={(value) => handleInputChange('property_type', value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="rental" id="rental" />
                  <Label htmlFor="rental" className="cursor-pointer">שכירות</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="sale" id="sale" />
                  <Label htmlFor="sale" className="cursor-pointer">רכישה</Label>
                </div>
              </RadioGroup>

              {/* Budget + Move-in Date on same row */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  value={formData.budget_max || ''}
                  onChange={(e) => handleInputChange('budget_max', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder={formData.property_type === 'rental' ? 'תקציב מקסימום ₪/חודש' : 'תקציב מקסימום ₪'}
                  className="min-h-[44px]"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={formData.move_in_date}
                    onChange={(e) => handleInputChange('move_in_date', e.target.value)}
                    placeholder="תאריך כניסה"
                    className="min-h-[44px] flex-1"
                  />
                  <label className="flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
                    <Checkbox
                      checked={formData.flexible_move_date}
                      onCheckedChange={(checked) => handleInputChange('flexible_move_date', !!checked)}
                    />
                    <span className="text-xs">גמיש</span>
                  </label>
                </div>
              </div>

              {/* Size min + Rooms min on same row */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  min={0}
                  value={formData.size_min || ''}
                  onChange={(e) => handleInputChange('size_min', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="גודל מינימום (מ״ר)"
                  className="min-h-[44px]"
                />
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.rooms_min || ''}
                  onChange={(e) => handleInputChange('rooms_min', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="חדרים מינימום"
                  className="min-h-[44px]"
                />
              </div>

              {/* City + Neighborhood */}
              <div className="grid grid-cols-2 gap-3">
                <CitySelectorDropdown
                  selectedCities={selectedCities}
                  onChange={setSelectedCities}
                />
                <NeighborhoodSelectorDropdown
                  selectedCities={selectedCities}
                  selectedNeighborhoods={selectedNeighborhoods}
                  onChange={setSelectedNeighborhoods}
                />
              </div>

              {/* Requirements + Tenant Type + Pets (rental) / Just Requirements (sale) */}
              {formData.property_type === 'rental' ? (
                <div className="grid grid-cols-3 gap-3">
                  {/* Requirements dropdown */}
                  <Popover open={requirementsOpen} onOpenChange={setRequirementsOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        type="button"
                        variant="outline" 
                        className="justify-between h-11 text-sm font-normal"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <ListChecks className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{getSelectedRequirementsText()}</span>
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2 bg-background border shadow-lg z-50" align="start">
                      <div className="space-y-1">
                        {REQUIREMENTS_OPTIONS.map((opt) => (
                          <div
                            key={opt.value}
                            className={cn(
                              "flex items-center justify-between p-2 rounded transition-colors",
                              formData[opt.field as keyof FormData]
                                ? "bg-primary/10"
                                : "hover:bg-muted"
                            )}
                          >
                            <div 
                              className="flex items-center gap-2 flex-1 cursor-pointer"
                              onClick={() => handleInputChange(opt.field as keyof FormData, !formData[opt.field as keyof FormData])}
                            >
                              <Checkbox
                                checked={!!formData[opt.field as keyof FormData]}
                                onCheckedChange={(checked) => handleInputChange(opt.field as keyof FormData, !!checked)}
                              />
                              <span className="text-sm">{opt.label}</span>
                            </div>
                            <label 
                              className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={!!formData[opt.flexibleField as keyof FormData]}
                                onCheckedChange={(checked) => handleInputChange(opt.flexibleField as keyof FormData, !!checked)}
                              />
                              <span className="text-xs">גמיש</span>
                            </label>
                          </div>
                        ))}
                        
                        <div className="border-t pt-2 mt-2">
                          <label 
                            className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={formData.outdoor_space_any}
                              onCheckedChange={(checked) => handleInputChange('outdoor_space_any', !!checked)}
                            />
                            <span className="text-sm text-muted-foreground">מספיק אחד מהשטחים (מרפסת/חצר/גג)</span>
                          </label>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Tenant type */}
                  <Select
                    value={formData.tenant_type || ''}
                    onValueChange={(value) => handleInputChange('tenant_type', value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="סוג שוכר" />
                    </SelectTrigger>
                    <SelectContent>
                      {TENANT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Pets standalone */}
                  <div className="flex items-center gap-2 h-11 border rounded-md px-3">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <Checkbox
                        checked={formData.pets}
                        onCheckedChange={(checked) => handleInputChange('pets', !!checked)}
                      />
                      <span className="text-sm">חיית מחמד</span>
                    </label>
                  </div>
                </div>
              ) : (
                /* Sale - just requirements */
                <Popover open={requirementsOpen} onOpenChange={setRequirementsOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button"
                      variant="outline" 
                      className="justify-between h-11 text-sm font-normal w-full"
                    >
                      <span className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-muted-foreground" />
                        {getSelectedRequirementsText()}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-2 bg-background border shadow-lg z-50" align="start">
                    <div className="space-y-1">
                      {REQUIREMENTS_OPTIONS.map((opt) => (
                        <div
                          key={opt.value}
                          className={cn(
                            "flex items-center justify-between p-2 rounded transition-colors",
                            formData[opt.field as keyof FormData]
                              ? "bg-primary/10"
                              : "hover:bg-muted"
                          )}
                        >
                          <div 
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                            onClick={() => handleInputChange(opt.field as keyof FormData, !formData[opt.field as keyof FormData])}
                          >
                            <Checkbox
                              checked={!!formData[opt.field as keyof FormData]}
                              onCheckedChange={(checked) => handleInputChange(opt.field as keyof FormData, !!checked)}
                            />
                            <span className="text-sm">{opt.label}</span>
                          </div>
                          <label 
                            className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={!!formData[opt.flexibleField as keyof FormData]}
                              onCheckedChange={(checked) => handleInputChange(opt.flexibleField as keyof FormData, !!checked)}
                            />
                            <span className="text-xs">גמיש</span>
                          </label>
                        </div>
                      ))}
                      
                      <div className="border-t pt-2 mt-2">
                        <label 
                          className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={formData.outdoor_space_any}
                            onCheckedChange={(checked) => handleInputChange('outdoor_space_any', !!checked)}
                          />
                          <span className="text-sm text-muted-foreground">מספיק אחד מהשטחים (מרפסת/חצר/גג)</span>
                        </label>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <Textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="הערות נוספות (אופציונלי)"
                rows={2}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] text-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                שולח...
              </>
            ) : (
              'שליחת פרטים'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            הפרטים שלכם נשמרים בצורה מאובטחת ומשמשים אותנו רק למציאת דירה עבורכם
          </p>
        </form>
      </div>
    </div>
  );
}
