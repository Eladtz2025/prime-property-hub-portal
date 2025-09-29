import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Clock, 
  Users, 
  Phone, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Bell,
  Filter
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AlertCard } from "@/components/AlertCard";

export const Messages: React.FC = () => {
  const [messageType, setMessageType] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const { toast } = useToast();

  const messageTemplates = {
    lease_renewal_2months: {
      title: 'חידוש חוזה - 2 חודשים מראש',
      message: `שלום {ownerName},

אני מתקשר אליך בנוגע לנכס ב{address}.

החוזה הנוכחי מסתיים ב-{leaseEndDate}, ואני רוצה לוודא שנתחיל להכין את החידוש בזמן.

האם תרצה לקבוע פגישה השבוע לדבר על התנאים לתקופה הבאה?

אני זמין לכל שאלה.

בברכה,
{agentName}`
    }
  };

  // Mock alerts data
  const mockAlerts = [
    {
      id: '1',
      type: 'lease_expiry' as const,
      priority: 'urgent' as const,
      message: 'חוזה שכירות מסתיים בעוד 30 יום',
      propertyAddress: 'רחוב הרצל 25, תל אביב',
      ownerName: 'יעקב כהן',
      tenantName: 'משה לוי',
      dueDate: '2024-03-15',
      createdAt: '2024-02-14'
    },
    {
      id: '2',
      type: 'maintenance' as const,
      priority: 'high' as const,
      message: 'נדרשת תחזוקה לדירה - דיווח מהשוכר',
      propertyAddress: 'שד׳ רוטשילד 45, תל אביב',
      ownerName: 'רחל לוי',
      tenantName: 'דוד אברהם',
      dueDate: '2024-02-20',
      createdAt: '2024-02-13'
    }
  ];

  const filteredAlerts = mockAlerts.filter(alert => {
    if (alertFilter === 'all') return true;
    if (alertFilter === 'urgent') return alert.priority === 'urgent';
    return true;
  });

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({
      title: "הועתק!",
      description: "ההודעה הועתקה ללוח",
    });
  };

  const handleSendWhatsApp = (message: string) => {
    const phoneNumber = "972501234567";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const generatePersonalizedMessage = (template: any) => {
    const sampleData = {
      ownerName: "דוד כהן",
      address: "בן יהודה 107, תל אביב",
      leaseEndDate: "15/03/2024",
      agentName: "שם הסוכן"
    };

    let personalizedMessage = template.message;
    Object.entries(sampleData).forEach(([key, value]) => {
      personalizedMessage = personalizedMessage.replace(
        new RegExp(`\\{${key}\\}`, 'g'),
        value as string
      );
    });

    return personalizedMessage;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">התראות והודעות</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          ניהול התראות ותבניות הודעות
        </div>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            התראות
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            הודעות
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="alerts" className="space-y-4">
          {/* Alert Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">התראות דחופות</p>
                    <p className="text-2xl font-bold text-red-700">
                      {mockAlerts.filter(a => a.priority === 'urgent').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">התראות גבוהות</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {mockAlerts.filter(a => a.priority === 'high').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">לא נקראו</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {mockAlerts.length}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>רשימת התראות</CardTitle>
                <Select value={alertFilter} onValueChange={setAlertFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל ההתראות</SelectItem>
                    <SelectItem value="urgent">דחופות בלבד</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {/* Message Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">חידושי חוזים</p>
                    <p className="text-2xl font-bold text-blue-700">12</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">הודעות שנשלחו היום</p>
                    <p className="text-2xl font-bold text-green-700">7</p>
                  </div>
                  <Send className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">אנשי קשר פעילים</p>
                    <p className="text-2xl font-bold text-purple-700">45</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Templates */}
          <Card>
            <CardHeader>
              <CardTitle>תבניות הודעות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג הודעה" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(messageTemplates).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {messageType && (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      {messageTemplates[messageType as keyof typeof messageTemplates].title}
                    </h4>
                    <div className="whitespace-pre-wrap text-sm">
                      {generatePersonalizedMessage(messageTemplates[messageType as keyof typeof messageTemplates])}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => handleCopyMessage(generatePersonalizedMessage(messageTemplates[messageType as keyof typeof messageTemplates]))}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      העתק
                    </Button>
                    <Button
                      onClick={() => handleSendWhatsApp(generatePersonalizedMessage(messageTemplates[messageType as keyof typeof messageTemplates]))}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      שלח ווטסאפ
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Message */}
          <Card>
            <CardHeader>
              <CardTitle>הודעה מותאמת אישית</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="כתב הודעה מותאמת אישית..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
              />
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => handleCopyMessage(customMessage)}
                  disabled={!customMessage}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  העתק
                </Button>
                <Button
                  onClick={() => handleSendWhatsApp(customMessage)}
                  disabled={!customMessage}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  שלח ווטסאפ
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Message History */}
          <Card>
            <CardHeader>
              <CardTitle>הודעות אחרונות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: "היום 14:30", to: "דוד כהן", message: "חידוש חוזה - חודש מראש", status: "נשלח" },
                  { time: "היום 11:15", to: "רחל לוי", message: "הודעה על נכס פנוי", status: "נקרא" },
                  { time: "אתמול 16:45", to: "משה אברהם", message: "מעקב תחזוקה", status: "נשלח" },
                ].map((msg, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">{msg.message}</div>
                        <div className="text-sm text-muted-foreground">אל: {msg.to}</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{msg.time}</div>
                      <Badge variant="outline" className="text-xs">
                        {msg.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};