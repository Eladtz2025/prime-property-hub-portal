import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Users, CheckCircle, Clock, XCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface WhatsAppMessage {
  id: string;
  phone: string;
  message: string;
  status: string;
  direction: string;
  created_at: string;
  sender_name?: string;
  contact_name?: string;
}

interface PropertyForWhatsApp {
  id: string;
  address: string;
  owner_name: string;
  owner_phone: string;
}

export const WhatsAppHub: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [properties, setProperties] = useState<PropertyForWhatsApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  
  // Single message form
  const [singlePhone, setSinglePhone] = useState('');
  const [singleMessage, setSingleMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Bulk message form
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  
  // Filter by sent time
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [customHours, setCustomHours] = useState<string>('');
  const [customDays, setCustomDays] = useState<string>('');
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadTemplates();
    loadMessages();
    loadProperties();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('property_owners')
        .select(`
          property_id,
          properties!inner(id, address),
          profiles!inner(full_name, phone)
        `)
        .not('profiles.phone', 'is', null)
        .neq('profiles.phone', '');

      if (error) throw error;
      
      const formattedProperties = data?.map(item => ({
        id: item.property_id,
        address: item.properties?.address || '',
        owner_name: item.profiles?.full_name || '',
        owner_phone: item.profiles?.phone || ''
      })) || [];
      
      setProperties(formattedProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      if (activeTab === 'single') {
        setSingleMessage(template.content);
      } else {
        setBulkMessage(template.content);
      }
    }
    setSelectedTemplate(templateId);
  };

  const sendSingleMessage = async () => {
    if (!singlePhone || !singleMessage) {
      toast({
        title: "שגיאה",
        description: "נא למלא מספר טלפון והודעה",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          phone: singlePhone,
          message: singleMessage,
          type: 'single'
        }
      });

      if (error) throw error;

      toast({
        title: "הודעה נשלחה",
        description: "ההודעה נשלחה בהצלחה",
      });

      setSinglePhone('');
      setSingleMessage('');
      setSelectedTemplate('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "שגיאה בשליחה",
        description: "לא הצלחנו לשלוח את ההודעה",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendBulkMessages = async () => {
    if (selectedProperties.length === 0 || !bulkMessage) {
      toast({
        title: "שגיאה",
        description: "נא לבחור נכסים ולכתוב הודעה",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const bulkData = selectedProperties.map(propertyId => {
        const property = properties.find(p => p.id === propertyId);
        return {
          phone: property?.owner_phone || '',
          message: bulkMessage.replace('{{address}}', property?.address || '').replace('{{ownerName}}', property?.owner_name || ''),
          propertyId: propertyId
        };
      }).filter(item => item.phone);

      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          type: 'bulk',
          bulkData
        }
      });

      if (error) throw error;

      toast({
        title: "הודעות נשלחו",
        description: `נשלחו ${data.totalSent} הודעות בהצלחה`,
      });

      setSelectedProperties([]);
      setBulkMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      toast({
        title: "שגיאה בשליחה",
        description: "לא הצלחנו לשלוח את ההודעות",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'read':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('972')) {
      return '0' + phone.substring(3);
    }
    return phone;
  };

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const getFilteredProperties = () => {
    if (timeFilter === 'all') {
      return properties;
    }

    let filterDate = new Date();
    
    switch (timeFilter) {
      case '1hour':
        filterDate.setHours(filterDate.getHours() - 1);
        break;
      case '2hours':
        filterDate.setHours(filterDate.getHours() - 2);
        break;
      case '1day':
        filterDate.setDate(filterDate.getDate() - 1);
        break;
      case '2days':
        filterDate.setDate(filterDate.getDate() - 2);
        break;
      case 'customHours':
        if (customHours) {
          filterDate.setHours(filterDate.getHours() - parseInt(customHours));
        } else {
          return properties;
        }
        break;
      case 'customDays':
        if (customDays) {
          filterDate.setDate(filterDate.getDate() - parseInt(customDays));
        } else {
          return properties;
        }
        break;
      default:
        return properties;
    }

    // Filter properties that had messages sent in the timeframe
    const sentToPhones = new Set(
      messages
        .filter(msg => 
          msg.direction === 'outbound' && 
          new Date(msg.created_at) >= filterDate
        )
        .map(msg => msg.phone.replace(/^972/, '0'))
    );

    return properties.filter(property => {
      const normalizedPhone = formatPhone(property.owner_phone);
      return sentToPhones.has(normalizedPhone);
    });
  };

  const filteredProperties = getFilteredProperties();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-green-600" />
        <h1 className="text-2xl font-bold">מרכז WhatsApp</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            שליחה אישית
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            שליחה קבוצתית
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>שליחת הודעה אישית</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">בחר תבנית (אופציונלי)</label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תבנית הודעה" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">מספר טלפון</label>
                <Input
                  value={singlePhone}
                  onChange={(e) => setSinglePhone(e.target.value)}
                  placeholder="05xxxxxxxx או 972xxxxxxxxx"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-sm font-medium">הודעה</label>
                <Textarea
                  value={singleMessage}
                  onChange={(e) => setSingleMessage(e.target.value)}
                  placeholder="כתוב את ההודעה כאן..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={sendSingleMessage} 
                disabled={loading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'שולח...' : 'שלח הודעה'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>שליחה קבוצתית</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">בחר תבנית (אופציונלי)</label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תבנית הודעה" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">סנן לפי זמן שליחה</label>
                <div className="space-y-3 mb-4">
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר טווח זמן" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הנכסים</SelectItem>
                      <SelectItem value="1hour">שעה אחרונה</SelectItem>
                      <SelectItem value="2hours">שעתיים אחרונות</SelectItem>
                      <SelectItem value="1day">יום אחרון</SelectItem>
                      <SelectItem value="2days">יומיים אחרונים</SelectItem>
                      <SelectItem value="customHours">מספר שעות מותאם אישית</SelectItem>
                      <SelectItem value="customDays">מספר ימים מותאם אישית</SelectItem>
                    </SelectContent>
                  </Select>

                  {timeFilter === 'customHours' && (
                    <div>
                      <label className="text-sm text-muted-foreground">כמות שעות</label>
                      <Input
                        type="number"
                        min="1"
                        value={customHours}
                        onChange={(e) => setCustomHours(e.target.value)}
                        placeholder="הזן מספר שעות"
                      />
                    </div>
                  )}

                  {timeFilter === 'customDays' && (
                    <div>
                      <label className="text-sm text-muted-foreground">כמות ימים</label>
                      <Input
                        type="number"
                        min="1"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        placeholder="הזן מספר ימים"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">בחר נכסים ({selectedProperties.length} נבחרו)</label>
                {filteredProperties.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                    {filteredProperties.map(property => (
                    <div 
                      key={property.id}
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        selectedProperties.includes(property.id) 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-background border'
                      }`}
                      onClick={() => togglePropertySelection(property.id)}
                    >
                      <div className="font-medium">{property.address}</div>
                      <div className="text-sm text-muted-foreground">
                        {property.owner_name} - {formatPhone(property.owner_phone)}
                      </div>
                    </div>
                  ))}
                  </div>
                ) : (
                  <div className="border rounded-md p-8 text-center text-muted-foreground">
                    לא נמצאו נכסים בטווח הזמן שנבחר
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">הודעה</label>
                <Textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="כתוב את ההודעה כאן... (השתמש ב-{{address}} ו-{{ownerName}} להחלפה אוטומטית)"
                  rows={4}
                />
              </div>

              <Button 
                onClick={sendBulkMessages} 
                disabled={loading || selectedProperties.length === 0}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                {loading ? 'שולח...' : `שלח ל-${selectedProperties.length} נכסים`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Messages History */}
      <Card>
        <CardHeader>
          <CardTitle>היסטוריית הודעות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {messages.map(message => (
              <div key={message.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(message.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {formatPhone(message.phone)}
                    </span>
                    {message.sender_name && (
                      <span className="text-sm text-muted-foreground">
                        ({message.sender_name})
                      </span>
                    )}
                    <Badge variant={message.direction === 'inbound' ? 'default' : 'secondary'}>
                      {message.direction === 'inbound' ? 'נכנס' : 'יוצא'}
                    </Badge>
                    <Badge variant="outline">{message.status}</Badge>
                  </div>
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(message.created_at).toLocaleString('he-IL')}
                  </p>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                אין הודעות להצגה
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};