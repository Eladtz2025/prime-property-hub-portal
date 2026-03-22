import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, Save, Award, CreditCard, MapPin, Shield, CheckCircle, Clock, AlertCircle, MessageCircle } from 'lucide-react';
import { validateField, phoneSchema, israeliIdSchema, FormErrors, FormTouched } from '@/utils/formValidation';

type FormFields = 'phone' | 'id_number';

export const UserSettings: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors<FormFields>>({});
  const [touched, setTouched] = useState<FormTouched<FormFields>>({});
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    broker_license_number: '',
    id_number: '',
    address: '',
    green_api_instance_id: '',
    green_api_token: '',
  });

  const validateFormField = (field: FormFields, value: string) => {
    let error: string | null = null;
    switch (field) {
      case 'phone':
        error = validateField(phoneSchema, value);
        break;
      case 'id_number':
        error = validateField(israeliIdSchema, value);
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
    return !error;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'phone' || field === 'id_number') {
      if (touched[field as FormFields]) {
        validateFormField(field as FormFields, value);
      }
    }
  };

  const handleFieldBlur = (field: FormFields) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateFormField(field, formData[field]);
  };

  // Update form data when profile changes
  useEffect(() => {
    if (profile || user) {
      setFormData({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        email: user?.email || '',
        broker_license_number: profile?.broker_license_number || '',
        id_number: profile?.id_number || '',
        address: profile?.address || '',
        green_api_instance_id: (profile as any)?.green_api_instance_id || '',
        green_api_token: (profile as any)?.green_api_token || '',
      });
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate fields before saving
    const phoneValid = !formData.phone || validateFormField('phone', formData.phone);
    const idValid = !formData.id_number || validateFormField('id_number', formData.id_number);
    
    if (formData.phone) setTouched(prev => ({ ...prev, phone: true }));
    if (formData.id_number) setTouched(prev => ({ ...prev, id_number: true }));

    if (!phoneValid || !idValid) {
      toast({
        title: "שגיאה",
        description: "נא לתקן את השדות המסומנים",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          broker_license_number: formData.broker_license_number,
          id_number: formData.id_number,
          address: formData.address,
          green_api_instance_id: formData.green_api_instance_id || null,
          green_api_token: formData.green_api_token || null,
        } as any)
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile to get updated data
      await refreshProfile();

      toast({
        title: "הפרטים עודכנו בהצלחה",
        description: "השינויים נשמרו במערכת",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "שגיאה בעדכון הפרטים",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              פרטי משתמש ומתווך
            </CardTitle>
            <CardDescription>
              עדכן את הפרטים האישיים ופרטי התיווך שלך
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={profile?.is_approved ? "default" : "secondary"} className="gap-1">
              {profile?.is_approved ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  מאושר
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  ממתין לאישור
                </>
              )}
            </Badge>
            {profile?.role && (
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                {profile.role === 'super_admin' ? 'מנהל ראשי' : 
                 profile.role === 'admin' ? 'מנהל' : 
                 profile.role === 'manager' ? 'מנהל נכסים' : 'צופה'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">שם מלא</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="הזן שם מלא"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              כתובת אימייל
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              מספר טלפון
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              onBlur={() => handleFieldBlur('phone')}
              placeholder="05X-XXXXXXX"
              dir="ltr"
              className={touched.phone && errors.phone ? 'border-destructive' : ''}
            />
            {touched.phone && errors.phone && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.phone}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              כתובת
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="הזן כתובת"
            />
          </div>
        </div>

        {/* Broker Details Section */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" />
            פרטי תיווך (יופיעו בטפסי תיווך)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="broker_license_number" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                מספר רישיון תיווך
              </Label>
              <Input
                id="broker_license_number"
                value={formData.broker_license_number}
                onChange={(e) => handleFieldChange('broker_license_number', e.target.value)}
                placeholder="הזן מספר רישיון תיווך"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_number" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                מספר ת.ז.
              </Label>
              <Input
                id="id_number"
                value={formData.id_number}
                onChange={(e) => handleFieldChange('id_number', e.target.value)}
                onBlur={() => handleFieldBlur('id_number')}
                placeholder="הזן מספר תעודת זהות"
                dir="ltr"
                maxLength={9}
                className={touched.id_number && errors.id_number ? 'border-destructive' : ''}
              />
              {touched.id_number && errors.id_number && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.id_number}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp Connection Section */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            חיבור WhatsApp (Green API)
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            כדי לשלוח הודעות WhatsApp מהמערכת, חבר את חשבון ה-Green API שלך. 
            ניתן להירשם ב-<a href="https://green-api.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">green-api.com</a> ולהעתיק את ה-Instance ID וה-API Token.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="green_api_instance_id">Instance ID</Label>
              <Input
                id="green_api_instance_id"
                value={formData.green_api_instance_id}
                onChange={(e) => handleFieldChange('green_api_instance_id', e.target.value)}
                placeholder="לדוגמה: 1234567890"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="green_api_token">API Token</Label>
              <Input
                id="green_api_token"
                type="password"
                value={formData.green_api_token}
                onChange={(e) => handleFieldChange('green_api_token', e.target.value)}
                placeholder="הזן API Token"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'שומר...' : 'שמור שינויים'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
