import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Activity, AlertTriangle, Database, CheckCircle, XCircle, Clock, Server } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface MonitoringLog {
  id: string;
  check_time: string;
  status: string;
  response_time_ms: number | null;
  error_message: string | null;
  alert_sent: boolean;
}

interface ErrorLog {
  id: string;
  error_time: string;
  error_message: string;
  severity: string;
  page_url: string | null;
  alert_sent: boolean;
}

interface BackupHistory {
  id: string;
  backup_date: string;
  file_name: string;
  status: string;
  file_size_kb: number | null;
  error_message: string | null;
}

export const MonitoringTab: React.FC = () => {
  const [monitoringLogs, setMonitoringLogs] = useState<MonitoringLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [monitoringRes, errorRes, backupRes] = await Promise.all([
        supabase.from('monitoring_logs').select('*').order('check_time', { ascending: false }).limit(20),
        supabase.from('error_logs').select('*').order('error_time', { ascending: false }).limit(20),
        supabase.from('backup_history').select('*').order('backup_date', { ascending: false }).limit(10)
      ]);

      if (monitoringRes.data) setMonitoringLogs(monitoringRes.data);
      if (errorRes.data) setErrorLogs(errorRes.data);
      if (backupRes.data) setBackupHistory(backupRes.data);
    } catch (error) {
      toast.error('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setCheckingHealth(true);
    try {
      const { error } = await supabase.functions.invoke('uptime-monitor');
      if (error) throw error;
      toast.success('בדיקת בריאות הושלמה');
      fetchData();
    } catch (error) {
      toast.error('שגיאה בבדיקת בריאות');
    } finally {
      setCheckingHealth(false);
    }
  };

  const createBackup = async () => {
    setCreatingBackup(true);
    try {
      const { error } = await supabase.functions.invoke('backup-database');
      if (error) throw error;
      toast.success('גיבוי נוצר בהצלחה');
      fetchData();
    } catch (error) {
      toast.error('שגיאה ביצירת גיבוי');
    } finally {
      setCreatingBackup(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'up':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 ml-1" /> תקין</Badge>;
      case 'down':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" /> נפל</Badge>;
      case 'slow':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 ml-1" /> איטי</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">קריטי</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">אזהרה</Badge>;
      case 'info':
        return <Badge variant="outline">מידע</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getBackupStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">הצליח</Badge>;
      case 'failed':
        return <Badge variant="destructive">נכשל</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">בתהליך</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const avgResponseTime = monitoringLogs.length > 0 
    ? Math.round(monitoringLogs.filter(l => l.response_time_ms).reduce((acc, l) => acc + (l.response_time_ms || 0), 0) / monitoringLogs.filter(l => l.response_time_ms).length)
    : 0;

  const uptime = monitoringLogs.length > 0
    ? Math.round((monitoringLogs.filter(l => l.status === 'up').length / monitoringLogs.length) * 100)
    : 100;

  const criticalErrors = errorLogs.filter(e => e.severity === 'critical').length;
  const todayErrors = errorLogs.filter(e => {
    const errorDate = new Date(e.error_time);
    const today = new Date();
    return errorDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Server className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">סטטוס</p>
                <p className="text-lg font-bold text-green-400">תקין</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">תגובה</p>
                <p className="text-lg font-bold">{avgResponseTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <CheckCircle className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-lg font-bold">{uptime}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">שגיאות היום</p>
                <p className="text-lg font-bold">{todayErrors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={criticalErrors > 0 ? "bg-red-500/10 border-red-500/30" : "bg-card/50 border-border/50"}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">קריטיות</p>
                <p className={`text-lg font-bold ${criticalErrors > 0 ? 'text-red-400' : ''}`}>{criticalErrors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={fetchData} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          רענן נתונים
        </Button>
        <Button onClick={runHealthCheck} disabled={checkingHealth}>
          <Activity className={`h-4 w-4 ml-2 ${checkingHealth ? 'animate-pulse' : ''}`} />
          הרץ בדיקת בריאות
        </Button>
        <Button onClick={createBackup} disabled={creatingBackup} variant="secondary">
          <Database className={`h-4 w-4 ml-2 ${creatingBackup ? 'animate-pulse' : ''}`} />
          צור גיבוי
        </Button>
      </div>

      {/* Monitoring Logs */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            לוג ניטור
          </CardTitle>
          <CardDescription>בדיקות uptime אחרונות</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>זמן</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>זמן תגובה</TableHead>
                <TableHead>התראה נשלחה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitoringLogs.slice(0, 10).map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.check_time), 'dd/MM HH:mm', { locale: he })}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>{log.response_time_ms ? `${log.response_time_ms}ms` : '-'}</TableCell>
                  <TableCell>{log.alert_sent ? <CheckCircle className="h-4 w-4 text-green-400" /> : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            לוג שגיאות
          </CardTitle>
          <CardDescription>שגיאות אחרונות במערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>זמן</TableHead>
                <TableHead>חומרה</TableHead>
                <TableHead>הודעה</TableHead>
                <TableHead>דף</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorLogs.slice(0, 10).map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.error_time), 'dd/MM HH:mm', { locale: he })}</TableCell>
                  <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.error_message}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.page_url || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            היסטוריית גיבויים
          </CardTitle>
          <CardDescription>גיבויים אחרונים של המערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>קובץ</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>גודל</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backupHistory.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell>{format(new Date(backup.backup_date), 'dd/MM/yyyy HH:mm', { locale: he })}</TableCell>
                  <TableCell className="font-mono text-sm">{backup.file_name}</TableCell>
                  <TableCell>{getBackupStatusBadge(backup.status)}</TableCell>
                  <TableCell>{backup.file_size_kb ? `${backup.file_size_kb} KB` : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
