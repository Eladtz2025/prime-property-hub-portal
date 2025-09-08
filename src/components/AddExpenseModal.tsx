import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Receipt, Wrench, Home, Car, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ReceiptUploader } from './ReceiptUploader';

const expenseCategories = [
  { value: 'maintenance', label: 'תחזוקה', icon: Wrench },
  { value: 'utilities', label: 'חשמל ומים', icon: Home },
  { value: 'insurance', label: 'ביטוח', icon: Receipt },
  { value: 'taxes', label: 'מיסים', icon: Calculator },
  { value: 'management', label: 'ניהול', icon: Car },
  { value: 'other', label: 'אחר', icon: Receipt }
];

const expenseSchema = z.object({
  property_id: z.string().min(1, 'יש לבחור נכס'),
  category: z.string().min(1, 'יש לבחור קטגוריה'),
  amount: z.number().min(0.01, 'סכום חייב להיות גדול מ-0'),
  transaction_date: z.date({ required_error: 'יש לבחור תאריך' }),
  description: z.string().optional(),
  receipt_url: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: any[];
  onSuccess: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  properties,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [receiptUrl, setReceiptUrl] = useState<string>('');

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      transaction_date: new Date(),
      receipt_url: '',
    }
  });

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user) {
      toast({
        title: "שגיאה",
        description: "משתמש לא מחובר",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('financial_records')
        .insert({
          property_id: data.property_id,
          type: 'expense',
          category: data.category,
          amount: data.amount,
          transaction_date: format(data.transaction_date, 'yyyy-MM-dd'),
          description: data.description,
          receipt_url: receiptUrl,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "הוצאה נוספה בהצלחה",
        description: "ההוצאה נוספה למערכת",
      });

      form.reset();
      setReceiptUrl('');
      onSuccess();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "שגיאה בהוספת הוצאה",
        description: "אנא נסה שוב",
        variant: "destructive",
      });
    }
  };

  const handleReceiptUpload = (fileUrl: string) => {
    setReceiptUrl(fileUrl);
    form.setValue('receipt_url', fileUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הוספת הוצאה חדשה</DialogTitle>
          <DialogDescription>
            הזן את פרטי ההוצאה החדשה והעלה קבלות
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">פרטי ההוצאה</TabsTrigger>
            <TabsTrigger value="receipt">קבלה ומסמכים</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="property">נכס</Label>
                <Select
                  value={form.watch('property_id')}
                  onValueChange={(value) => form.setValue('property_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר נכס" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.address}, {property.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.property_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.property_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">קטגוריה</Label>
                <Select
                  value={form.watch('category')}
                  onValueChange={(value) => form.setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">סכום (₪)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register('amount', { valueAsNumber: true })}
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>תאריך</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !form.watch('transaction_date') && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {form.watch('transaction_date') ? (
                        format(form.watch('transaction_date'), "dd/MM/yyyy", { locale: he })
                      ) : (
                        <span>בחר תאריך</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch('transaction_date')}
                      onSelect={(date) => date && form.setValue('transaction_date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.transaction_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.transaction_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">תיאור (אופציונלי)</Label>
                <Textarea
                  id="description"
                  placeholder="פירוט נוסף על ההוצאה..."
                  {...form.register('description')}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  ביטול
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'שומר...' : 'שמירה'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="receipt" className="space-y-4">
            <ReceiptUploader
              recordType="expense"
              onUploadComplete={handleReceiptUpload}
            />
            {receiptUrl && (
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-success">✓ קבלה הועלתה בהצלחה</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};