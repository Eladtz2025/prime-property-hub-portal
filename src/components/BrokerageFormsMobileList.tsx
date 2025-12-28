import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Clock, 
  Copy, 
  CheckCircle2, 
  User, 
  Phone,
  MessageCircle,
  Building,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export const BrokerageFormsMobileList: React.FC = () => {
  const { data: forms, isLoading: formsLoading } = useQuery({
    queryKey: ['brokerage-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokerage_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: pendingTokens, isLoading: tokensLoading } = useQuery({
    queryKey: ['pending-brokerage-tokens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokerage_form_tokens')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const copyTokenLink = (token: string) => {
    const link = `${window.location.origin}/brokerage-form/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('הלינק הועתק ללוח');
  };

  const shareWhatsApp = (token: string) => {
    const link = `${window.location.origin}/brokerage-form/${token}`;
    const message = `שלום! להלן הלינק לטופס הזמנת שירותי תיווך:\n${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const isLoading = formsLoading || tokensLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const pendingCount = pendingTokens?.length || 0;
  const signedCount = forms?.length || 0;

  if (pendingCount === 0 && signedCount === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mb-2">אין טפסי תיווך עדיין</p>
        <p className="text-sm text-muted-foreground">
          לחץ על "טופס תיווך חדש" כדי ליצור טופס ראשון
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Tokens Section */}
      {pendingCount > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-yellow-600" />
            <h3 className="text-sm font-semibold">בהמתנה לחתימה ({pendingCount})</h3>
          </div>
          <div className="space-y-3">
            {pendingTokens?.map((tokenRecord) => {
              const formData = tokenRecord.form_data as any || {};
              const properties = formData.properties as any[] || [];
              const expiresAt = new Date(tokenRecord.expires_at);
              const isExpiringSoon = expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

              return (
                <Card 
                  key={tokenRecord.id} 
                  className="border-r-4 border-r-yellow-500 bg-card"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="gap-1 text-yellow-700 border-yellow-300 bg-yellow-50">
                            <Clock className="h-3 w-3" />
                            ממתין
                          </Badge>
                          {isExpiringSoon && (
                            <Badge variant="destructive" className="text-xs">
                              יפוג בקרוב
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Building className="h-3.5 w-3.5" />
                          <span>{properties.length} נכסים</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>יפוג: {format(expiresAt, 'dd/MM/yyyy', { locale: he })}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyTokenLink(tokenRecord.token)}
                          className="gap-1.5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          העתק
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareWhatsApp(tokenRecord.token)}
                          className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          שלח
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Signed Forms Section */}
      {signedCount > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-semibold">חתומים ({signedCount})</h3>
          </div>
          <div className="space-y-3">
            {forms?.map((form) => {
              const properties = form.properties as any[] || [];

              return (
                <Sheet key={form.id}>
                  <SheetTrigger asChild>
                    <Card className="border-r-4 border-r-green-500 bg-card cursor-pointer hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium truncate">{form.client_name}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Phone className="h-3.5 w-3.5" />
                              <span dir="ltr">{form.client_phone}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                              {form.fee_type_rental && (
                                <Badge variant="secondary" className="text-xs">השכרה</Badge>
                              )}
                              {form.fee_type_sale && (
                                <Badge variant="secondary" className="text-xs">מכירה</Badge>
                              )}
                              <Badge variant="outline" className="text-xs gap-1">
                                <Building className="h-3 w-3" />
                                {properties.length} נכסים
                              </Badge>
                            </div>
                          </div>

                          <div className="text-left">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(form.form_date), 'dd/MM', { locale: he })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </SheetTrigger>

                  <SheetContent side="bottom" className="h-[85vh] rtl">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        טופס תיווך חתום
                      </SheetTitle>
                      <SheetDescription>
                        נחתם בתאריך {format(new Date(form.form_date), 'dd MMMM yyyy', { locale: he })}
                      </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6 overflow-y-auto pb-8">
                      {/* Client Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">פרטי הלקוח</h4>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">שם מלא</span>
                            <span className="font-medium">{form.client_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ת.ז</span>
                            <span>{form.client_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">טלפון</span>
                            <span dir="ltr">{form.client_phone}</span>
                          </div>
                          {form.referred_by && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">מופנה ע"י</span>
                              <span>{form.referred_by}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fee Types */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">סוג דמי תיווך</h4>
                        <div className="flex gap-2">
                          {form.fee_type_rental && (
                            <Badge className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              השכרה
                            </Badge>
                          )}
                          {form.fee_type_sale && (
                            <Badge className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              מכירה
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Properties */}
                      {properties.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">נכסים ({properties.length})</h4>
                          <div className="space-y-2">
                            {properties.map((prop: any, idx: number) => (
                              <div key={idx} className="bg-muted/50 rounded-lg p-3">
                                <p className="font-medium">{prop.address}</p>
                                <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                                  {prop.floor && <span>קומה {prop.floor}</span>}
                                  {prop.rooms && <span>{prop.rooms} חדרים</span>}
                                  {prop.price && <span>₪{Number(prop.price).toLocaleString()}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Special Terms */}
                      {form.special_terms && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">תנאים מיוחדים</h4>
                          <p className="text-sm bg-muted/50 rounded-lg p-4">
                            {form.special_terms}
                          </p>
                        </div>
                      )}

                      {/* Agent Info */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">פרטי הסוכן</h4>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">שם</span>
                            <span>{form.agent_name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Signature */}
                      {form.client_signature && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">חתימת הלקוח</h4>
                          <div className="bg-white border rounded-lg p-4 flex items-center justify-center">
                            <img 
                              src={form.client_signature} 
                              alt="חתימת לקוח" 
                              className="max-h-24 object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
