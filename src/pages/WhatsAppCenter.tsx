import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { 
  MessageSquare, 
  Send, 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sendWhatsAppMessage } from '@/utils/whatsappHelper';

interface PropertyOwner {
  id: string;
  address: string;
  city: string;
  ownerName?: string;
  ownerPhone?: string;
}

interface MessageStatus {
  phone: string;
  status: 'sending' | 'success' | 'error';
  error?: string;
}

export const WhatsAppCenter: React.FC = () => {
  const [properties, setProperties] = useState<PropertyOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [individualPhone, setIndividualPhone] = useState('');
  const [individualMessage, setIndividualMessage] = useState('');
  const [sendingBulk, setSendingBulk] = useState(false);
  const [sendingIndividual, setSendingIndividual] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageStatuses, setMessageStatuses] = useState<MessageStatus[]>([]);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      // Load properties with owner information from database
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          address,
          city,
          property_owners!inner (
            owner_id,
            profiles!inner (
              full_name,
              phone
            )
          )
        `)
        .not('property_owners.profiles.phone', 'is', null);

      if (propertiesError) {
        throw propertiesError;
      }

      // Transform the data to match our interface
      const transformedProperties = propertiesData?.map(property => ({
        id: property.id,
        address: property.address,
        city: property.city,
        ownerName: property.property_owners[0]?.profiles?.full_name || 'לא ידוע',
        ownerPhone: property.property_owners[0]?.profiles?.phone || ''
      })).filter(prop => prop.ownerPhone) || [];
      
      setProperties(transformedProperties);
      
      if (transformedProperties.length === 0) {
        toast({
          title: "התראה",
          description: "לא נמצאו נכסים עם מספרי טלפון של בעלים",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת הנכסים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property =>
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedProperties.length === filteredProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(filteredProperties.map(p => p.id));
    }
  };

  const handlePropertySelect = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties(prev => [...prev, propertyId]);
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
    }
  };

  const replaceVariables = (text: string, property: PropertyOwner): string => {
    return text
      .replace(/{שם}/g, property.ownerName || 'בעל הנכס')
      .replace(/{כתובת}/g, property.address);
  };

  const handleSendIndividual = async () => {
    if (!individualPhone || !individualMessage) {
      toast({
        title: "שגיאה",
        description: "יש למלא מספר טלפון והודעה",
        variant: "destructive"
      });
      return;
    }

    setSendingIndividual(true);
    try {
      const result = await sendWhatsAppMessage(individualPhone, individualMessage);
      
      if (result.success) {
        toast({
          title: "הודעה נשלחה בהצלחה",
          description: `ההודעה נשלחה למספר ${individualPhone}`,
        });
        setIndividualPhone('');
        setIndividualMessage('');
      } else {
        toast({
          title: "שגיאה בשליחת הודעה",
          description: result.error || "אירעה שגיאה בשליחת ההודעה",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת ההודעה",
        variant: "destructive"
      });
    } finally {
      setSendingIndividual(false);
    }
  };

  const handleSendBulk = async () => {
    if (selectedProperties.length === 0 || !message) {
      toast({
        title: "שגיאה",
        description: "יש לבחור נכסים ולכתוב הודעה",
        variant: "destructive"
      });
      return;
    }

    setSendingBulk(true);
    setMessageStatuses([]);

    const selectedPropertiesData = properties.filter(p => selectedProperties.includes(p.id));
    const statuses: MessageStatus[] = selectedPropertiesData.map(p => ({
      phone: p.ownerPhone!,
      status: 'sending'
    }));
    setMessageStatuses(statuses);

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-bulk-send', {
        body: {
          recipients: selectedPropertiesData.map(property => ({
            phone: property.ownerPhone!,
            name: property.ownerName!,
            address: property.address,
            propertyId: property.id
          })),
          message: message
        }
      });

      if (error) throw error;

      // Update statuses based on results
      const updatedStatuses: MessageStatus[] = statuses.map(status => {
        const result = data.results?.find((r: any) => r.phone === status.phone);
        return {
          ...status,
          status: result?.success ? 'success' as const : 'error' as const,
          error: result?.error
        };
      });
      setMessageStatuses(updatedStatuses);

      const successCount = updatedStatuses.filter(s => s.status === 'success').length;
      toast({
        title: "שליחה הושלמה",
        description: `נשלחו ${successCount} הודעות מתוך ${selectedPropertiesData.length}`,
      });

      // Reset form
      setSelectedProperties([]);
      setMessage('');
    } catch (error) {
      console.error('Bulk send error:', error);
      toast({
        title: "שגיאה בשליחה קבוצתית",
        description: "אירעה שגיאה בשליחת ההודעות",
        variant: "destructive"
      });
    } finally {
      setSendingBulk(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">מרכז WhatsApp</h1>
      </div>

      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">שליחה אישית</TabsTrigger>
          <TabsTrigger value="bulk">שליחה קבוצתית</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                שליחת הודעה אישית
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">מספר טלפון</label>
                <Input
                  placeholder="05XXXXXXXX"
                  value={individualPhone}
                  onChange={(e) => setIndividualPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">הודעה</label>
                <Textarea
                  placeholder="כתוב את ההודעה כאן..."
                  value={individualMessage}
                  onChange={(e) => setIndividualMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button 
                onClick={handleSendIndividual}
                disabled={sendingIndividual || !individualPhone || !individualMessage}
                className="w-full"
              >
                {sendingIndividual ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    שולח...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    שלח הודעה
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  בחירת בעלי נכסים ({selectedProperties.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="חיפוש לפי כתובת או שם..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
                      בחר הכל ({filteredProperties.length})
                    </label>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-3">
                    {filteredProperties.map((property) => (
                      <div key={property.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-sm">
                        <Checkbox
                          id={property.id}
                          checked={selectedProperties.includes(property.id)}
                          onCheckedChange={(checked) => handlePropertySelect(property.id, checked as boolean)}
                        />
                        <label htmlFor={property.id} className="text-sm flex-1 cursor-pointer">
                          <div className="font-medium">{property.ownerName}</div>
                          <div className="text-muted-foreground">{property.address}</div>
                          <div className="text-xs text-muted-foreground">{property.ownerPhone}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  כתיבת הודעה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">הודעה</label>
                  <Textarea
                    placeholder="שלום {שם}, אני פונה אליך בנוגע לנכס שלך ב{כתובת}..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    משתנים זמינים: {'{שם}'} - שם בעל הנכס, {'{כתובת}'} - כתובת הנכס
                  </p>
                </div>

                {selectedProperties.length > 0 && message && (
                  <div className="border rounded-md p-3 bg-muted/30">
                    <h4 className="text-sm font-medium mb-2">תצוגה מקדימה:</h4>
                    <div className="text-sm">
                      {replaceVariables(message, filteredProperties.find(p => selectedProperties.includes(p.id))!)}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleSendBulk}
                  disabled={sendingBulk || selectedProperties.length === 0 || !message}
                  className="w-full"
                >
                  {sendingBulk ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      שלח ל-{selectedProperties.length} בעלי נכסים
                    </>
                  )}
                </Button>

                {messageStatuses.length > 0 && (
                  <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                    <h4 className="text-sm font-medium">סטטוס שליחה:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {messageStatuses.map((status, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span>{status.phone}</span>
                          <div className="flex items-center gap-1">
                            {status.status === 'sending' && <Clock className="h-3 w-3 animate-spin" />}
                            {status.status === 'success' && <CheckCircle className="h-3 w-3 text-green-600" />}
                            {status.status === 'error' && <XCircle className="h-3 w-3 text-red-600" />}
                            <Badge variant={
                              status.status === 'success' ? 'default' : 
                              status.status === 'error' ? 'destructive' : 'secondary'
                            }>
                              {status.status === 'sending' ? 'שולח' : 
                               status.status === 'success' ? 'נשלח' : 'נכשל'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};