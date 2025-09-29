import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Clock, Users, Settings, Phone, CheckCircle, AlertCircle, Filter, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRelevantPhoneNumbers } from '@/hooks/useRelevantPhoneNumbers';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';
import { AddNewContactDialog } from './AddNewContactDialog';
import { MessageTemplateDialog } from './MessageTemplateDialog';

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

export const WhatsAppHub: React.FC = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chatTypeFilter, setChatTypeFilter] = useState<'all' | 'individual' | 'group'>('all');
  const [apiSourceFilter, setApiSourceFilter] = useState<'all' | 'meta' | 'green-api'>('all');
  const [showRelevantOnly, setShowRelevantOnly] = useState(true);
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const { toast } = useToast();
  
  const { isRelevantPhone, getContactInfo, addNewContact, isLoading: phonesLoading } = useRelevantPhoneNumbers();
  const { templates, createTemplate, updateTemplate, deleteTemplate, isCreating, isDeleting } = useMessageTemplates();

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
    
    // Filter by chat type
    if (chatTypeFilter !== 'all') {
      filteredMessages = filteredMessages.filter(m => m.chat_type === chatTypeFilter);
    }
    
    // Filter by API source
    if (apiSourceFilter !== 'all') {
      filteredMessages = filteredMessages.filter(m => m.api_source === apiSourceFilter);
    }
    
    // Filter by relevance to property management
    if (showRelevantOnly && !phonesLoading) {
      filteredMessages = filteredMessages.filter(m => {
        // For group chats, check if it's a relevant business group
        if (m.chat_type === 'group') {
          const groupName = m.group_name?.toLowerCase() || '';
          // Filter out personal groups like "Dreamgirls" - only keep business-related groups
          const businessKeywords = ['נכס', 'דירה', 'שכירות', 'דיור', 'השכרה', 'בית', 'דירות'];
          return businessKeywords.some(keyword => groupName.includes(keyword));
        }
        
        // For individual chats, check if the phone number is relevant
        return isRelevantPhone(m.phone);
      });
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
      // Try Green-API status first since that's what's currently working
      const { data, error } = await supabase.functions.invoke('whatsapp-status-greenapi');
      if (error) throw error;
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error);
      setIsConnected(false);
    }
  };

  const handleNewMessage = () => {
    setNewContactPhone('');
    setShowAddContactDialog(true);
  };

  const handleContactAdded = (contact: { phone: string; name: string; type: 'tenant' | 'owner'; propertyId?: string }) => {
    if (contact.type === 'owner') {
      addNewContact({
        phone: contact.phone,
        name: contact.name,
        type: contact.type,
        propertyAddress: ''
      });
    }
    
    // Refresh messages to get updated contact info
    loadMessages();
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
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // For now, send the template as-is. Later we'll add property data substitution
    await sendMessage(template.content);
  };

  const handleCreateTemplate = (template: any) => {
    createTemplate(template);
    setShowTemplateDialog(false);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setShowTemplateDialog(true);
  };

  const handleUpdateTemplate = (updates: any) => {
    if (editingTemplate) {
      updateTemplate({ id: editingTemplate.id, ...updates });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את התבנית?')) {
      deleteTemplate(templateId);
    }
  };

  useEffect(() => {
    checkWhatsAppConnection();
  }, []);

  const conversations = getConversations();
  const selectedChatMessages = getSelectedChatMessages();

  // Calculate real analytics
  const totalSentMessages = messages.filter(m => m.direction === 'outbound').length;
  const activeChats = new Set(messages.map(m => m.chat_id)).size;
  const inboundCount = messages.filter(m => m.direction === 'inbound').length;
  const outboundCount = messages.filter(m => m.direction === 'outbound').length;
  const responseRate = outboundCount > 0 ? Math.round((inboundCount / outboundCount) * 100) : 0;

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
          <Button variant="outline" onClick={handleNewMessage}>
            <UserPlus className="h-4 w-4 ml-2" />
            הודעה חדשה
          </Button>
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
            <div className="flex gap-4 flex-wrap">
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
              <Button 
                variant={showRelevantOnly ? "default" : "outline"}
                onClick={() => setShowRelevantOnly(!showRelevantOnly)}
              >
                <Filter className="h-4 w-4 ml-2" />
                {showRelevantOnly ? 'רק שיחות רלוונטיות' : 'כל השיחות'}
              </Button>
              <Button variant="outline" onClick={loadMessages}>
                <Filter className="h-4 w-4 ml-2" />
                רענן
              </Button>
            </div>
            {showRelevantOnly && !phonesLoading && (
              <p className="text-sm text-muted-foreground">
                מציג רק שיחות עם דיירים ובעלי נכסים ברשימת הקשר
              </p>
            )}
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
                  conversations.map((conversation) => {
                    const contactInfo = getContactInfo(conversation.lastMessage.phone);
                    return (
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
                              <Badge variant="outline" className="text-xs">
                                {conversation.lastMessage.chat_type === 'group' ? 'קבוצה' : 'יחיד'}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {conversation.lastMessage.api_source}
                              </Badge>
                            </div>
                            {contactInfo?.propertyAddress && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {contactInfo.propertyAddress}
                              </p>
                            )}
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
                    );
                  })
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>תבניות הודעות</CardTitle>
                    <CardDescription>
                      תבניות מוכנות לשליחה מהירה
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowTemplateDialog(true)}>
                    <Settings className="h-4 w-4 ml-2" />
                    תבנית חדשה
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {templates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">אין תבניות. צור תבנית חדשה!</p>
                ) : (
                  templates.map((template) => (
                    <div key={template.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{template.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            ערוך
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={isDeleting}
                          >
                            מחק
                          </Button>
                        </div>
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
                  ))
                )}
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
                    {templates.map((template) => (
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
                  onClick={() => sendMessage(newMessage || templates.find(t => t.id === selectedTemplate)?.content || '', phoneNumber)}
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
                <div className="text-2xl font-bold">{totalSentMessages}</div>
                <p className="text-xs text-muted-foreground">סה"כ</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">שיחות פעילות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeChats}</div>
                <p className="text-xs text-muted-foreground">סה"כ שיחות</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">אחוז מענה</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{responseRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {inboundCount} נכנס / {outboundCount} יוצא
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AddNewContactDialog
        open={showAddContactDialog}
        onOpenChange={setShowAddContactDialog}
        initialPhone={newContactPhone}
        onContactAdded={handleContactAdded}
      />

      <MessageTemplateDialog
        isOpen={showTemplateDialog}
        onClose={() => {
          setShowTemplateDialog(false);
          setEditingTemplate(null);
        }}
        onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        template={editingTemplate}
        isLoading={isCreating}
      />
    </div>
  );
};