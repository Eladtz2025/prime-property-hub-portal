import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, User, Phone, CheckCircle2, Clock, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export const BrokerageFormsList: React.FC = () => {
  const { toast } = useToast();
  
  const { data: forms, isLoading } = useQuery({
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

  const { data: pendingTokens } = useQuery({
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
    toast({
      title: 'הלינק הועתק',
      description: 'כעת ניתן לשלוח את הלינק ללקוח',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>טפסי תיווך</CardTitle>
          <CardDescription>רשימת כל הטפסים שנשלחו</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!forms || forms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>טפסי תיווך</CardTitle>
          <CardDescription>רשימת כל הטפסים שנשלחו</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>אין טפסים עדיין</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-right">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          טפסי תיווך
        </CardTitle>
        <CardDescription>
          טפסים חתומים: {forms.length} | בהמתנה לחתימה: {pendingTokens?.length || 0}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-right">
          {/* Pending tokens section */}
          {pendingTokens && pendingTokens.length > 0 && (
            <>
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  בהמתנה לחתימה מרחוק
                </h3>
                <div className="space-y-2">
                  {pendingTokens.map((tokenRecord) => {
                    const formData = tokenRecord.form_data as any || {};
                    const properties = formData.properties as any[] || [];
                    
                    return (
                      <Card key={tokenRecord.id} className="border-r-4 border-r-yellow-500 border-l-0">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between text-right">
                            <div className="space-y-1 text-right">
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                ממתין לחתימה
                              </Badge>
                              <p className="text-sm text-muted-foreground">
                                {properties.length > 0 && `${properties.length} נכסים`}
                                {' · '}
                                נוצר {format(new Date(tokenRecord.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                תוקף עד: {format(new Date(tokenRecord.expires_at), 'dd/MM/yyyy', { locale: he })}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyTokenLink(tokenRecord.token)}
                            >
                              <Copy className="h-4 w-4 ml-2" />
                              העתק לינק
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  טפסים חתומים
                </h3>
              </div>
            </>
          )}
          {forms.map((form) => {
            const properties = form.properties as any[] || [];
            
            return (
              <Card key={form.id} className="border-r-4 border-r-primary border-l-0">
                <CardContent className="pt-6 text-right">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Right Column - Client Info */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{form.client_name}</p>
                          <p className="text-xs text-muted-foreground">ת.ז: {form.client_id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{form.client_phone}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          {format(new Date(form.form_date), 'dd MMMM yyyy', { locale: he })}
                        </p>
                      </div>

                      {form.referred_by && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">מופנה ע"י: </span>
                          <span className="font-medium">{form.referred_by}</span>
                        </div>
                      )}
                    </div>

                    {/* Left Column - Form Details */}
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {form.fee_type_rental && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            השכרה
                          </Badge>
                        )}
                        {form.fee_type_sale && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            מכירה
                          </Badge>
                        )}
                      </div>

                      {properties.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">נכסים ({properties.length}):</p>
                          <div className="space-y-1">
                            {properties.slice(0, 3).map((prop: any, idx: number) => (
                              <p key={idx} className="text-xs text-muted-foreground">
                                {prop.address} {prop.floor && `קומה ${prop.floor}`} {prop.rooms && `${prop.rooms} חד'`}
                              </p>
                            ))}
                            {properties.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{properties.length - 3} נוספים
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {form.special_terms && (
                        <div>
                          <p className="text-sm font-medium mb-1">תנאים מיוחדים:</p>
                          <p className="text-xs text-muted-foreground">{form.special_terms}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      סוכן: {form.agent_name} (ח.פ {form.agent_id})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      נשלח: {format(new Date(form.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
