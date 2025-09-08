import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  DollarSign, 
  MessageSquare,
  Receipt,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Tenant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  monthly_rent?: number;
  deposit_amount?: number;
  lease_start_date?: string;
  lease_end_date?: string;
  is_active: boolean;
  property_id: string;
}

interface RentPayment {
  id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  payment_method: string;
  status: string;
  notes?: string;
  created_at: string;
  created_by: string;
  property_id: string;
  receipt_url?: string;
  tenant_id: string;
  updated_at: string;
}

interface TenantCommunication {
  id: string;
  subject?: string;
  message: string;
  communication_type: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  tenant_id: string;
  property_id: string;
}

interface TenantManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyAddress: string;
  tenant?: Tenant;
  onTenantUpdated: () => void;
}

export const TenantManagementModal: React.FC<TenantManagementModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyAddress,
  tenant,
  onTenantUpdated
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(false);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [communications, setCommunications] = useState<TenantCommunication[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Tenant form state
  const [tenantForm, setTenantForm] = useState({
    name: '',
    phone: '',
    email: '',
    monthly_rent: '',
    deposit_amount: '',
    lease_start_date: undefined as Date | undefined,
    lease_end_date: undefined as Date | undefined,
    is_active: true
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date(),
    due_date: new Date(),
    payment_method: 'cash',
    status: 'pending' as const,
    notes: ''
  });

  // Communication form state
  const [communicationForm, setCommunicationForm] = useState({
    subject: '',
    message: '',
    communication_type: 'message' as const
  });

  useEffect(() => {
    if (tenant) {
      setTenantForm({
        name: tenant.name || '',
        phone: tenant.phone || '',
        email: tenant.email || '',
        monthly_rent: tenant.monthly_rent?.toString() || '',
        deposit_amount: tenant.deposit_amount?.toString() || '',
        lease_start_date: tenant.lease_start_date ? new Date(tenant.lease_start_date) : undefined,
        lease_end_date: tenant.lease_end_date ? new Date(tenant.lease_end_date) : undefined,
        is_active: tenant.is_active
      });
      
      loadTenantData(tenant.id);
    } else {
      resetForms();
    }
  }, [tenant]);

  const resetForms = () => {
    setTenantForm({
      name: '',
      phone: '',
      email: '',
      monthly_rent: '',
      deposit_amount: '',
      lease_start_date: undefined,
      lease_end_date: undefined,
      is_active: true
    });
    setPaymentForm({
      amount: '',
      payment_date: new Date(),
      due_date: new Date(),
      payment_method: 'cash',
      status: 'pending',
      notes: ''
    });
    setCommunicationForm({
      subject: '',
      message: '',
      communication_type: 'message'
    });
  };

  const loadTenantData = async (tenantId: string) => {
    try {
      // Load rent payments
      const { data: payments } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('due_date', { ascending: false });

      // Load communications
      const { data: comms } = await supabase
        .from('tenant_communications')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      setRentPayments(payments || []);
      setCommunications(comms || []);
    } catch (error) {
      console.error('Error loading tenant data:', error);
    }
  };

  const handleSaveTenant = async () => {
    if (!user || !tenantForm.name) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את השם של הדייר",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const tenantData = {
        name: tenantForm.name,
        phone: tenantForm.phone || null,
        email: tenantForm.email || null,
        monthly_rent: tenantForm.monthly_rent ? parseFloat(tenantForm.monthly_rent) : null,
        deposit_amount: tenantForm.deposit_amount ? parseFloat(tenantForm.deposit_amount) : null,
        lease_start_date: tenantForm.lease_start_date?.toISOString().split('T')[0] || null,
        lease_end_date: tenantForm.lease_end_date?.toISOString().split('T')[0] || null,
        is_active: tenantForm.is_active,
        property_id: propertyId
      };

      if (tenant) {
        // Update existing tenant
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', tenant.id);

        if (error) throw error;
      } else {
        // Create new tenant
        const { error } = await supabase
          .from('tenants')
          .insert(tenantData);

        if (error) throw error;
      }

      toast({
        title: "הדייר נשמר בהצלחה!",
        description: tenant ? "פרטי הדייר עודכנו" : "דייר חדש נוסף"
      });

      onTenantUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשמירת פרטי הדייר",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!user || !tenant || !paymentForm.amount) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('rent_payments')
        .insert({
          tenant_id: tenant.id,
          property_id: propertyId,
          amount: parseFloat(paymentForm.amount),
          payment_date: paymentForm.payment_date.toISOString().split('T')[0],
          due_date: paymentForm.due_date.toISOString().split('T')[0],
          payment_method: paymentForm.payment_method,
          status: paymentForm.status,
          notes: paymentForm.notes || null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "התשלום נוסף בהצלחה!",
        description: "תשלום השכירות נרשם במערכת"
      });

      setPaymentForm({
        amount: '',
        payment_date: new Date(),
        due_date: new Date(),
        payment_method: 'cash',
        status: 'pending',
        notes: ''
      });

      loadTenantData(tenant.id);
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת התשלום",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!user || !tenant || !communicationForm.message) {
      toast({
        title: "שגיאה",
        description: "אנא כתב הודעה",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tenant_communications')
        .insert({
          tenant_id: tenant.id,
          property_id: propertyId,
          sender_id: user.id,
          subject: communicationForm.subject || null,
          message: communicationForm.message,
          communication_type: communicationForm.communication_type
        });

      if (error) throw error;

      toast({
        title: "ההודעה נשלחה!",
        description: "ההודעה נרשמה במערכת"
      });

      setCommunicationForm({
        subject: '',
        message: '',
        communication_type: 'message'
      });

      loadTenantData(tenant.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת ההודעה",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-500',
      paid: 'bg-green-500',
      overdue: 'bg-red-500',
      partial: 'bg-orange-500'
    };
    
    const labels = {
      pending: 'ממתין',
      paid: 'שולם',
      overdue: 'איחור',
      partial: 'חלקי'
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants]} text-white`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">
            {tenant ? 'ניהול דייר' : 'הוספת דייר חדש'}
          </DialogTitle>
          <DialogDescription className="text-right">
            נכס: {propertyAddress}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details" className="gap-2">
              <User className="w-4 h-4" />
              פרטי דייר
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2" disabled={!tenant}>
              <DollarSign className="w-4 h-4" />
              תשלומים
            </TabsTrigger>
            <TabsTrigger value="communications" className="gap-2" disabled={!tenant}>
              <MessageSquare className="w-4 h-4" />
              תקשורת
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2" disabled={!tenant}>
              <Receipt className="w-4 h-4" />
              מסמכים
            </TabsTrigger>
          </TabsList>

          {/* Tenant Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">פרטים אישיים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-right">שם מלא *</Label>
                    <Input
                      id="name"
                      placeholder="שם הדייר"
                      value={tenantForm.name}
                      onChange={(e) => setTenantForm(prev => ({ ...prev, name: e.target.value }))}
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-right">טלפון</Label>
                    <Input
                      id="phone"
                      placeholder="050-1234567"
                      value={tenantForm.phone}
                      onChange={(e) => setTenantForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-right">אימייל</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tenant@example.com"
                      value={tenantForm.email}
                      onChange={(e) => setTenantForm(prev => ({ ...prev, email: e.target.value }))}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-right">סטטוס</Label>
                    <Select 
                      value={tenantForm.is_active ? 'active' : 'inactive'}
                      onValueChange={(value) => setTenantForm(prev => ({ ...prev, is_active: value === 'active' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">פעיל</SelectItem>
                        <SelectItem value="inactive">לא פעיל</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-right">פרטי חכירה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_rent" className="text-right">שכר דירה חודשי (₪)</Label>
                    <Input
                      id="monthly_rent"
                      type="number"
                      placeholder="4500"
                      value={tenantForm.monthly_rent}
                      onChange={(e) => setTenantForm(prev => ({ ...prev, monthly_rent: e.target.value }))}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit_amount" className="text-right">פיקדון (₪)</Label>
                    <Input
                      id="deposit_amount"
                      type="number"
                      placeholder="9000"
                      value={tenantForm.deposit_amount}
                      onChange={(e) => setTenantForm(prev => ({ ...prev, deposit_amount: e.target.value }))}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-right">תחילת חכירה</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !tenantForm.lease_start_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tenantForm.lease_start_date ? (
                            format(tenantForm.lease_start_date, "PPP", { locale: he })
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={tenantForm.lease_start_date}
                          onSelect={(date) => setTenantForm(prev => ({ ...prev, lease_start_date: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-right">סיום חכירה</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !tenantForm.lease_end_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tenantForm.lease_end_date ? (
                            format(tenantForm.lease_end_date, "PPP", { locale: he })
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={tenantForm.lease_end_date}
                          onSelect={(date) => setTenantForm(prev => ({ ...prev, lease_end_date: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                ביטול
              </Button>
              <Button onClick={handleSaveTenant} disabled={isLoading}>
                {isLoading ? 'שומר...' : (tenant ? 'עדכן' : 'הוסף דייר')}
              </Button>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            {/* Add Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">הוספת תשלום</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_amount" className="text-right">סכום (₪)</Label>
                    <Input
                      id="payment_amount"
                      type="number"
                      placeholder="4500"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-right">אמצעי תשלום</Label>
                    <Select 
                      value={paymentForm.payment_method}
                      onValueChange={(value) => setPaymentForm(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">מזומן</SelectItem>
                        <SelectItem value="bank_transfer">העברה בנקאית</SelectItem>
                        <SelectItem value="check">המחאה</SelectItem>
                        <SelectItem value="credit_card">כרטיס אשראי</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-right">סטטוס</Label>
                    <Select 
                      value={paymentForm.status}
                      onValueChange={(value: any) => setPaymentForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">ממתין</SelectItem>
                        <SelectItem value="paid">שולם</SelectItem>
                        <SelectItem value="overdue">איחור</SelectItem>
                        <SelectItem value="partial">חלקי</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_notes" className="text-right">הערות</Label>
                  <Textarea
                    id="payment_notes"
                    placeholder="הערות על התשלום..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="text-right"
                    rows={2}
                  />
                </div>
                <Button onClick={handleAddPayment} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  הוסף תשלום
                </Button>
              </CardContent>
            </Card>

            {/* Payments List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">היסטוריית תשלומים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusBadge(payment.status)}
                        <div className="text-sm text-muted-foreground">
                          {payment.payment_method}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₪{payment.amount.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(payment.due_date), "dd/MM/yyyy")}
                        </div>
                      </div>
                    </div>
                  ))}
                  {rentPayments.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      אין תשלומים רשומים
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-6">
            {/* Send Message Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">שליחת הודעה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comm_subject" className="text-right">נושא</Label>
                  <Input
                    id="comm_subject"
                    placeholder="נושא ההודעה"
                    value={communicationForm.subject}
                    onChange={(e) => setCommunicationForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-right">סוג הודעה</Label>
                  <Select 
                    value={communicationForm.communication_type}
                    onValueChange={(value: any) => setCommunicationForm(prev => ({ ...prev, communication_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="message">הודעה רגילה</SelectItem>
                      <SelectItem value="maintenance_request">בקשת תחזוקה</SelectItem>
                      <SelectItem value="notice">הודעה רשמית</SelectItem>
                      <SelectItem value="reminder">תזכורת</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comm_message" className="text-right">הודעה *</Label>
                  <Textarea
                    id="comm_message"
                    placeholder="כתב את ההודעה..."
                    value={communicationForm.message}
                    onChange={(e) => setCommunicationForm(prev => ({ ...prev, message: e.target.value }))}
                    className="text-right"
                    rows={4}
                    required
                  />
                </div>
                <Button onClick={handleSendMessage} className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  שלח הודעה
                </Button>
              </CardContent>
            </Card>

            {/* Communications History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">היסטוריית תקשורת</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communications.map((comm) => (
                    <div key={comm.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          {comm.communication_type === 'message' && 'הודעה'}
                          {comm.communication_type === 'maintenance_request' && 'תחזוקה'}
                          {comm.communication_type === 'notice' && 'הודעה רשמית'}
                          {comm.communication_type === 'reminder' && 'תזכורת'}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(comm.created_at), "dd/MM/yyyy HH:mm")}
                        </div>
                      </div>
                      {comm.subject && (
                        <div className="font-medium mb-2 text-right">{comm.subject}</div>
                      )}
                      <div className="text-right">{comm.message}</div>
                    </div>
                  ))}
                  {communications.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      אין הודעות
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">מסמכי דייר</CardTitle>
                <CardDescription className="text-right">
                  העלה ונהל מסמכים הקשורים לדייר
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  תכונה זו תהיה זמינה בקרוב
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};