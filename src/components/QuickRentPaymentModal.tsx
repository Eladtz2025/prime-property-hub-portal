import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { PropertyWithTenant } from '@/types/owner-portal';
import { cn } from '@/lib/utils';

interface QuickRentPaymentModalProps {
  property: PropertyWithTenant;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickRentPaymentModal: React.FC<QuickRentPaymentModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState(property.tenant?.monthly_rent?.toString() || '');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [amountTouched, setAmountTouched] = useState(false);

  const validateAmount = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'יש להזין סכום';
    }
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return 'יש להזין סכום גדול מאפס';
    }
    return null;
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (amountTouched) {
      setAmountError(validateAmount(value));
    }
  };

  const handleAmountBlur = () => {
    setAmountTouched(true);
    setAmountError(validateAmount(amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !property.tenant) return;

    // Validate before submit
    const error = validateAmount(amount);
    setAmountTouched(true);
    setAmountError(error);
    if (error) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('rent_payments')
        .insert({
          tenant_id: property.tenant.id,
          property_id: property.id,
          amount: parseFloat(amount),
          payment_date: format(paymentDate, 'yyyy-MM-dd'),
          due_date: format(dueDate, 'yyyy-MM-dd'),
          status: 'paid',
          payment_method: paymentMethod,
          notes: notes || null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "תשלום נרשם בהצלחה",
        description: `תשלום של ₪${amount} נרשם לנכס ${property.address}`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לרשום את התשלום",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>רישום תשלום שכירות מהיר</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {property.address} - {property.tenant?.name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">סכום *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              onBlur={handleAmountBlur}
              placeholder="הזן סכום"
              className={cn(amountTouched && amountError && 'border-destructive focus-visible:ring-destructive')}
              required
            />
            {amountTouched && amountError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>{amountError}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>תאריך תשלום</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-right">
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {format(paymentDate, 'PPP', { locale: he })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>תאריך פירעון</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-right">
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {format(dueDate, 'PPP', { locale: he })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => date && setDueDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">אמצעי תשלום</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">העברה בנקאית</SelectItem>
                <SelectItem value="cash">מזומן</SelectItem>
                <SelectItem value="check">צ'ק</SelectItem>
                <SelectItem value="credit_card">כרטיס אשראי</SelectItem>
                <SelectItem value="other">אחר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות (אופציונלי)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות נוספות"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'שומר...' : 'שמור תשלום'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};