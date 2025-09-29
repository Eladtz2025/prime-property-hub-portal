import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Clock, Users, Settings, Phone, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppMessage {
  id: string;
  phone: string;
  message: string;
  timestamp: string;
  status: string;
  direction: string;
  message_type: string;
  chat_type: string;
  group_name?: string;
  sender_name?: string;
  api_source: string;
  chat_id: string;
  sender_id?: string;
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
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chatTypeFilter, setChatTypeFilter] = useState<'all' | 'individual' | 'group'>('all');
  const [apiSourceFilter, setApiSourceFilter] = useState<'all' | 'meta' | 'green-api'>('all');
  const { toast } = useToast();

  // Load messages from database
  useEffect(() => {
    loadMessages();
    // Set up real-time subscription
    const subscription = supabase
      .channel('whatsapp_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages'
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "שגיאה בטעינת הודעות",
        description: "לא הצלחנו לטעון את ההודעות",
        variant: "destructive"
      });
    }
  };

  // Group messages by chat_id for conversation view
  const getConversations = () => {
    const conversationsMap = new Map();
    
    let filteredMessages = messages;
    if (chatTypeFilter !== 'all') {
      filteredMessages = filteredMessages.filter(m => m.chat_type === chatTypeFilter);
    }
    if (apiSourceFilter !== 'all') {
      filteredMessages = filteredMessages.filter(m => m.api_source === apiSourceFilter);
    }
    
    filteredMessages.forEach(message => {
      const chatId = message.chat_id;
      if (!conversationsMap.has(chatId)) {
        conversationsMap.set(chatId, {
          id: chatId,
          lastMessage: message,
          messages: [message],
          unreadCount: message.direction === 'inbound' ? 1 : 0
        });
      } else {
        const existing = conversationsMap.get(chatId);
        existing.messages.push(message);
        if (message.direction === 'inbound') {
          existing.unreadCount++;
        }
      }
    });
    
    return Array.from(conversationsMap.values()).sort((a, b) => 
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
  };

  const getSelectedChatMessages = () => {
    if (!selectedChat) return [];
    return messages
      .filter(m => m.chat_id === selectedChat)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

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
      const targetPhone = phone || selectedChat?.replace('@c.us', '').replace('@g.us', '');
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
      loadMessages(); // Refresh messages
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

  const conversations = getConversations();
  const selectedChatMessages = getSelectedChatMessages();

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
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <Select value={chatTypeFilter} onValueChange={(value: any) => setChatTypeFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="סוג שיחה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל השיחות</SelectItem>
                  <SelectItem value="individual">שיחות יחידות</SelectItem>
                  <SelectItem value="group">קבוצות</SelectItem>
                </SelectContent>
              </Select>
              <Select value={apiSourceFilter} onValueChange={(value: any) => setApiSourceFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="מקור API" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המקורות</SelectItem>
                  <SelectItem value="meta">Meta API</SelectItem>
                  <SelectItem value="green-api">Green API</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadMessages}>
                <Filter className="h-4 w-4 ml-2" />
                רענן
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">שיחות פעילות</CardTitle>
                <CardDescription>
                  {conversations.reduce((acc, c) => acc + c.unreadCount, 0)} הודעות חדשות
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {conversations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">אין הודעות להצגה</p>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedChat === conversation.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedChat(conversation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">
                              {conversation.lastMessage.chat_type === 'group' 
                                ? conversation.lastMessage.group_name 
                                : conversation.lastMessage.sender_name || conversation.lastMessage.phone
                              }
                            </h4>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {conversation.lastMessage.chat_type === 'group' ? 'קבוצה' : 'יחיד'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {conversation.lastMessage.api_source}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant={conversation.lastMessage.direction === 'inbound' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {conversation.lastMessage.direction === 'inbound' ? 'נכנס' : 'יוצא'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(conversation.lastMessage.timestamp).toLocaleString('he-IL')}
                            </span>
                          </div>
                        </div>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedChat 
                    ? (() => {
                        const conv = conversations.find(c => c.id === selectedChat);
                        if (!conv) return 'בחר שיחה';
                        return conv.lastMessage.chat_type === 'group' 
                          ? conv.lastMessage.group_name 
                          : conv.lastMessage.sender_name || conv.lastMessage.phone;
                      })()
                    : 'בחר שיחה'
                  }
                </CardTitle>
                {selectedChat && (() => {
                  const conv = conversations.find(c => c.id === selectedChat);
                  return conv ? (
                    <CardDescription>
                      {conv.lastMessage.chat_type === 'group' ? `קבוצה • ${conv.lastMessage.api_source}` : conv.lastMessage.phone}
                    </CardDescription>
                  ) : null;
                })()}
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedChat ? (
                  <>
                    <div className="h-64 border rounded-lg p-4 bg-muted/20 overflow-y-auto">
                      {selectedChatMessages.length === 0 ? (
                        <p className="text-center text-muted-foreground">אין הודעות בשיחה זו</p>
                      ) : (
                        selectedChatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`mb-3 p-2 rounded-lg max-w-[80%] ${
                              message.direction === 'outbound'
                                ? 'bg-primary text-primary-foreground mr-auto text-right'
                                : 'bg-muted ml-auto text-left'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {message.sender_name && (
                                <span className="text-xs opacity-70">{message.sender_name}</span>
                              )}
                              <span className="text-xs opacity-70">
                                {new Date(message.timestamp).toLocaleTimeString('he-IL')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
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
                      disabled={!selectedChat}
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