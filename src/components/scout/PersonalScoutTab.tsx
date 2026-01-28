import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Play, Clock, CheckCircle2, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { PersonalScoutMatchesDialog } from './PersonalScoutMatchesDialog';

interface LeadWithMatches {
  id: string;
  name: string;
  preferred_cities: string[] | null;
  preferred_neighborhoods: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  rooms_min: number | null;
  rooms_max: number | null;
  property_type: string | null;
  match_count: number;
  matches_by_source: Record<string, number>;
}

export const PersonalScoutTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<LeadWithMatches | null>(null);

  // Fetch eligible leads count
  const { data: eligibleLeads = [] } = useQuery({
    queryKey: ['personal-scout-eligible-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_leads')
        .select('id, name, preferred_cities, preferred_neighborhoods, budget_min, budget_max, rooms_min, rooms_max, property_type')
        .eq('is_hidden', false)
        .not('preferred_cities', 'is', null);
      
      if (error) throw error;
      
      // Filter to leads with minimal preferences
      return (data || []).filter(lead => 
        lead.preferred_cities?.length > 0 && 
        (lead.budget_min || lead.budget_max || lead.rooms_min || lead.rooms_max || lead.preferred_neighborhoods?.length)
      );
    }
  });

  // Fetch last run
  const { data: lastRun } = useQuery({
    queryKey: ['personal-scout-last-run'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_scout_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Fetch matches grouped by lead
  const { data: leadsWithMatches = [], isLoading: isLoadingMatches } = useQuery({
    queryKey: ['personal-scout-leads-with-matches'],
    queryFn: async () => {
      // Get all matches
      const { data: matches, error: matchesError } = await supabase
        .from('personal_scout_matches')
        .select('lead_id, source');
      
      if (matchesError) throw matchesError;

      // Group by lead
      const leadMatchMap = new Map<string, { count: number; bySource: Record<string, number> }>();
      
      for (const match of matches || []) {
        if (!match.lead_id) continue;
        
        if (!leadMatchMap.has(match.lead_id)) {
          leadMatchMap.set(match.lead_id, { count: 0, bySource: {} });
        }
        
        const entry = leadMatchMap.get(match.lead_id)!;
        entry.count++;
        entry.bySource[match.source] = (entry.bySource[match.source] || 0) + 1;
      }

      // Combine with lead data
      const result: LeadWithMatches[] = eligibleLeads.map(lead => ({
        ...lead,
        match_count: leadMatchMap.get(lead.id)?.count || 0,
        matches_by_source: leadMatchMap.get(lead.id)?.bySource || {}
      }));

      // Sort by match count descending
      return result.sort((a, b) => b.match_count - a.match_count);
    },
    enabled: eligibleLeads.length > 0
  });

  // Trigger scan mutation
  const triggerScanMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('personal-scout-trigger', {
        body: {}
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`סריקה אישית החלה עבור ${data.leads_count} לקוחות`);
      queryClient.invalidateQueries({ queryKey: ['personal-scout-last-run'] });
    },
    onError: (error) => {
      toast.error(`שגיאה בהפעלת הסריקה: ${error.message}`);
    }
  });

  const totalMatches = leadsWithMatches.reduce((sum, lead) => sum + lead.match_count, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">לקוחות זכאים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eligibleLeads.length}</div>
            <p className="text-xs text-muted-foreground">עם העדפות מוגדרות</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">התאמות נמצאו</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatches}</div>
            <p className="text-xs text-muted-foreground">מכל המקורות</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ריצה אחרונה</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastRun?.created_at 
                ? formatDistanceToNow(new Date(lastRun.created_at), { addSuffix: true, locale: he })
                : 'אף פעם'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {lastRun?.status === 'completed' ? 'הושלם' : lastRun?.status === 'running' ? 'פועל...' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הפעל סריקה</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => triggerScanMutation.mutate()}
              disabled={triggerScanMutation.isPending || (lastRun?.status === 'running' && lastRun?.started_at && (Date.now() - new Date(lastRun.started_at).getTime()) < 10 * 60 * 1000)}
              className="w-full"
            >
              {triggerScanMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {lastRun?.status === 'running' && lastRun?.started_at && (Date.now() - new Date(lastRun.started_at).getTime()) < 10 * 60 * 1000 
                ? 'סריקה פועלת...' 
                : 'הפעל סריקה אישית'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Leads with Matches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            התאמות לפי לקוח
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMatches ? (
            <div className="text-center py-8 text-muted-foreground">טוען...</div>
          ) : leadsWithMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>אין התאמות עדיין</p>
              <p className="text-sm">הפעל סריקה אישית כדי למצוא נכסים ללקוחות</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">לקוח</TableHead>
                  <TableHead className="text-right">ערים</TableHead>
                  <TableHead className="text-right">תקציב</TableHead>
                  <TableHead className="text-right">חדרים</TableHead>
                  <TableHead className="text-center">התאמות</TableHead>
                  <TableHead className="text-right">מקורות</TableHead>
                  <TableHead className="text-center">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsWithMatches.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      {lead.preferred_cities?.slice(0, 2).join(', ')}
                      {(lead.preferred_cities?.length || 0) > 2 && '...'}
                    </TableCell>
                    <TableCell>
                      {lead.budget_min || lead.budget_max 
                        ? `${(lead.budget_min || 0).toLocaleString()}-${(lead.budget_max || 0).toLocaleString()}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {lead.rooms_min || lead.rooms_max 
                        ? `${lead.rooms_min || '?'}-${lead.rooms_max || '?'}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={lead.match_count > 0 ? 'default' : 'secondary'}>
                        {lead.match_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(lead.matches_by_source).map(([source, count]) => (
                          <Badge key={source} variant="outline" className="text-xs">
                            {source}: {count}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLead(lead)}
                        disabled={lead.match_count === 0}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Matches Dialog */}
      {selectedLead && (
        <PersonalScoutMatchesDialog
          lead={selectedLead}
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
        />
      )}
    </div>
  );
};
