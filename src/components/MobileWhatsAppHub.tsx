import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare, Send, Users, Settings, Phone, CheckCircle, AlertCircle, ArrowRight, MessageCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRelevantPhoneNumbers } from '@/hooks/useRelevantPhoneNumbers';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';

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

export const MobileWhatsAppHub: React.FC = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const { toast } = useToast();
  
  const { isRelevantPhone, getContactInfo } = useRelevantPhoneNumbers();
  const { templates } = useMessageTemplates();

  useEffect(() => {
    loadMessages();
    checkWhatsAppConnection();
    
    const subscription = supabase
      .channel('whatsapp_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, () => {
        loadMessages();
      })
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
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const checkWhatsAppConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-status-greenapi');
      if (error) throw error;
      setIsConnected(data.connected);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const getConversations = () => {
    const conversationsMap = new Map();
    
    const relevantMessages = messages.filter(m => {
      if (m.chat_type === 'group') {
        const groupName = m.group_name?.toLowerCase() || '';
        const businessKeywords = ['נכס', 'דירה', 'שכירות', 'דיור', 'השכרה', 'בית', 'דירות'];
        return businessKeywords.some(keyword => groupName.includes(keyword));
      }
      return isRelevantPhone(m.phone);
    });
    
    relevantMessages.forEach(message => {
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

  const sendMessage = async (message: string) => {
    if (!selectedChat || !message.trim()) return;
    
    try {
      const targetPhone = selectedChat.replace('@c.us', '').replace('@g.us', '');
      
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: { phone: targetPhone, message }
      });

      if (error) throw error;

      toast({
        title: "הודעה נשלחה",
        description: "ההודעה נשלחה בהצלחה"
      });

      setNewMessage('');
      loadMessages();
    } catch (error) {
      toast({
        title: "שגיאה בשליחה",
        description: "לא הצלחנו לשלוח את ההודעה",
        variant: "destructive"
      });
    }
  };

  const conversations = getConversations();
  const selectedChatMessages = selectedChat 
    ? messages.filter(m => m.chat_id === selectedChat).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  const totalSentMessages = messages.filter(m => m.direction === 'outbound').length;
  const activeChats = new Set(messages.map(m => m.chat_id)).size;

  if (showChatView && selectedChat) {
    const conversation = conversations.find(c => c.id === selectedChat);
    const contactInfo = conversation ? getContactInfo(conversation.lastMessage.phone) : null;
    
    return (
      <div className="mobile-container min-h-screen bg-background">
        {/* Chat Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowChatView(false)}>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h3 className="font-semibold text-base">
                {conversation?.lastMessage.chat_type === 'group' 
                  ? conversation.lastMessage.group_name 
                  : contactInfo?.name || conversation?.lastMessage.sender_name || 'שיחה'
                }
              </h3>
              {contactInfo?.propertyAddress && (
                <p className="text-sm text-muted-foreground">{contactInfo.propertyAddress}</p>
              )}
            </div>
            <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
              {isConnected ? 'מחובר' : 'לא מחובר'}
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-3 pb-20">
          {selectedChatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.direction === 'outbound'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString('he-IL')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="הקלד הודעה..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button
              onClick={() => sendMessage(newMessage)}
              disabled={!newMessage.trim()}
              size="sm"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container space-y-4 p-4 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">מרכז WhatsApp</h1>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isConnected ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {isConnected ? 'מחובר' : 'לא מחובר'}
          </Badge>
        </div>
        <p className="text-muted-foreground">ניהול תקשורת עם בעלי נכסים</p>
      </div>

      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversations" className="text-xs">
            <MessageSquare className="h-4 w-4 ml-1" />
            שיחות
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">
            <MessageCircle className="h-4 w-4 ml-1" />
            תבניות
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs">
            <BarChart3 className="h-4 w-4 ml-1" />
            סטטיסטיקה
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <Card className="p-6 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">אין שיחות פעילות</p>
              </Card>
            ) : (
              conversations.map((conversation) => {
                const contactInfo = getContactInfo(conversation.lastMessage.phone);
                return (
                  <Card
                    key={conversation.id}
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      setSelectedChat(conversation.id);
                      setShowChatView(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">
                            {conversation.lastMessage.chat_type === 'group' 
                              ? conversation.lastMessage.group_name 
                              : contactInfo?.name || conversation.lastMessage.sender_name || conversation.lastMessage.phone
                            }
                          </h4>
                          {contactInfo && (
                            <Badge variant={contactInfo.type === 'tenant' ? 'default' : 'secondary'} className="text-xs">
                              {contactInfo.type === 'tenant' ? 'דייר' : 'בעל נכס'}
                            </Badge>
                          )}
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage.message}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conversation.lastMessage.timestamp).toLocaleString('he-IL')}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="space-y-2">
            {templates.length === 0 ? (
              <Card className="p-6 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">אין תבניות זמינות</p>
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="p-4">
                  <h4 className="font-medium mb-2">{template.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{template.content}</p>
                  <Button size="sm" variant="outline" className="w-full">
                    השתמש בתבנית
                  </Button>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalSentMessages}</div>
              <p className="text-sm text-muted-foreground">הודעות נשלחו</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{activeChats}</div>
              <p className="text-sm text-muted-foreground">שיחות פעילות</p>
            </Card>
            <Card className="p-4 text-center col-span-2">
              <div className="text-2xl font-bold text-primary">{conversations.reduce((acc, c) => acc + c.unreadCount, 0)}</div>
              <p className="text-sm text-muted-foreground">הודעות חדשות</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};