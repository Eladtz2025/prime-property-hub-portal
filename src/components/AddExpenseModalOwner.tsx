import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddExpenseModalOwnerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Array<{ property_id: string; property_address: string }>;
  onSuccess: () => void;
}

export const AddExpenseModalOwner: React.FC<AddExpenseModalOwnerProps> = ({
  open,
  onOpenChange,
  properties,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    property_id: '',
    amount: '',
    category: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('נדרש להתחבר');
      return;
    }

    if (!formData.property_id || !formData.amount || !formData.category) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('financial_records')
        .insert({
          property_id: formData.property_id,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          transaction_date: formData.transaction_date,
          type: 'expense',
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('ההוצאה נוספה בהצלחה');
      
      // Reset form
      setFormData({
        property_id: '',
        amount: '',
        category: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('שגיאה בהוספת הוצאה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>הוסף הוצאה</DialogTitle>
          <DialogDescription>
            הוסף רישום הוצאה חדש לנכס
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property">נכס *</Label>
            <Select
              value={formData.property_id}
              onValueChange={(value) =>
                setFormData({ ...formData, property_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר נכס" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((prop) => (
                  <SelectItem key={prop.property_id} value={prop.property_id}>
                    {prop.property_address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">קטגוריה *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ארנונה">ארנונה</SelectItem>
                <SelectItem value="ועד בית">ועד בית</SelectItem>
                <SelectItem value="תיקונים">תיקונים</SelectItem>
                <SelectItem value="שיפוצים">שיפוצים</SelectItem>
                <SelectItem value="ביטוח">ביטוח</SelectItem>
                <SelectItem value="משכנתא">משכנתא</SelectItem>
                <SelectItem value="אחר">אחר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">סכום *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction_date">תאריך *</Label>
            <Input
              id="transaction_date"
              type="date"
              value={formData.transaction_date}
              onChange={(e) =>
                setFormData({ ...formData, transaction_date: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              placeholder="תיאור ההוצאה..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              הוסף הוצאה
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
