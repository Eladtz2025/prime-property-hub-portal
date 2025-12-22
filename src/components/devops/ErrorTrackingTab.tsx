import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Bug, ExternalLink, Copy, CheckCircle, Bell, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface ErrorLog {
  id: string;
  error_time: string;
  error_message: string;
  severity: string;
  page_url: string | null;
  error_stack: string | null;
  alert_sent: boolean;
}

export const ErrorTrackingTab: React.FC = () => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentryDsn, setSentryDsn] = useState('');

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('error_time', { ascending: false })
        .limit(50);

      if (error) throw error;
      setErrors(data || []);
    } catch (error) {
      console.error('Error fetching error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('הועתק ללוח');
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">קריטי</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">שגיאה</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">אזהרה</Badge>;
      case 'info':
        return <Badge variant="outline">מידע</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const features = [
    { icon: Bug, title: 'זיהוי שגיאות אוטומטי', description: 'כל שגיאה נתפסת ומתועדת אוטומטית' },
    { icon: Bell, title: 'התראות בזמן אמת', description: 'קבל התראה מיידית על שגיאות קריטיות' },
    { icon: Activity, title: 'Stack Trace מלא', description: 'ראה בדיוק איפה השגיאה קרתה' },
    { icon: CheckCircle, title: 'שיוך למשתמשים', description: 'דע איזה משתמש חווה את השגיאה' },
  ];

  const sentrySetupCode = `// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "${sentryDsn || 'YOUR_SENTRY_DSN'}",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Wrap your app
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
    <App />
  </Sentry.ErrorBoundary>
);`;

  const errorStats = {
    total: errors.length,
    critical: errors.filter(e => e.severity === 'critical').length,
    today: errors.filter(e => {
      const errorDate = new Date(e.error_time);
      const today = new Date();
      return errorDate.toDateString() === today.toDateString();
    }).length,
    alertsSent: errors.filter(e => e.alert_sent).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{errorStats.total}</p>
            <p className="text-sm text-muted-foreground">סה"כ שגיאות</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-red-400">{errorStats.critical}</p>
            <p className="text-sm text-muted-foreground">קריטיות</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-yellow-400">{errorStats.today}</p>
            <p className="text-sm text-muted-foreground">היום</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-400">{errorStats.alertsSent}</p>
            <p className="text-sm text-muted-foreground">התראות נשלחו</p>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <feature.icon className="h-8 w-8 text-primary mb-3" />
              <p className="font-medium text-sm">{feature.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error Logs */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                שגיאות אחרונות
              </CardTitle>
              <CardDescription>לוג שגיאות מהמערכת</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchErrors}>
              רענן
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {errors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>זמן</TableHead>
                  <TableHead>חומרה</TableHead>
                  <TableHead>הודעה</TableHead>
                  <TableHead>דף</TableHead>
                  <TableHead>התראה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.slice(0, 20).map((error) => (
                  <TableRow key={error.id}>
                    <TableCell>
                      {format(new Date(error.error_time), 'dd/MM HH:mm', { locale: he })}
                    </TableCell>
                    <TableCell>{getSeverityBadge(error.severity)}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate">{error.error_message}</p>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-muted-foreground">{error.page_url || '-'}</p>
                    </TableCell>
                    <TableCell>
                      {error.alert_sent ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <p>אין שגיאות מתועדות</p>
              <p className="text-sm mt-1">זה דבר טוב!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sentry Setup */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            הגדרת Sentry
          </CardTitle>
          <CardDescription>חבר את Sentry למעקב שגיאות מתקדם</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">1. התקן את Sentry:</p>
            <div className="flex items-center gap-2">
              <code className="bg-background px-3 py-2 rounded text-sm font-mono flex-1">
                npm install @sentry/react
              </code>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => copyToClipboard('npm install @sentry/react')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">2. הזן את ה-DSN שלך מ-Sentry:</p>
            <Input
              value={sentryDsn}
              onChange={(e) => setSentryDsn(e.target.value)}
              placeholder="https://xxxxx@sentry.io/xxxxx"
              className="font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">3. הוסף לקוד:</p>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => copyToClipboard(sentrySetupCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="bg-background/50 p-4 rounded-lg text-sm font-mono overflow-x-auto max-h-64">
              {sentrySetupCode}
            </pre>
          </div>

          <Button asChild className="w-full">
            <a href="https://sentry.io/signup" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 ml-2" />
              צור חשבון Sentry (חינם)
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* LogRocket Alternative */}
      <Card className="bg-purple-500/10 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-400">חלופה: LogRocket</CardTitle>
          <CardDescription>הקלטת סשנים מלאים לראות בדיוק מה המשתמש עשה</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
              <span>הקלטת וידאו של סשן המשתמש</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
              <span>רשת, קונסול ו-Redux בזמן אמת</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
              <span>שילוב עם Sentry לקונטקסט מלא</span>
            </li>
          </ul>
          <Button variant="outline" className="mt-4" asChild>
            <a href="https://logrocket.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 ml-2" />
              למד עוד על LogRocket
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
