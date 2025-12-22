import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, 
  Server, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  RefreshCw,
  Database,
  Bell,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

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
  file_size_kb: number | null;
  status: string;
  tables_backed_up: string[] | null;
}

export default function AdminMonitoring() {
  const [monitoringLogs, setMonitoringLogs] = useState<MonitoringLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [monitoringRes, errorRes, backupRes] = await Promise.all([
        supabase.from('monitoring_logs').select('*').order('check_time', { ascending: false }).limit(10),
        supabase.from('error_logs').select('*').order('error_time', { ascending: false }).limit(10),
        supabase.from('backup_history').select('*').order('backup_date', { ascending: false }).limit(10),
      ]);

      if (monitoringRes.data) setMonitoringLogs(monitoringRes.data);
      if (errorRes.data) setErrorLogs(errorRes.data);
      if (backupRes.data) setBackupHistory(backupRes.data as BackupHistory[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('שגיאה בטעינת הנתונים');
    }
    setIsLoading(false);
  };

  const runHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const { data, error } = await supabase.functions.invoke('uptime-monitor');
      if (error) throw error;
      toast.success('בדיקת בריאות הושלמה');
      fetchData();
    } catch (error) {
      console.error('Health check error:', error);
      toast.error('שגיאה בבדיקת בריאות');
    }
    setIsCheckingHealth(false);
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-database');
      if (error) throw error;
      toast.success('הגיבוי נוצר בהצלחה');
      fetchData();
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('שגיאה ביצירת הגיבוי');
    }
    setIsCreatingBackup(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'up':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">פעיל 🟢</Badge>;
      case 'down':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">לא פעיל 🔴</Badge>;
      case 'slow':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">איטי 🟡</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">קריטי</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">אזהרה</Badge>;
      case 'info':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">מידע</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getBackupStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">הצליח</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">נכשל</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">בביצוע</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate stats
  const latestStatus = monitoringLogs[0]?.status || 'unknown';
  const avgResponseTime = monitoringLogs.length > 0
    ? Math.round(monitoringLogs.reduce((acc, log) => acc + (log.response_time_ms || 0), 0) / monitoringLogs.length)
    : 0;
  const uptime = monitoringLogs.length > 0
    ? Math.round((monitoringLogs.filter(log => log.status === 'up').length / monitoringLogs.length) * 100)
    : 100;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ניטור מערכת</h1>
          <p className="text-muted-foreground">מעקב אחר ביצועי המערכת וזמינותה</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            רענן
          </Button>
          <Button onClick={runHealthCheck} disabled={isCheckingHealth}>
            {isCheckingHealth ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 ml-2" />
            )}
            בדוק עכשיו
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סטטוס מערכת</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {latestStatus === 'up' ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-green-500">פעיל</span>
                </>
              ) : latestStatus === 'down' ? (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  <span className="text-red-500">לא פעיל</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  <span className="text-yellow-500">איטי</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">זמן תגובה ממוצע</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime} ms</div>
            <p className="text-xs text-muted-foreground">
              {avgResponseTime < 200 ? 'מצוין' : avgResponseTime < 500 ? 'טוב' : avgResponseTime < 1000 ? 'סביר' : 'דורש שיפור'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">זמינות (Uptime)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uptime}%</div>
            <p className="text-xs text-muted-foreground">
              {uptime >= 99 ? 'מצוין' : uptime >= 95 ? 'טוב' : 'דורש שיפור'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            היסטוריית בדיקות
          </CardTitle>
          <CardDescription>3 הבדיקות האחרונות</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">תאריך</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">זמן תגובה</TableHead>
                <TableHead className="text-right">הערות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitoringLogs.slice(0, 3).map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.check_time), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>{log.response_time_ms || '-'} ms</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.error_message || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {monitoringLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    אין בדיקות עדיין
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            שגיאות אחרונות
          </CardTitle>
          <CardDescription>10 השגיאות האחרונות</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">זמן</TableHead>
                <TableHead className="text-right">חומרה</TableHead>
                <TableHead className="text-right">הודעה</TableHead>
                <TableHead className="text-right">דף</TableHead>
                <TableHead className="text-right">התראה נשלחה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.error_time), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </TableCell>
                  <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.error_message}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.page_url || '-'}</TableCell>
                  <TableCell>
                    {log.alert_sent ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {errorLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    אין שגיאות 🎉
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              גיבויים
            </CardTitle>
            <CardDescription>היסטוריית גיבויים</CardDescription>
          </div>
          <Button onClick={createBackup} disabled={isCreatingBackup}>
            {isCreatingBackup ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 ml-2" />
            )}
            צור גיבוי עכשיו
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">תאריך</TableHead>
                <TableHead className="text-right">שם קובץ</TableHead>
                <TableHead className="text-right">גודל</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">טבלאות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backupHistory.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell>
                    {format(new Date(backup.backup_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{backup.file_name}</TableCell>
                  <TableCell>{backup.file_size_kb ? `${backup.file_size_kb} KB` : '-'}</TableCell>
                  <TableCell>{getBackupStatusBadge(backup.status)}</TableCell>
                  <TableCell>{backup.tables_backed_up?.length || 0} טבלאות</TableCell>
                </TableRow>
              ))}
              {backupHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    אין גיבויים עדיין
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
