import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Home, Phone, Mail, Calendar, CheckCircle2, Loader2, Ruler } from 'lucide-react';
import { z } from 'zod';

// Validation schema
const clientIntakeSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  phone: z.string().regex(/^0[0-9]{8,9}$/, 'מספר טלפון לא תקין'),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  property_type: z.enum(['rental', 'sale']),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  rooms_min: z.number().min(1).max(10).optional(),
  rooms_max: z.number().min(1).max(10).optional(),
  size_min: z.number().min(0).optional(),
  size_max: z.number().min(0).optional(),
  preferred_cities: z.string().optional(),
  preferred_neighborhoods: z.string().optional(),
  move_in_date: z.string().optional(),
  parking_required: z.boolean(),
  elevator_required: z.boolean(),
  balcony_required: z.boolean(),
  pets: z.boolean(),
  message: z.string().optional(),
  // Rental-specific
  tenant_type: z.string().optional(),
  // Sale-specific
  cash_available: z.number().min(0).optional(),
  new_or_second_hand: z.string().optional(),
});

type FormData = z.infer<typeof clientIntakeSchema>;

const CITIES = [
  'תל אביב',
  'רמת גן',
  'גבעתיים',
  'בני ברק',
  'חולון',
  'בת ים',
  'הרצליה',
  'רעננה',
  'כפר סבא',
  'פתח תקווה',
  'ראשון לציון',
  'נתניה',
];

const TENANT_TYPES = [
  { value: 'single', label: 'יחיד/ה' },
  { value: 'couple', label: 'זוג' },
  { value: 'family', label: 'משפחה' },
  { value: 'roommates', label: 'שותפים' },
];

const NEW_OR_SECOND_HAND_OPTIONS = [
  { value: 'new', label: 'חדש מקבלן' },
  { value: 'second_hand', label: 'יד שנייה' },
  { value: 'both', label: 'שניהם' },
];

export default function ClientIntakePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get agent reference from URL
  const agentPhone = searchParams.get('ref');
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    property_type: 'rental',
    budget_min: undefined,
    budget_max: undefined,
    rooms_min: undefined,
    rooms_max: undefined,
    size_min: undefined,
    size_max: undefined,
    preferred_cities: '',
    preferred_neighborhoods: '',
    move_in_date: '',
    parking_required: false,
    elevator_required: false,
    balcony_required: false,
    pets: false,
    message: '',
    tenant_type: '',
    cash_available: undefined,
    new_or_second_hand: '',
  });

  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleCity = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate
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

      // Find agent by phone if ref parameter exists
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

      // Prepare neighborhoods as array
      const neighborhoodsArray = formData.preferred_neighborhoods?.trim() 
        ? formData.preferred_neighborhoods.split(',').map(n => n.trim()).filter(Boolean)
        : null;

      // Prepare data for database - using inline object for proper typing
      const { error } = await supabase
        .from('contact_leads')
        .insert({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email?.trim() || null,
          property_type: formData.property_type,
          budget_min: formData.budget_min || null,
          budget_max: formData.budget_max || null,
          rooms_min: formData.rooms_min || null,
          rooms_max: formData.rooms_max || null,
          size_min: formData.size_min || null,
          size_max: formData.size_max || null,
          preferred_cities: selectedCities.length > 0 ? selectedCities : null,
          preferred_neighborhoods: neighborhoodsArray,
          move_in_date: formData.move_in_date || null,
          parking_required: formData.parking_required,
          elevator_required: formData.elevator_required,
          balcony_required: formData.balcony_required,
          pets: formData.pets,
          message: formData.message?.trim() || `לקוח מחפש ${formData.property_type === 'rental' ? 'שכירות' : 'רכישה'}`,
          source: 'client_form',
          status: 'new',
          priority: 'medium',
          // Rental-specific fields
          tenant_type: formData.property_type === 'rental' && formData.tenant_type ? formData.tenant_type : null,
          // Sale-specific fields
          cash_available: formData.property_type === 'sale' && formData.cash_available ? formData.cash_available : null,
          new_or_second_hand: formData.property_type === 'sale' && formData.new_or_second_hand ? formData.new_or_second_hand : null,
          // Agent assignment
          assigned_agent_id: assignedAgentId,
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('הפרטים נשלחו בהצלחה!');

    } catch (error) {
      console.error('Error submitting form:', error);
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
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">פרטים אישיים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">שם מלא *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="ישראל ישראלי"
                  className={`mt-1 min-h-[44px] ${errors.name ? 'border-destructive' : ''}`}
                />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  טלפון *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="050-1234567"
                  className={`mt-1 min-h-[44px] ${errors.phone ? 'border-destructive' : ''}`}
                />
                {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  אימייל (אופציונלי)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className={`mt-1 min-h-[44px] ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Property Preferences */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">מה מחפשים?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Transaction Type */}
              <div>
                <Label className="mb-2 block">סוג עסקה *</Label>
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
              </div>

              {/* Budget */}
              <div>
                <Label className="mb-2 block">
                  תקציב {formData.property_type === 'rental' ? '(₪ לחודש)' : '(₪)'}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      type="number"
                      value={formData.budget_min || ''}
                      onChange={(e) => handleInputChange('budget_min', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="מינימום"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={formData.budget_max || ''}
                      onChange={(e) => handleInputChange('budget_max', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="מקסימום"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Rooms */}
              <div>
                <Label className="mb-2 block">מספר חדרים</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.rooms_min || ''}
                      onChange={(e) => handleInputChange('rooms_min', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="מינימום"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.rooms_max || ''}
                      onChange={(e) => handleInputChange('rooms_max', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="מקסימום"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div>
                <Label className="mb-2 block flex items-center gap-1">
                  <Ruler className="w-4 h-4" />
                  גודל דירה (מ״ר)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      type="number"
                      min={0}
                      value={formData.size_min || ''}
                      onChange={(e) => handleInputChange('size_min', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="מינימום"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min={0}
                      value={formData.size_max || ''}
                      onChange={(e) => handleInputChange('size_max', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="מקסימום"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Cities */}
              <div>
                <Label className="mb-2 block">ערים מועדפות</Label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => toggleCity(city)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedCities.includes(city)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Neighborhoods */}
              {selectedCities.length > 0 && (
                <div>
                  <Label htmlFor="neighborhoods" className="mb-2 block">
                    שכונות מועדפות (אופציונלי)
                  </Label>
                  <Input
                    id="neighborhoods"
                    value={formData.preferred_neighborhoods || ''}
                    onChange={(e) => handleInputChange('preferred_neighborhoods', e.target.value)}
                    placeholder="הפרידו בפסיקים: צפון תל אביב, רמת אביב..."
                    className="min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">הזינו שכונות מועדפות, מופרדות בפסיקים</p>
                </div>
              )}

              {/* Move-in Date */}
              <div>
                <Label htmlFor="move_in_date" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  תאריך כניסה משוער
                </Label>
                <Input
                  id="move_in_date"
                  type="date"
                  value={formData.move_in_date}
                  onChange={(e) => handleInputChange('move_in_date', e.target.value)}
                  className="mt-1 min-h-[44px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Rental-specific fields */}
          {formData.property_type === 'rental' && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">פרטי שוכר</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="mb-2 block">סוג שוכר</Label>
                  <Select
                    value={formData.tenant_type || ''}
                    onValueChange={(value) => handleInputChange('tenant_type', value)}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="בחרו סוג שוכר" />
                    </SelectTrigger>
                    <SelectContent>
                      {TENANT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sale-specific fields */}
          {formData.property_type === 'sale' && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">פרטי רכישה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cash_available" className="mb-2 block">הון עצמי (₪)</Label>
                  <Input
                    id="cash_available"
                    type="number"
                    min={0}
                    value={formData.cash_available || ''}
                    onChange={(e) => handleInputChange('cash_available', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="סכום ההון העצמי הזמין"
                    className="min-h-[44px]"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">סוג נכס מועדף</Label>
                  <RadioGroup
                    value={formData.new_or_second_hand || ''}
                    onValueChange={(value) => handleInputChange('new_or_second_hand', value)}
                    className="flex flex-wrap gap-3"
                  >
                    {NEW_OR_SECOND_HAND_OPTIONS.map(option => (
                      <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">דרישות נוספות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.parking_required}
                    onCheckedChange={(checked) => handleInputChange('parking_required', !!checked)}
                  />
                  <span>חניה</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.elevator_required}
                    onCheckedChange={(checked) => handleInputChange('elevator_required', !!checked)}
                  />
                  <span>מעלית</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.balcony_required}
                    onCheckedChange={(checked) => handleInputChange('balcony_required', !!checked)}
                  />
                  <span>מרפסת</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.pets}
                    onCheckedChange={(checked) => handleInputChange('pets', !!checked)}
                  />
                  <span>חיית מחמד</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">הערות נוספות</CardTitle>
              <CardDescription>יש משהו ספציפי שאתם מחפשים?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="למשל: מחפשים דירה שקטה, קרובה לגן ילדים..."
                rows={3}
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
