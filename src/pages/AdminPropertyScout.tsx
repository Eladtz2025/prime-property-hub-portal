import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Activity, Hourglass, CheckCircle, Database, Copy, Users, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ScoutedPropertiesTable } from '@/components/scout/ScoutedPropertiesTable';
import { ChecksDashboard } from '@/components/scout/ChecksDashboard';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = '' }) => (
  <Card>
    <CardContent className="p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color || 'bg-muted'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground truncate">{title}</p>
        <p className="text-lg font-bold">{typeof value === 'number' ? value.toLocaleString('he-IL') : value}</p>
      </div>
    </CardContent>
  </Card>
);

const AdminPropertyScout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('properties');

  // Global scout stats (unique queryKey to avoid collision with ChecksDashboard)
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

  // Dedup stats — count losers (non-primary duplicates)
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

  return (
    <ProtectedRoute requiredRole="manager">
      <div className="container mx-auto px-4 py-6 space-y-4" dir="rtl">
        {/* Stats Cards - Always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <StatCard title="סה״כ נכסים" value={stats?.total ?? '—'} icon={<LayoutGrid className="h-4 w-4 text-gray-600" />} color="bg-gray-100 dark:bg-gray-900/30" />
          <StatCard title="סה״כ אקטיביים" value={stats?.totalActive ?? '—'} icon={<Database className="h-4 w-4 text-blue-600" />} color="bg-blue-100 dark:bg-blue-900/30" />
          <StatCard title="ממתינים לבדיקה" value={stats?.pendingRecheck ?? '—'} icon={<Hourglass className="h-4 w-4 text-amber-600" />} color="bg-amber-100 dark:bg-amber-900/30" />
          <StatCard title="נבדקו היום" value={stats?.checkedToday ?? '—'} icon={<CheckCircle className="h-4 w-4 text-green-600" />} color="bg-green-100 dark:bg-green-900/30" />
          <StatCard title="כפילויות" value={dedupStats?.losers ?? '—'} icon={<Copy className="h-4 w-4 text-purple-600" />} color="bg-purple-100 dark:bg-purple-900/30" />
          <StatCard title="התאמות אחרונות" value={matchStats?.total_matches ?? '—'} icon={<Users className="h-4 w-4 text-green-600" />} color="bg-green-100 dark:bg-green-900/30" />
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
