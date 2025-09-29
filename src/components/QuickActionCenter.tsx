import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Phone, 
  AlertTriangle,
  Bell,
  Clock
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AlertCard } from "./AlertCard";
import { Alert } from '../types/property';

interface QuickActionCenterProps {
  alerts?: Alert[];
}

export const QuickActionCenter: React.FC<QuickActionCenterProps> = ({ alerts = [] }) => {
  const [quickMessage, setQuickMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const { toast } = useToast();

  const quickTemplates = {
    first_contact: {
      title: 'יצירת קשר ראשון',
      message: 'שלום {שם}, אני מנהל הנכס ברחוב {כתובת}. אשמח ליצור קשר לצורך תיאום בנוגע לנכס.'
    },
    lease_renewal: {
      title: 'חידוש חוזה',
      message: 'שלום {שם}, החוזה ב-{כתובת} מסתיים ב-{חוזה}. אשמח לתיאום פגישה לבדיקת חידוש החוזה.'
    },
    maintenance_check: {
      title: 'בדיקת תחזוקה',
      message: 'שלום {שם}, רציתי לבדוק איך מתקדמת התחזוקה בנכס ב-{כתובת}. אשמח לעדכון.'
    }
  };

  const urgentAlerts = alerts.filter(alert => alert.priority === 'urgent').slice(0, 3);

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({
      title: "הועתק!",
      description: "ההודעה הועתקה ללוח",
    });
  };

  const handleSendQuickMessage = () => {
    if (!quickMessage.trim()) return;
    
    const phoneNumber = "972501234567";
    const encodedMessage = encodeURIComponent(quickMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    setQuickMessage('');
    toast({
      title: "הודעה נשלחה!",
      description: "ההודעה נפתחה בווטסאפ",
    });
  };

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    setQuickMessage(quickTemplates[templateKey as keyof typeof quickTemplates].message);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            פעולות מהירות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Message Templates */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">תבניות מהירות:</div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(quickTemplates).map(([key, template]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateSelect(key)}
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">{template.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{template.message.substring(0, 50)}...</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Message Composer */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">הודעה מהירה:</div>
            <Textarea
              placeholder="כתב הודעה מהירה..."
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleCopyMessage(quickMessage)}
                disabled={!quickMessage.trim()}
              >
                <Copy className="h-4 w-4 mr-2" />
                העתק
              </Button>
              <Button
                size="sm"
                onClick={handleSendQuickMessage}
                disabled={!quickMessage.trim()}
              >
                <Phone className="h-4 w-4 mr-2" />
                שלח
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Urgent Actions Required */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            דרושה פעולה מיידית
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {urgentAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">אין התראות דחופות כרגע</p>
              <p className="text-xs text-muted-foreground mt-1">כל הנכסים תקינים</p>
            </div>
          ) : (
            <>
              {urgentAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
              {alerts.filter(alert => alert.priority === 'urgent').length > 3 && (
                <Button variant="outline" size="sm" className="w-full">
                  עוד {alerts.filter(alert => alert.priority === 'urgent').length - 3} התראות דחופות
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};