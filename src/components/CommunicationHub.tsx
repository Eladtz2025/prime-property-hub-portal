import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Send,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  tenant_id: string;
  property_id: string;
  sender_id: string;
  sender_type: 'owner' | 'tenant';
  subject?: string;
  message: string;
  communication_type: 'message' | 'email' | 'phone' | 'whatsapp';
  is_read: boolean;
  created_at: string;
  tenant?: {
    name: string;
    phone?: string;
    email?: string;
  };
  property?: {
    address: string;
    city: string;
  };
}

interface CommunicationHubProps {
  properties: any[];
  tenants: any[];
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({ properties, tenants }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [activeTab, setActiveTab] = useState('messages');
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const { toast } = useToast();

  // New message form state
  const [newMessage, setNewMessage] = useState({
    tenant_id: '',
    property_id: '',
    subject: '',
    message: '',
    communication_type: 'message' as const
  });

  const filteredMessages = selectedTenant 
    ? messages.filter(msg => msg.tenant_id === selectedTenant)
    : messages;

  const groupedMessages = filteredMessages.reduce((acc, message) => {
    const key = `${message.tenant_id}-${message.property_id}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  const handleSendMessage = () => {
    if (!newMessage.tenant_id || !newMessage.message) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    const tenant = tenants.find(t => t.id === newMessage.tenant_id);
    const property = properties.find(p => p.id === newMessage.property_id);

    const message: Message = {
      id: crypto.randomUUID(),
      ...newMessage,
      sender_id: 'current-user', // In real app, get from auth
      sender_type: 'owner',
      is_read: false,
      created_at: new Date().toISOString(),
      tenant,
      property
    };

    setMessages(prev => [message, ...prev]);
    setNewMessage({
      tenant_id: '',
      property_id: '',
      subject: '',
      message: '',
      communication_type: 'message'
    });
    setIsNewMessageOpen(false);

    toast({
      title: "הודעה נשלחה",
      description: `ההודעה נשלחה אל ${tenant?.name}`
    });
  };

  const markAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, is_read: true } : msg
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'phone': return 'bg-green-100 text-green-800';
      case 'whatsapp': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    return date.toLocaleDateString('he-IL');
  };

  // Mock quick actions
  const sendQuickMessage = (tenantId: string, type: 'reminder' | 'maintenance' | 'renewal') => {
    const templates = {
      reminder: 'תזכורת: מועד תשלום השכירות מתקרב',
      maintenance: 'עדכון לגבי עבודות התחזוקה בנכס',
      renewal: 'בקשה לדיון בחידוש החוזה'
    };

    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const message: Message = {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      property_id: tenant.property_id,
      sender_id: 'current-user',
      sender_type: 'owner',
      subject: templates[type],
      message: templates[type],
      communication_type: 'message',
      is_read: false,
      created_at: new Date().toISOString(),
      tenant,
      property: properties.find(p => p.id === tenant.property_id)
    };

    setMessages(prev => [message, ...prev]);
    toast({
      title: "הודעה נשלחה",
      description: `הודעת ${type === 'reminder' ? 'תזכורת' : type === 'maintenance' ? 'תחזוקה' : 'חידוש'} נשלחה`
    });
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{messages.length}</div>
                <div className="text-sm text-muted-foreground">סה"כ הודעות</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
                <div className="text-sm text-muted-foreground">לא נקראו</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {new Set(messages.map(m => m.tenant_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">דיירים פעילים</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {messages.filter(m => {
                    const today = new Date();
                    const msgDate = new Date(m.created_at);
                    return msgDate.toDateString() === today.toDateString();
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">היום</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages">הודעות</TabsTrigger>
          <TabsTrigger value="quick-actions">פעולות מהירות</TabsTrigger>
          <TabsTrigger value="templates">תבניות</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  התכתבויות
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="סנן לפי דייר" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">כל הדיירים</SelectItem>
                      {tenants.map(tenant => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-1" />
                        הודעה חדשה
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>הודעה חדשה</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="tenant">דייר</Label>
                            <Select value={newMessage.tenant_id} onValueChange={(value) => {
                              const tenant = tenants.find(t => t.id === value);
                              setNewMessage(prev => ({ 
                                ...prev, 
                                tenant_id: value,
                                property_id: tenant?.property_id || ''
                              }));
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="בחר דייר" />
                              </SelectTrigger>
                              <SelectContent>
                                {tenants.map(tenant => (
                                  <SelectItem key={tenant.id} value={tenant.id}>
                                    {tenant.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="type">סוג תקשורת</Label>
                            <Select value={newMessage.communication_type} onValueChange={(value: any) => 
                              setNewMessage(prev => ({ ...prev, communication_type: value }))
                            }>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="message">הודעה</SelectItem>
                                <SelectItem value="email">אימייל</SelectItem>
                                <SelectItem value="phone">טלפון</SelectItem>
                                <SelectItem value="whatsapp">וואטסאפ</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="subject">נושא</Label>
                          <Input
                            id="subject"
                            value={newMessage.subject}
                            onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="נושא ההודעה"
                          />
                        </div>

                        <div>
                          <Label htmlFor="message">הודעה</Label>
                          <Textarea
                            id="message"
                            value={newMessage.message}
                            onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="תוכן ההודעה"
                            rows={4}
                          />
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleSendMessage}>
                            <Send className="w-4 h-4 mr-1" />
                            שלח הודעה
                          </Button>
                          <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                            ביטול
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Messages List */}
          <div className="space-y-4">
            {Object.entries(groupedMessages).map(([key, msgs]) => {
              const latestMsg = msgs[0];
              return (
                <Card key={key} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{latestMsg.tenant?.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building className="w-4 h-4" />
                            {latestMsg.property?.address}, {latestMsg.property?.city}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(latestMsg.communication_type)}>
                          {getTypeIcon(latestMsg.communication_type)}
                          <span className="mr-1">{latestMsg.communication_type}</span>
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(latestMsg.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {msgs.slice(0, 3).map(message => (
                        <div 
                          key={message.id} 
                          className={`p-3 rounded-lg border ${
                            message.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            {message.subject && (
                              <h4 className="font-medium text-sm">{message.subject}</h4>
                            )}
                            <div className="flex items-center gap-2">
                              {!message.is_read && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markAsRead(message.id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{message.message}</p>
                        </div>
                      ))}
                      
                      {msgs.length > 3 && (
                        <Button variant="ghost" size="sm">
                          הצג עוד {msgs.length - 3} הודעות
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredMessages.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">אין הודעות</h3>
                  <p className="text-muted-foreground">
                    {selectedTenant 
                      ? "אין הודעות עם הדייר הנבחר"
                      : "לחץ על 'הודעה חדשה' כדי להתחיל להתכתב עם הדיירים"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quick-actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>פעולות מהירות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">שלח הודעות מהירות לדיירים</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map(tenant => (
                  <Card key={tenant.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        <span className="font-medium">{tenant.name}</span>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendQuickMessage(tenant.id, 'reminder')}
                        >
                          תזכורת תשלום
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendQuickMessage(tenant.id, 'maintenance')}
                        >
                          עדכון תחזוקה
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendQuickMessage(tenant.id, 'renewal')}
                        >
                          חידוש חוזה
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>תבניות הודעות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">תבניות מוכנות להודעות נפוצות</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">תזכורת תשלום</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    "שלום [שם הדייר], תזכורת ידידותית שמועד תשלום השכירות מתקרב. אנא דאג לתשלום עד תאריך [תאריך]. תודה!"
                  </p>
                  <Button size="sm" variant="outline">השתמש בתבנית</Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">עדכון תחזוקה</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    "שלום [שם הדייר], רצינו לעדכן אותך שביום [תאריך] יתבצעו עבודות תחזוקה בנכס. העבודה צפויה להימשך [זמן]. תודה על ההבנה."
                  </p>
                  <Button size="sm" variant="outline">השתמש בתבנית</Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">חידוש חוזה</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    "שלום [שם הדייר], החוזה עומד להסתיים ב[תאריך]. נשמח לדון על אפשרות חידוש. אנא צור קשר בזמן הקרוב."
                  </p>
                  <Button size="sm" variant="outline">השתמש בתבנית</Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">בדיקה שגרתית</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    "שלום [שם הדייר], נרצה לתאם בדיקה שגרתית של הנכס. אנא הודע על מועדים נוחים בשבוע הקרוב."
                  </p>
                  <Button size="sm" variant="outline">השתמש בתבנית</Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};