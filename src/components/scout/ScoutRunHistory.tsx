import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ScoutRun {
  id: string;
  config_id: string | null;
  source: string;
  status: string;
  properties_found: number;
  new_properties: number;
  leads_matched: number;
  whatsapp_sent: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  scout_configs?: {
    name: string;
  } | null;
}

export const ScoutRunHistory: React.FC = () => {
  const { data: runs, isLoading } = useQuery({
    queryKey: ['scout-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select(`
          *,
          scout_configs (
            name
          )
        `)
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ScoutRun[];
    },
    refetchInterval: 10000 // Refresh every 10 seconds for running jobs
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">הושלם</Badge>;
      case 'failed':
        return <Badge variant="destructive">נכשל</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">רץ...</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const calculateDuration = (started: string, completed: string | null) => {
    if (!completed) return 'עדיין רץ...';
    const start = new Date(started);
    const end = new Date(completed);
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs} שניות`;
    const diffMins = Math.round(diffSecs / 60);
    return `${diffMins} דקות`;
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>היסטוריית ריצות ({runs?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">סטטוס</TableHead>
                <TableHead>הגדרה</TableHead>
                <TableHead className="w-[100px]">מקור</TableHead>
                <TableHead className="w-[100px]">נמצאו</TableHead>
                <TableHead className="w-[80px]">חדשות</TableHead>
                <TableHead className="w-[100px]">התאמות</TableHead>
                <TableHead className="w-[80px]">WhatsApp</TableHead>
                <TableHead className="w-[120px]">התחלה</TableHead>
                <TableHead className="w-[100px]">משך</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs?.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {run.scout_configs?.name || 'ריצה ידנית'}
                      </p>
                      {run.error_message && (
                        <p className="text-xs text-red-500 truncate max-w-[200px]">
                          {run.error_message}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{run.source}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {run.properties_found || 0}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {run.new_properties || 0}
                  </TableCell>
                  <TableCell>
                    {run.leads_matched || 0}
                  </TableCell>
                  <TableCell>
                    {run.whatsapp_sent || 0}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(run.started_at), 'dd/MM HH:mm', { locale: he })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {calculateDuration(run.started_at, run.completed_at)}
                  </TableCell>
                </TableRow>
              ))}

              {(!runs || runs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    אין היסטוריית ריצות
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
