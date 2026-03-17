import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Activity, Hourglass, CheckCircle, Database, Copy, Users, LayoutGrid } from 'lucide-react';
import { ScoutedPropertiesTable } from '@/components/scout/ScoutedPropertiesTable';
import { ChecksDashboard } from '@/components/scout/ChecksDashboard';
import { ScoutMetricTile } from '@/components/scout/ScoutMetricTile';

const AdminPropertyScout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('properties');

  // Global scout stats
  const { data: stats } = useQuery({
    queryKey: ['global-scout-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [totalRes, totalActiveRes, pendingRecheckRes, checkedTodayRes] = await Promise.all([
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.rpc('get_properties_needing_availability_check', {
          p_first_recheck_days: 8,
          p_recurring_recheck_days: 2,
          p_min_days_before_check: 3,
          p_fetch_limit: 10000
        }, { count: 'exact', head: true }),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true })
          .gte('availability_checked_at', today.toISOString()),
      ]);
      return {
        total: totalRes.count ?? 0,
        totalActive: totalActiveRes.count ?? 0,
        pendingRecheck: pendingRecheckRes.count ?? 0,
        checkedToday: checkedTodayRes.count ?? 0,
      };
    },
    refetchInterval: 15000,
  });

  // Dedup stats
  const { data: dedupStats } = useQuery({
    queryKey: ['dedup-stats-summary-global'],
    queryFn: async () => {
      const { count } = await supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_primary_listing', false)
        .not('duplicate_group_id', 'is', null);
      return { losers: count ?? 0 };
    },
    refetchInterval: 30000,
  });

  // Matching stats
  const { data: matchStats } = useQuery({
    queryKey: ['matching-stats-summary'],
    queryFn: async () => {
      const { data } = await supabase.from('personal_scout_runs').select('total_matches').order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    refetchInterval: 30000,
  });

  // Historical comparison: yesterday's data for deltas
  const { data: historical } = useQuery({
    queryKey: ['scout-historical-stats'],
    queryFn: async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      const [checkedYesterdayRes, totalYesterdayRes, activeYesterdayRes] = await Promise.all([
        // How many were checked yesterday
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true })
          .gte('availability_checked_at', yesterday.toISOString())
          .lte('availability_checked_at', endOfYesterday.toISOString()),
        // Total properties that existed as of yesterday
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true })
          .lte('created_at', endOfYesterday.toISOString()),
        // Active properties as of yesterday (approx — currently active minus those created today)
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .lte('created_at', endOfYesterday.toISOString()),
      ]);
      return {
        checkedYesterday: checkedYesterdayRes.count ?? 0,
        totalYesterday: totalYesterdayRes.count ?? 0,
        activeYesterday: activeYesterdayRes.count ?? 0,
      };
    },
    refetchInterval: 60000,
  });

  // Sparkline: daily counts for last 7 days
  const { data: sparklines } = useQuery({
    queryKey: ['scout-sparkline-data'],
    queryFn: async () => {
      const days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        days.push(d.toISOString());
      }
      // Fetch checked counts per day from availability_check_runs
      const { data: runs } = await supabase
        .from('availability_check_runs')
        .select('started_at, properties_checked')
        .gte('started_at', days[0])
        .order('started_at', { ascending: true });

      const checkedPerDay = new Array(7).fill(0);
      if (runs) {
        for (const run of runs) {
          const runDate = new Date(run.started_at);
          for (let i = 0; i < 7; i++) {
            const dayStart = new Date(days[i]);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            if (runDate >= dayStart && runDate < dayEnd) {
              checkedPerDay[i] += run.properties_checked ?? 0;
              break;
            }
          }
        }
      }

      // Fetch new properties per day
      const { data: newProps } = await supabase
        .from('scouted_properties')
        .select('created_at')
        .gte('created_at', days[0])
        .order('created_at', { ascending: true });

      const newPerDay = new Array(7).fill(0);
      if (newProps) {
        for (const p of newProps) {
          const pDate = new Date(p.created_at);
          for (let i = 0; i < 7; i++) {
            const dayStart = new Date(days[i]);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            if (pDate >= dayStart && pDate < dayEnd) {
              newPerDay[i]++;
              break;
            }
          }
        }
      }

      return { checkedPerDay, newPerDay };
    },
    refetchInterval: 60000,
  });

  // Compute deltas
  const calcDelta = (current: number, previous: number): number | null => {
    if (previous === 0) return current > 0 ? 100 : null;
    return ((current - previous) / previous) * 100;
  };

  const totalDelta = historical ? calcDelta(stats?.total ?? 0, historical.totalYesterday) : null;
  const activeDelta = historical ? calcDelta(stats?.totalActive ?? 0, historical.activeYesterday) : null;
  const checkedDelta = historical ? calcDelta(stats?.checkedToday ?? 0, historical.checkedYesterday) : null;

  return (
    <ProtectedRoute requiredRole="manager">
      <div className="container mx-auto px-4 py-6 space-y-4" dir="rtl">
        {/* Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <ScoutMetricTile
            label="סה״כ נכסים"
            value={stats?.total ?? '—'}
            icon={<LayoutGrid className="h-4 w-4" />}
            statusColor="gray"
            delta={totalDelta}
            sparklineData={sparklines?.newPerDay}
            hoverContent={
              <div className="space-y-1">
                <p className="font-semibold">סה״כ נכסים במאגר</p>
                <p>כולל אקטיביים ולא אקטיביים</p>
                {historical && <p>אתמול: {historical.totalYesterday.toLocaleString('he-IL')}</p>}
              </div>
            }
          />
          <ScoutMetricTile
            label="סה״כ אקטיביים"
            value={stats?.totalActive ?? '—'}
            icon={<Database className="h-4 w-4" />}
            statusColor="blue"
            delta={activeDelta}
            sparklineData={sparklines?.newPerDay}
            hoverContent={
              <div className="space-y-1">
                <p className="font-semibold">נכסים אקטיביים</p>
                <p>נכסים פעילים הזמינים לצפייה</p>
                {historical && <p>אתמול: {historical.activeYesterday.toLocaleString('he-IL')}</p>}
              </div>
            }
          />
          <ScoutMetricTile
            label="ממתינים לבדיקה"
            value={stats?.pendingRecheck ?? '—'}
            icon={<Hourglass className="h-4 w-4" />}
            statusColor={(stats?.pendingRecheck ?? 0) > 500 ? 'red' : (stats?.pendingRecheck ?? 0) > 200 ? 'amber' : 'green'}
            hoverContent={
              <div className="space-y-1">
                <p className="font-semibold">ממתינים לבדיקת זמינות</p>
                <p>נכסים שעבר מספיק זמן מבדיקתם האחרונה</p>
              </div>
            }
          />
          <ScoutMetricTile
            label="נבדקו היום"
            value={stats?.checkedToday ?? '—'}
            icon={<CheckCircle className="h-4 w-4" />}
            statusColor="green"
            delta={checkedDelta}
            sparklineData={sparklines?.checkedPerDay}
            hoverContent={
              <div className="space-y-1">
                <p className="font-semibold">בדיקות זמינות היום</p>
                <p>כמה נכסים נבדקו מחצות</p>
                {historical && <p>אתמול: {historical.checkedYesterday.toLocaleString('he-IL')}</p>}
              </div>
            }
          />
          <ScoutMetricTile
            label="כפילויות"
            value={dedupStats?.losers ?? '—'}
            icon={<Copy className="h-4 w-4" />}
            statusColor="purple"
            hoverContent={
              <div className="space-y-1">
                <p className="font-semibold">כפילויות שזוהו</p>
                <p>נכסים שסומנו כלא ראשוניים (losers)</p>
              </div>
            }
          />
          <ScoutMetricTile
            label="התאמות אחרונות"
            value={matchStats?.total_matches ?? '—'}
            icon={<Users className="h-4 w-4" />}
            statusColor="green"
            hoverContent={
              <div className="space-y-1">
                <p className="font-semibold">התאמות מהריצה האחרונה</p>
                <p>מספר ההתאמות שנמצאו בריצת המאצ׳ר האחרונה</p>
              </div>
            }
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2" dir="ltr">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
              <Activity className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">דשבורד בדיקות</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
              <Search className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">דירות שנמצאו</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="mt-6">
            <ScoutedPropertiesTable />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <ChecksDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPropertyScout;
