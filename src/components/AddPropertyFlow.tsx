import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Upload, Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface AddPropertyFlowProps {
  onPropertyAdded: () => void;
}

export const AddPropertyFlow: React.FC<AddPropertyFlowProps> = ({ onPropertyAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    rooms: '',
    floor: '',
    property_size: '',
    notes: '',
    monthly_rent: '',
    deposit_amount: '',
    owner_phone: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddProperty = async () => {
    if (!user || !formData.address || !formData.city) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          address: formData.address,
          city: formData.city,
          rooms: formData.rooms ? parseInt(formData.rooms) : null,
          floor: formData.floor ? parseInt(formData.floor) : null,
          property_size: formData.property_size ? parseFloat(formData.property_size) : null,
          notes: formData.notes || null,
          status: 'owned'
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Create property ownership
      const { error: ownershipError } = await supabase
        .from('property_owners')
        .insert({
          property_id: property.id,
          owner_id: user.id,
          ownership_percentage: 100
        });

      if (ownershipError) throw ownershipError;

      // Update user profile with phone if provided
      if (formData.owner_phone) {
        await supabase
          .from('profiles')
          .update({ phone: formData.owner_phone })
          .eq('id', user.id);
      }

      // Add tenant if rent info provided
      if (formData.monthly_rent) {
        await supabase
          .from('tenants')
          .insert({
            property_id: property.id,
            name: 'דייר חדש',
            monthly_rent: parseFloat(formData.monthly_rent),
            deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
            is_active: true
          });
      }

      toast({
        title: "הנכס נוסף בהצלחה!",
        description: "הנכס שלך נוסף למערכת ואתה יכול להתחיל לנהל אותו"
      });

      setFormData({
        address: '',
        city: '',
        rooms: '',
        floor: '',
        property_size: '',
        notes: '',
        monthly_rent: '',
        deposit_amount: '',
        owner_phone: ''
      });
      setIsOpen(false);
      onPropertyAdded();
    } catch (error) {
      logger.error('Error adding property:', error, 'AddPropertyFlow');
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת הנכס. אנא נסה שוב",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          הוסף נכס ראשון
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">הוספת נכס חדש</DialogTitle>
          <DialogDescription className="text-right">
            בחר את הדרך הנוחה עבורך להוסיף את הנכס שלך למערכת
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              נכס יחיד
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              העלאה מרובה
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              חיפוש נכס קיים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">פרטי הנכס</CardTitle>
                <CardDescription className="text-right">
                  מלא את הפרטים הבסיסיים של הנכס שלך
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-right">כתובת *</Label>
                    <Input
                      id="address"
                      placeholder="רחוב הרצל 123"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-right">עיר *</Label>
                    <Input
                      id="city"
                      placeholder="תל אביב"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rooms" className="text-right">מספר חדרים</Label>
                    <Select onValueChange={(value) => handleInputChange('rooms', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר מספר חדרים" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 חדר</SelectItem>
                        <SelectItem value="2">2 חדרים</SelectItem>
                        <SelectItem value="3">3 חדרים</SelectItem>
                        <SelectItem value="4">4 חדרים</SelectItem>
                        <SelectItem value="5">5+ חדרים</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor" className="text-right">קומה</Label>
                    <Input
                      id="floor"
                      type="number"
                      placeholder="3"
                      value={formData.floor}
                      onChange={(e) => handleInputChange('floor', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="property_size" className="text-right">גודל (מ"ר)</Label>
                    <Input
                      id="property_size"
                      type="number"
                      placeholder="75"
                      value={formData.property_size}
                      onChange={(e) => handleInputChange('property_size', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_rent" className="text-right">שכר דירה חודשי (₪)</Label>
                    <Input
                      id="monthly_rent"
                      type="number"
                      placeholder="4500"
                      value={formData.monthly_rent}
                      onChange={(e) => handleInputChange('monthly_rent', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner_phone" className="text-right">טלפון בעל הנכס</Label>
                    <Input
                      id="owner_phone"
                      type="tel"
                      placeholder="052-123-4567"
                      value={formData.owner_phone}
                      onChange={(e) => handleInputChange('owner_phone', e.target.value)}
                      className="text-right"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-right">הערות</Label>
                  <Textarea
                    id="notes"
                    placeholder="הערות נוספות על הנכס..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="text-right"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleAddProperty} disabled={isLoading}>
                {isLoading ? 'מוסיף...' : 'הוסף נכס'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">העלאת נכסים מרובים</CardTitle>
                <CardDescription className="text-right">
                  העלה קובץ Excel או CSV עם רשימת הנכסים שלך
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">גרור קובץ לכאן או לחץ לבחירה</p>
                  <p className="text-sm text-muted-foreground">תומך בקבצי Excel (.xlsx) ו-CSV</p>
                  <Button variant="outline" className="mt-4">
                    בחר קובץ
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground text-right">
                  <p className="font-medium mb-2">פורמט הקובץ הנדרש:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>כתובת (חובה)</li>
                    <li>עיר (חובה)</li>
                    <li>מספר חדרים</li>
                    <li>קומה</li>
                    <li>שכר דירה</li>
                    <li>הערות</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">חיפוש נכס קיים במערכת</CardTitle>
                <CardDescription className="text-right">
                  חפש אם הנכס שלך כבר קיים במערכת וטען בעלות עליו
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search-address" className="text-right">חפש לפי כתובת</Label>
                  <Input
                    id="search-address"
                    placeholder="הכנס כתובת לחיפוש..."
                    className="text-right"
                  />
                </div>
                <Button className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  חפש נכסים
                </Button>
                <div className="text-center text-muted-foreground">
                  <p>לא נמצאו נכסים תואמים</p>
                  <p className="text-sm">נסה לחפש עם מילות מפתח אחרות</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};