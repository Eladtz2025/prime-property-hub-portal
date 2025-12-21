import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, Save, Award, CreditCard, MapPin } from 'lucide-react';

export const UserSettings: React.FC = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    email: user?.email || '',
    broker_license_number: profile?.broker_license_number || '',
    id_number: profile?.id_number || '',
    address: profile?.address || '',
  });

  const handleSave = async () => {
    if (!user?.id) return;

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
        })
        .eq('id', user.id);

      if (error) throw error;

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">הגדרות אישיות</h1>
        <p className="text-muted-foreground">
          נהל את הפרטים האישיים שלך
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            פרטים אישיים
          </CardTitle>
          <CardDescription>
            עדכן את הפרטים האישיים שלך כאן
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              לא ניתן לשנות את כתובת האימייל
            </p>
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
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="05X-XXXXXXX"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              מספר הטלפון משמש לזיהוי הנכסים שלך במערכת
            </p>
          </div>

          <div className="flex justify-end pt-4">
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

      {/* Broker Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            פרטי מתווך
          </CardTitle>
          <CardDescription>
            פרטים אלו ישמשו בטפסי הזמנת שירותי תיווך
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="broker_license_number" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              מספר רישיון תיווך
            </Label>
            <Input
              id="broker_license_number"
              value={formData.broker_license_number}
              onChange={(e) => setFormData({ ...formData, broker_license_number: e.target.value })}
              placeholder="הזן מספר רישיון תיווך"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              נדרש לפי חוק לכל מתווך פעיל
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_number" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              מספר ת.ז.
            </Label>
            <Input
              id="id_number"
              value={formData.id_number}
              onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
              placeholder="הזן מספר תעודת זהות"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              כתובת (אופציונלי)
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="הזן כתובת"
            />
          </div>

          <div className="flex justify-end pt-4">
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

      <Card>
        <CardHeader>
          <CardTitle>מידע על החשבון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">תפקיד:</span>
            <span className="font-medium">{profile?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">סטטוס:</span>
            <span className="font-medium">
              {profile?.is_approved ? 'מאושר' : 'ממתין לאישור'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};