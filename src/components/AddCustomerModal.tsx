import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const AddCustomerModal = ({ open, onClose, onSave }: AddCustomerModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    preferred_cities: [] as string[],
    preferred_neighborhoods: [] as string[],
    move_in_date: '',
    notes: '',
  });

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'שגיאה',
        description: 'שם ואימייל הם שדות חובה',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contact_leads')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message || 'לקוח נוסף ידנית',
          status: formData.status,
          priority: formData.priority,
          source: formData.source,
          property_type: formData.property_type,
          budget_min: formData.budget_min,
          budget_max: formData.budget_max,
          rooms_min: formData.rooms_min,
          rooms_max: formData.rooms_max,
          preferred_cities: formData.preferred_cities.length > 0 ? formData.preferred_cities : null,
          preferred_neighborhoods: formData.preferred_neighborhoods.length > 0 ? formData.preferred_neighborhoods : null,
          move_in_date: formData.move_in_date || null,
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast({
        title: 'נוסף בהצלחה',
        description: 'לקוח חדש נוסף למערכת',
      });
      
      // Reset form
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
        preferred_cities: [],
        preferred_neighborhoods: [],
        move_in_date: '',
        notes: '',
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הוספת לקוח חדש</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>שם מלא *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="שם מלא"
              />
            </div>
            <div>
              <Label>אימייל *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>טלפון</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="050-1234567"
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>סוג נכס</Label>
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
              <Label>תאריך כניסה משוער</Label>
              <Input
                type="date"
                value={formData.move_in_date}
                onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>תקציב מינימום (₪)</Label>
              <Input
                type="number"
                value={formData.budget_min || ''}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value ? Number(e.target.value) : null })}
                placeholder="3000"
              />
            </div>
            <div>
              <Label>תקציב מקסימום (₪)</Label>
              <Input
                type="number"
                value={formData.budget_max || ''}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value ? Number(e.target.value) : null })}
                placeholder="5000"
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

          <div>
            <Label>ערים מועדפות (הפרד בפסיקים)</Label>
            <Input
              value={formData.preferred_cities.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                preferred_cities: e.target.value.split(',').map(c => c.trim()).filter(c => c) 
              })}
              placeholder="תל אביב, רמת גן"
            />
          </div>

          <div>
            <Label>שכונות מועדפות (הפרד בפסיקים)</Label>
            <Input
              value={formData.preferred_neighborhoods.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                preferred_neighborhoods: e.target.value.split(',').map(n => n.trim()).filter(n => n) 
              })}
              placeholder="נווה צדק, פלורנטין"
            />
          </div>

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