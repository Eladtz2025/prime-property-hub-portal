import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Home,
  Settings,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export const WhatsAppAutomations: React.FC = () => {
  const { toast } = useToast();
  const [automations, setAutomations] = useState({
    leaseRenewal60Days: {
      enabled: false,
      message: `שלום {ownerName},

החוזה של הנכס ב{address} מסתיים בעוד חודשיים ({leaseEndDate}).

אשמח לתאם איתך פגישה לדבר על חידוש החוזה והתנאים לתקופה הבאה.

בברכה,
{agentName}`
    },
    leaseRenewal30Days: {
      enabled: false,
      message: `שלום {ownerName},

החוזה של הנכס ב{address} מסתיים בעוד חודש ({leaseEndDate}).

זה הזמן לחתום על החוזה החדש. השוכר מעוניין להמשיך.

מתי נוח לך לקבוע פגישה לחתימה?

בברכה,
{agentName}`
    },
    leaseRenewal14Days: {
      enabled: false,
      message: `שלום {ownerName},

🚨 דחוף! החוזה של הנכס ב{address} מסתיים בעוד שבועיים!

אנחנו חייבים לחתום על החוזה החדש השבוע.

אנא התקשר אלי בהקדם: {agentPhone}

בברכה,
{agentName}`
    },
    vacancyAlert: {
      enabled: false,
      message: `שלום {ownerName},

הנכס ב{address} התפנה.

אני כבר מתחיל לחפש שוכרים חדשים. אשמח לדבר איתך על:
• מחיר השכירות המומלץ
• שיפורים או תיקונים נדרשים
• זמינות לביקורים

מתי נוח לך לדבר?

בברכה,
{agentName}`
    }
  });

  const handleToggleAutomation = (key: string, enabled: boolean) => {
    setAutomations(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled }
    }));

    toast({
      title: enabled ? "האוטומציה הופעלה" : "האוטומציה הושבתה",
      description: getAutomationTitle(key),
    });
  };

  const getAutomationTitle = (key: string) => {
    const titles = {
      leaseRenewal60Days: "תזכורת חידוש חוזה - 60 יום",
      leaseRenewal30Days: "תזכורת חידוש חוזה - 30 יום",
      leaseRenewal14Days: "התראה דחופה - 14 יום",
      vacancyAlert: "התראה על נכס פנוי"
    };
    return titles[key] || key;
  };

  const getAutomationDescription = (key: string) => {
    const descriptions = {
      leaseRenewal60Days: "שליחת הודעה אוטומטית 60 יום לפני סיום חוזה",
      leaseRenewal30Days: "שליחת הודעה אוטומטית 30 יום לפני סיום חוזה",
      leaseRenewal14Days: "התראה דחופה 14 יום לפני סיום חוזה",
      vacancyAlert: "התראה מיידית כאשר נכס מסומן כפנוי"
    };
    return descriptions[key] || "";
  };

  const getAutomationIcon = (key: string) => {
    const icons = {
      leaseRenewal60Days: Calendar,
      leaseRenewal30Days: Clock,
      leaseRenewal14Days: AlertCircle,
      vacancyAlert: Home
    };
    const Icon = icons[key] || Zap;
    return <Icon className="h-5 w-5" />;
  };

  const activeAutomationsCount = Object.values(automations).filter(a => a.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                אוטומציות WhatsApp
              </CardTitle>
              <CardDescription className="mt-2">
                הגדר הודעות אוטומטיות שישלחו באופן אוטומטי בהתאם לאירועים בנכסים
              </CardDescription>
            </div>
            <Badge variant={activeAutomationsCount > 0 ? "default" : "secondary"} className="text-lg px-4 py-2">
              {activeAutomationsCount} פעילות
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Automation Cards */}
      <div className="grid gap-4">
        {Object.entries(automations).map(([key, automation]) => (
          <Card key={key} className={automation.enabled ? "border-primary/50 shadow-md" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${automation.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {getAutomationIcon(key)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{getAutomationTitle(key)}</CardTitle>
                    <CardDescription className="mt-1">
                      {getAutomationDescription(key)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={automation.enabled}
                    onCheckedChange={(checked) => handleToggleAutomation(key, checked)}
                  />
                  {automation.enabled && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2">תבנית ההודעה</Label>
                  <Textarea
                    value={automation.message}
                    onChange={(e) => setAutomations(prev => ({
                      ...prev,
                      [key]: { ...prev[key], message: e.target.value }
                    }))}
                    rows={8}
                    className="mt-2 font-mono text-sm"
                    disabled={!automation.enabled}
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    משתנים זמינים: {'{ownerName}'}, {'{address}'}, {'{leaseEndDate}'}, {'{agentName}'}, {'{agentPhone}'}
                  </div>
                </div>
                {automation.enabled && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      האוטומציה פעילה ותופעל אוטומטית
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">איך זה עובד?</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• המערכת בודקת אוטומטית את כל הנכסים כל יום</li>
                <li>• כאשר מתקיים תנאי (למשל 60 יום לפני סיום חוזה), ההודעה נשלחת אוטומטית</li>
                <li>• ההודעות מותאמות אישית לכל נכס עם הפרטים הרלוונטיים</li>
                <li>• ניתן לערוך את תבניות ההודעות בכל עת</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
