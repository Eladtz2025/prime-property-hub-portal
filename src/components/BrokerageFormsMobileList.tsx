import React, { useState } from 'react';
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
  Calendar,
  Download,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { downloadBrokerageFormPDF } from '@/lib/brokerage-pdf-generator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export const BrokerageFormsMobileList: React.FC = () => {
  const [downloadingFormId, setDownloadingFormId] = useState<string | null>(null);
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

  const handleDownloadPDF = async (form: any) => {
    setDownloadingFormId(form.id);
    try {
      await downloadBrokerageFormPDF({
        client_name: form.client_name,
        client_id: form.client_id,
        client_phone: form.client_phone,
        client_signature: form.client_signature,
        agent_name: form.agent_name,
        agent_id: form.agent_id,
        form_date: form.form_date,
        fee_type_rental: form.fee_type_rental,
        fee_type_sale: form.fee_type_sale,
        properties: form.properties as any[],
        special_terms: form.special_terms,
        referred_by: form.referred_by,
      });
      toast.success('הקובץ הורד בהצלחה');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('שגיאה בהורדת הקובץ');
    } finally {
      setDownloadingFormId(null);
    }
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

                          <div className="flex flex-col items-end gap-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(form.form_date), 'dd/MM', { locale: he })}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPDF(form);
                              }}
                              disabled={downloadingFormId === form.id}
                              className="gap-1.5 h-8"
                            >
                              {downloadingFormId === form.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </SheetTrigger>

                  <SheetContent side="bottom" className="h-[85vh] rtl flex flex-col">
                    <SheetHeader className="flex-shrink-0 pt-4">
                      <SheetTitle className="flex items-center gap-2 text-base">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        טופס תיווך חתום
                      </SheetTitle>
                      <SheetDescription className="text-xs">
                        נחתם בתאריך {format(new Date(form.form_date), 'dd MMMM yyyy', { locale: he })}
                      </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto mt-4 space-y-4 pb-8">
                      {/* Client Details */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs text-muted-foreground">פרטי הלקוח</h4>
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-xs">שם מלא</span>
                            <span className="font-medium">{form.client_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-xs">ת.ז</span>
                            <span>{form.client_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-xs">טלפון</span>
                            <span dir="ltr">{form.client_phone}</span>
                          </div>
                          {form.referred_by && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-xs">מופנה ע"י</span>
                              <span>{form.referred_by}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fee Types */}
                      <div className="space-y-1.5">
                        <h4 className="font-semibold text-xs text-muted-foreground">סוג דמי תיווך</h4>
                        <div className="flex gap-2">
                          {form.fee_type_rental && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <CheckCircle2 className="h-3 w-3" />
                              השכרה
                            </Badge>
                          )}
                          {form.fee_type_sale && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <CheckCircle2 className="h-3 w-3" />
                              מכירה
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Properties */}
                      {properties.length > 0 && (
                        <div className="space-y-1.5">
                          <h4 className="font-semibold text-xs text-muted-foreground">נכסים ({properties.length})</h4>
                          <div className="space-y-1.5">
                            {properties.map((prop: any, idx: number) => (
                              <div key={idx} className="bg-muted/50 rounded-lg p-2.5">
                                <p className="font-medium text-sm">{prop.address}</p>
                                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
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
                        <div className="space-y-1.5">
                          <h4 className="font-semibold text-xs text-muted-foreground">תנאים מיוחדים</h4>
                          <p className="text-sm bg-muted/50 rounded-lg p-3">
                            {form.special_terms}
                          </p>
                        </div>
                      )}

                      {/* Agent Info */}
                      <div className="space-y-1.5">
                        <h4 className="font-semibold text-xs text-muted-foreground">פרטי הסוכן</h4>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground text-xs">שם</span>
                            <span>{form.agent_name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Signature */}
                      {form.client_signature && (
                        <div className="space-y-1.5">
                          <h4 className="font-semibold text-xs text-muted-foreground">חתימת הלקוח</h4>
                          <div className="bg-white border rounded-lg p-3 flex items-center justify-center">
                            <img 
                              src={form.client_signature} 
                              alt="חתימת לקוח" 
                              className="max-h-16 object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {/* Download PDF Button */}
                      <div className="pt-3 border-t mt-auto flex-shrink-0">
                        <Button
                          onClick={() => handleDownloadPDF(form)}
                          disabled={downloadingFormId === form.id}
                          className="w-full gap-2"
                          size="sm"
                        >
                          {downloadingFormId === form.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              מכין PDF...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              הורד כ-PDF
                            </>
                          )}
                        </Button>
                      </div>
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
