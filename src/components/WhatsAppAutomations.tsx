import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Home,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Automation {
  enabled: boolean;
  message: string;
}

interface Automations {
  [key: string]: Automation;
}

export const WhatsAppAutomations: React.FC = () => {
  const { toast } = useToast();
  const [automations, setAutomations] = useState<Automations>({
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

  const getAutomationTitle = (key: string): string => {
    const titles: Record<string, string> = {
      leaseRenewal60Days: "תזכורת חידוש חוזה - 60 יום",
      leaseRenewal30Days: "תזכורת חידוש חוזה - 30 יום",
      leaseRenewal14Days: "התראה דחופה - 14 יום",
      vacancyAlert: "התראה על נכס פנוי"
    };
    return titles[key] || key;
  };

  const getAutomationDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      leaseRenewal60Days: "שליחת הודעה אוטומטית 60 יום לפני סיום חוזה",
      leaseRenewal30Days: "שליחת הודעה אוטומטית 30 יום לפני סיום חוזה",
      leaseRenewal14Days: "התראה דחופה 14 יום לפני סיום חוזה",
      vacancyAlert: "התראה מיידית כאשר נכס מסומן כפנוי"
    };
    return descriptions[key] || "";
  };

  const activeAutomationsCount = Object.values(automations).filter(a => a.enabled).length;

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Zap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                אוטומציות WhatsApp
              </CardTitle>
              <CardDescription className="mt-2 text-sm">
                הגדר הודעות אוטומטיות שישלחו באופן אוטומטי בהתאם לאירועים בנכסים
              </CardDescription>
            </div>
            <Badge variant={activeAutomationsCount > 0 ? "default" : "secondary"} className="text-base md:text-lg px-3 md:px-4 py-1.5 md:py-2">
              {activeAutomationsCount} פעילות
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Automation Cards */}
      <div className="grid gap-3 md:gap-4">
        {/* Lease Renewal 60 Days */}
        <Card className={automations.leaseRenewal60Days.enabled ? "border-primary/50 shadow-md" : ""}>
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-0">
              <div className="flex items-start gap-2 md:gap-3 w-full md:w-auto">
                <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${automations.leaseRenewal60Days.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base md:text-lg">{getAutomationTitle('leaseRenewal60Days')}</CardTitle>
                  <CardDescription className="mt-1 text-xs md:text-sm">
                    {getAutomationDescription('leaseRenewal60Days')}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto">
                <Switch
                  checked={automations.leaseRenewal60Days.enabled}
                  onCheckedChange={(checked) => handleToggleAutomation('leaseRenewal60Days', checked)}
                />
                {automations.leaseRenewal60Days.enabled && (
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-3 md:space-y-4">
              <div>
                <Label className="text-xs md:text-sm font-medium mb-2">תבנית ההודעה</Label>
                <Textarea
                  value={automations.leaseRenewal60Days.message}
                  onChange={(e) => setAutomations(prev => ({
                    ...prev,
                    leaseRenewal60Days: { ...prev.leaseRenewal60Days, message: e.target.value }
                  }))}
                  rows={6}
                  className="mt-2 font-mono text-xs md:text-sm"
                  disabled={!automations.leaseRenewal60Days.enabled}
                />
                <div className="mt-2 text-[10px] md:text-xs text-muted-foreground">
                  משתנים זמינים: {'{ownerName}'}, {'{address}'}, {'{leaseEndDate}'}, {'{agentName}'}, {'{agentPhone}'}
                </div>
              </div>
              {automations.leaseRenewal60Days.enabled && (
                <div className="flex items-center gap-2 p-2 md:p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-xs md:text-sm text-green-700 dark:text-green-300">
                    האוטומציה פעילה ותופעל אוטומטית
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lease Renewal 30 Days */}
        <Card className={automations.leaseRenewal30Days.enabled ? "border-primary/50 shadow-md" : ""}>
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-0">
              <div className="flex items-start gap-2 md:gap-3 w-full md:w-auto">
                <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${automations.leaseRenewal30Days.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Clock className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base md:text-lg">{getAutomationTitle('leaseRenewal30Days')}</CardTitle>
                  <CardDescription className="mt-1 text-xs md:text-sm">
                    {getAutomationDescription('leaseRenewal30Days')}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto">
                <Switch
                  checked={automations.leaseRenewal30Days.enabled}
                  onCheckedChange={(checked) => handleToggleAutomation('leaseRenewal30Days', checked)}
                />
                {automations.leaseRenewal30Days.enabled && (
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-3 md:space-y-4">
              <div>
                <Label className="text-xs md:text-sm font-medium mb-2">תבנית ההודעה</Label>
                <Textarea
                  value={automations.leaseRenewal30Days.message}
                  onChange={(e) => setAutomations(prev => ({
                    ...prev,
                    leaseRenewal30Days: { ...prev.leaseRenewal30Days, message: e.target.value }
                  }))}
                  rows={6}
                  className="mt-2 font-mono text-xs md:text-sm"
                  disabled={!automations.leaseRenewal30Days.enabled}
                />
                <div className="mt-2 text-[10px] md:text-xs text-muted-foreground">
                  משתנים זמינים: {'{ownerName}'}, {'{address}'}, {'{leaseEndDate}'}, {'{agentName}'}, {'{agentPhone}'}
                </div>
              </div>
              {automations.leaseRenewal30Days.enabled && (
                <div className="flex items-center gap-2 p-2 md:p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-xs md:text-sm text-green-700 dark:text-green-300">
                    האוטומציה פעילה ותופעל אוטומטית
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lease Renewal 14 Days */}
        <Card className={automations.leaseRenewal14Days.enabled ? "border-primary/50 shadow-md" : ""}>
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-0">
              <div className="flex items-start gap-2 md:gap-3 w-full md:w-auto">
                <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${automations.leaseRenewal14Days.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base md:text-lg">{getAutomationTitle('leaseRenewal14Days')}</CardTitle>
                  <CardDescription className="mt-1 text-xs md:text-sm">
                    {getAutomationDescription('leaseRenewal14Days')}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto">
                <Switch
                  checked={automations.leaseRenewal14Days.enabled}
                  onCheckedChange={(checked) => handleToggleAutomation('leaseRenewal14Days', checked)}
                />
                {automations.leaseRenewal14Days.enabled && (
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-3 md:space-y-4">
              <div>
                <Label className="text-xs md:text-sm font-medium mb-2">תבנית ההודעה</Label>
                <Textarea
                  value={automations.leaseRenewal14Days.message}
                  onChange={(e) => setAutomations(prev => ({
                    ...prev,
                    leaseRenewal14Days: { ...prev.leaseRenewal14Days, message: e.target.value }
                  }))}
                  rows={6}
                  className="mt-2 font-mono text-xs md:text-sm"
                  disabled={!automations.leaseRenewal14Days.enabled}
                />
                <div className="mt-2 text-[10px] md:text-xs text-muted-foreground">
                  משתנים זמינים: {'{ownerName}'}, {'{address}'}, {'{leaseEndDate}'}, {'{agentName}'}, {'{agentPhone}'}
                </div>
              </div>
              {automations.leaseRenewal14Days.enabled && (
                <div className="flex items-center gap-2 p-2 md:p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-xs md:text-sm text-green-700 dark:text-green-300">
                    האוטומציה פעילה ותופעל אוטומטית
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vacancy Alert */}
        <Card className={automations.vacancyAlert.enabled ? "border-primary/50 shadow-md" : ""}>
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-0">
              <div className="flex items-start gap-2 md:gap-3 w-full md:w-auto">
                <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${automations.vacancyAlert.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Home className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base md:text-lg">{getAutomationTitle('vacancyAlert')}</CardTitle>
                  <CardDescription className="mt-1 text-xs md:text-sm">
                    {getAutomationDescription('vacancyAlert')}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto">
                <Switch
                  checked={automations.vacancyAlert.enabled}
                  onCheckedChange={(checked) => handleToggleAutomation('vacancyAlert', checked)}
                />
                {automations.vacancyAlert.enabled && (
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-3 md:space-y-4">
              <div>
                <Label className="text-xs md:text-sm font-medium mb-2">תבנית ההודעה</Label>
                <Textarea
                  value={automations.vacancyAlert.message}
                  onChange={(e) => setAutomations(prev => ({
                    ...prev,
                    vacancyAlert: { ...prev.vacancyAlert, message: e.target.value }
                  }))}
                  rows={6}
                  className="mt-2 font-mono text-xs md:text-sm"
                  disabled={!automations.vacancyAlert.enabled}
                />
                <div className="mt-2 text-[10px] md:text-xs text-muted-foreground">
                  משתנים זמינים: {'{ownerName}'}, {'{address}'}, {'{leaseEndDate}'}, {'{agentName}'}, {'{agentPhone}'}
                </div>
              </div>
              {automations.vacancyAlert.enabled && (
                <div className="flex items-center gap-2 p-2 md:p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-xs md:text-sm text-green-700 dark:text-green-300">
                    האוטומציה פעילה ותופעל אוטומטית
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
          <div className="flex items-start gap-2 md:gap-3">
            <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm md:text-base text-blue-900 dark:text-blue-100">איך זה עובד?</h4>
              <ul className="text-xs md:text-sm text-blue-800 dark:text-blue-200 space-y-1">
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
