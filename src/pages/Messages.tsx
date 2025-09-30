import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Copy, Clock, Users, Phone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export const Messages: React.FC = () => {
  const [messageType, setMessageType] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
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
    },
    lease_renewal_1month: {
      title: 'חידוש חוזה - חודש מראש',
      message: `שלום {ownerName},

החוזה של הנכס ב{address} מסתיים ב-{leaseEndDate}.

זה הזמן לחתום על החוזה החדש. השוכר {tenantName} מעוניין להמשיך.

מתי נוח לך לקבוע פגישה לחתימה?

בברכה,
{agentName}`
    },
    lease_renewal_urgent: {
      title: 'חידוש חוזה - דחוף!',
      message: `שלום {ownerName},

החוזה של הנכס ב{address} מסתיים בעוד שבועיים!

אנחנו חייבים לחתום על החוזה החדש השבוע.

אנא התקשר אלי בהקדם: {agentPhone}

בברכה,
{agentName}`
    },
    vacancy_notification: {
      title: 'הודעה על נכס פנוי',
      message: `שלום {ownerName},

הנכס ב{address} התפנה היום.

אני כבר מתחיל לחפש שוכרים חדשים. אשמח לדבר איתך על:
- מחיר השכירות המומלץ
- שיפורים או תיקונים נדרשים
- זמינות לביקורים

מתי נוח לך לדבר?

בברכה,
{agentName}`
    },
    rent_increase: {
      title: 'עדכון שכירות',
      message: `שלום {ownerName},

אני רוצה לדבר איתך על שכירות הנכס ב{address}.

לאור המצב בשוק, אני חושב שאפשר להעלות את השכירות ל-{suggestedRent}₪ (במקום {currentRent}₪).

מה דעתך? נדבר על זה?

בברכה,
{agentName}`
    },
    tenant_appreciation: {
      title: 'הודעת הערכה לשוכר',
      message: `שלום {tenantName},

רציתי להודות לך על היחס הטוב לנכס ב{address}.

אתה שוכר מצוין ואני מעריך את הסדר והאחריות שלך.

אם יש לך שאלות או בעיות, אני תמיד זמין.

בברכה,
{agentName}`
    },
    maintenance_followup: {
      title: 'מעקב תחזוקה',
      message: `שלום {ownerName},

רציתי לעדכן אותך על התחזוקה בנכס ב{address}.

העבודות מתקדמות כמתוכנן ואנחנו צפויים לסיים {expectedCompletion}.

אעדכן אותך ברגע שהכל יהיה מוכן.

בברכה,
{agentName}`
    }
  };

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({
      title: "הועתק!",
      description: "ההודעה הועתקה ללוח",
    });
  };

  const handleSendWhatsApp = (message: string) => {
    const phoneNumber = "972501234567"; // Replace with actual number
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const generatePersonalizedMessage = (template: any) => {
    // This would normally use real data from selected property
    const sampleData = {
      ownerName: "דוד כהן",
      tenantName: "משה לוי",
      address: "בן יהודה 107, תל אביב",
      leaseEndDate: "15/03/2024",
      agentName: "שם הסוכן",
      agentPhone: "050-123-4567",
      currentRent: "8,500",
      suggestedRent: "9,200",
      expectedCompletion: "בתוך שבועיים"
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
        <h2 className="text-3xl font-bold text-foreground">מחולל הודעות</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          תבניות הודעות מוכנות לכל מצב
        </div>
      </div>

      {/* Quick Actions */}
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
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  שלח SMS
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
    </div>
  );
};