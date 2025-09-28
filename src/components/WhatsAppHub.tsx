import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Clock, Users, Settings, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppMessage {
  id: string;
  propertyId: string;
  ownerName: string;
  ownerPhone: string;
  lastMessage: string;
  timestamp: string;
  status: 'active' | 'pending' | 'resolved';
  unreadCount: number;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'contract' | 'payment' | 'maintenance' | 'general';
}

const messageTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'תזכורת תשלום שכירות',
    content: 'שלום {שם}, מזכיר לך שתשלום דמי השכירות לנכס ב{כתובת} אמור להתקבל עד {תאריך}. תודה!',
    category: 'payment'
  },
  {
    id: '2', 
    name: 'תזכורת חוזה מסתיים',
    content: 'שלום {שם}, חוזה השכירות של הנכס ב{כתובת} מסתיים ב{חוזה}. נשמח לתאם פגישה לדיון על חידוש החוזה.',
    category: 'contract'
  },
  {
    id: '3',
    name: 'בירור מצב נכס',
    content: 'שלום {שם}, מעוניינים לבדוק את מצב הנכס ב{כתובת}. האם הנכס כרגע מושכר? תודה על העדכון.',
    category: 'general'
  },
  {
    id: '4',
    name: 'עדכון תחזוקה',
    content: 'שלום {שם}, רציתי לעדכן אותך שהתחזוקה בנכס ב{כתובת} הושלמה בהצלחה. הכל תקין ומוכן.',
    category: 'maintenance'
  }
];

export const WhatsAppHub: React.FC = () => {
  const [conversations, setConversations] = useState<WhatsAppMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Mock data for demonstration
  useEffect(() => {
    const mockConversations: WhatsAppMessage[] = [
      {
        id: '1',
        propertyId: 'prop1',
        ownerName: 'יוסי כהן',
        ownerPhone: '972501234567',
        lastMessage: 'תודה על העדכון!',
        timestamp: '10:30',
        status: 'active',
        unreadCount: 0
      },
      {
        id: '2', 
        propertyId: 'prop2',
        ownerName: 'שרה לוי',
        ownerPhone: '972507654321',
        lastMessage: 'מתי אפשר לתאם את התחזוקה?',
        timestamp: '09:15',
        status: 'pending',
        unreadCount: 2
      }
    ];
    setConversations(mockConversations);
  }, []);

  const checkWhatsAppConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-status');
      if (error) throw error;
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error);
      setIsConnected(false);
    }
  };

  const sendMessage = async (message: string, phone?: string) => {
    try {
      const targetPhone = phone || conversations.find(c => c.id === selectedConversation)?.ownerPhone;
      if (!targetPhone) {
        toast({
          title: "שגיאה",
          description: "לא נמצא מספר טלפון",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: { phone: targetPhone, message }
      });

      if (error) throw error;

      toast({
        title: "הודעה נשלחה",
        description: "ההודעה נשלחה בהצלחה ב-WhatsApp"
      });

      setNewMessage('');
      setPhoneNumber('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "שגיאה בשליחה",
        description: "לא הצלחנו לשלוח את ההודעה",
        variant: "destructive"
      });
    }
  };

  const sendTemplateMessage = async (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (!template) return;

    // For now, send the template as-is. Later we'll add property data substitution
    await sendMessage(template.content);
  };

  useEffect(() => {
    checkWhatsAppConnection();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">מרכז WhatsApp</h1>
          <p className="text-muted-foreground">
            ניהול תקשורת מתקדם עם בעלי נכסים
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isConnected ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isConnected ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {isConnected ? 'מחובר' : 'לא מחובר'}
          </Badge>
          <Button variant="outline" onClick={checkWhatsAppConnection}>
            <Settings className="h-4 w-4 ml-2" />
            הגדרות
          </Button>
        </div>
      </div>

      <Tabs defaultValue="conversations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conversations">
            <MessageSquare className="h-4 w-4 ml-2" />
            שיחות
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Clock className="h-4 w-4 ml-2" />
            תבניות
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Settings className="h-4 w-4 ml-2" />
            אוטומציה
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Users className="h-4 w-4 ml-2" />
            דוחות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">שיחות פעילות</CardTitle>
                <CardDescription>
                  {conversations.filter(c => c.unreadCount > 0).length} הודעות חדשות
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedConversation === conversation.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{conversation.ownerName}</h4>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={conversation.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {conversation.status === 'active' ? 'פעיל' : 
                             conversation.status === 'pending' ? 'ממתין' : 'סגור'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {conversation.timestamp}
                          </span>
                        </div>
                      </div>
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedConversation 
                    ? conversations.find(c => c.id === selectedConversation)?.ownerName
                    : 'בחר שיחה'
                  }
                </CardTitle>
                {selectedConversation && (
                  <CardDescription>
                    {conversations.find(c => c.id === selectedConversation)?.ownerPhone}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedConversation ? (
                  <>
                    <div className="h-64 border rounded-lg p-4 bg-muted/20">
                      <p className="text-center text-muted-foreground">
                        היסטוריית השיחה תוצג כאן
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="הקלד הודעה..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button onClick={() => sendMessage(newMessage)} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">בחר שיחה כדי להתחיל</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>תבניות הודעות</CardTitle>
                <CardDescription>
                  תבניות מוכנות לשליחה מהירה
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {messageTemplates.map((template) => (
                  <div key={template.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {template.category === 'payment' ? 'תשלום' :
                         template.category === 'contract' ? 'חוזה' :
                         template.category === 'maintenance' ? 'תחזוקה' : 'כלליות'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.content}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => sendTemplateMessage(template.id)}
                      disabled={!selectedConversation}
                    >
                      שלח תבנית
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>שליחה חדשה</CardTitle>
                <CardDescription>
                  שלח הודעה למספר טלפון חדש
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="מספר טלפון (עם קוד מדינה)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תבנית" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="הודעה מותאמת אישית..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={() => sendMessage(newMessage || messageTemplates.find(t => t.id === selectedTemplate)?.content || '', phoneNumber)}
                  disabled={!phoneNumber || (!newMessage && !selectedTemplate)}
                  className="w-full"
                >
                  <Send className="h-4 w-4 ml-2" />
                  שלח הודעה
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>אוטומציות WhatsApp</CardTitle>
              <CardDescription>
                הגדר שליחות אוטומטיות לפי תאריכים ואירועים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">מערכת האוטומציה תהיה זמינה בקרוב</p>
                <p className="text-sm text-muted-foreground">
                  תכלול: תזכורות אוטומטיות, מעקב אחר תוקפות חוזים, התראות תשלום
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">הודעות נשלחו</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">החודש</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">שיחות פעילות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">השבוע</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">אחוז מענה</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89%</div>
                <p className="text-xs text-muted-foreground">ממוצע</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};