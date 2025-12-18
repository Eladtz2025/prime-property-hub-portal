import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/hooks/useCustomerData";
import { CustomerPropertyMatches } from "@/components/CustomerPropertyMatches";

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

  // Update formData when customer changes
  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const handleSave = async () => {
    if (!customer) return;
    
    setLoading(true);
    try {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת לקוח - {customer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>שם מלא</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>אימייל</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>טלפון</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
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
              <Label>סוג נכס</Label>
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
            <Label>ערים מועדפות (מופרד בפסיקים)</Label>
            <Input
              value={formData.preferred_cities?.join(', ') || ''}
              onChange={(e) => setFormData({ ...formData, preferred_cities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="תל אביב, רמת גן, גבעתיים"
            />
          </div>

          <div>
            <Label>שכונות מועדפות (מופרד בפסיקים)</Label>
            <Input
              value={formData.preferred_neighborhoods?.join(', ') || ''}
              onChange={(e) => setFormData({ ...formData, preferred_neighborhoods: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="רוטשילד, דיזנגוף, פלורנטין"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>תאריך כניסה מבוקש</Label>
              <Input
                type="date"
                value={formData.move_in_date || ''}
                onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
              />
            </div>
            <div>
              <Label>מעקב הבא</Label>
              <Input
                type="datetime-local"
                value={formData.next_followup_date || ''}
                onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
              />
            </div>
          </div>

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
