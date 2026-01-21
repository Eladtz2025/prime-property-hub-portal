import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, MessageSquare, TrendingUp, Search, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const ScoutStats: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['scout-stats'],
    queryFn: async () => {
      // Get total properties
      const { count: totalProperties } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true });

      // Get properties by status
      const { data: statusData } = await supabase
        .from('scouted_properties')
        .select('status')
        .then(res => {
          const counts: Record<string, number> = {};
          res.data?.forEach(p => {
            counts[p.status] = (counts[p.status] || 0) + 1;
          });
          return { data: counts };
        });

      // Get properties by source
      const { data: sourceData } = await supabase
        .from('scouted_properties')
        .select('source')
        .then(res => {
          const counts: Record<string, number> = {};
          res.data?.forEach(p => {
            counts[p.source] = (counts[p.source] || 0) + 1;
          });
          return { data: counts };
        });

      // Get properties by city (top 10)
      const { data: cityData } = await supabase
        .from('scouted_properties')
        .select('city')
        .not('city', 'is', null)
        .then(res => {
          const counts: Record<string, number> = {};
          res.data?.forEach(p => {
            if (p.city) {
              counts[p.city] = (counts[p.city] || 0) + 1;
            }
          });
          return { 
            data: Object.entries(counts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([city, count]) => ({ city, count }))
          };
        });

      // Get total runs and success rate
      const { data: runsData } = await supabase
        .from('scout_runs')
        .select('status, properties_found, new_properties, leads_matched, whatsapp_sent');

      const totalRuns = runsData?.length || 0;
      const successfulRuns = runsData?.filter(r => r.status === 'completed').length || 0;
      const totalFound = runsData?.reduce((sum, r) => sum + (r.properties_found || 0), 0) || 0;
      const totalNew = runsData?.reduce((sum, r) => sum + (r.new_properties || 0), 0) || 0;
      const totalMatched = runsData?.reduce((sum, r) => sum + (r.leads_matched || 0), 0) || 0;
      const totalWhatsApp = runsData?.reduce((sum, r) => sum + (r.whatsapp_sent || 0), 0) || 0;

      // Get active configs
      const { count: activeConfigs } = await supabase
        .from('scout_configs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      return {
        totalProperties: totalProperties || 0,
        statusData: statusData || {},
        sourceData: sourceData || {},
        cityData: cityData || [],
        totalRuns,
        successfulRuns,
        successRate: totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0,
        totalFound,
        totalNew,
        totalMatched,
        totalWhatsApp,
        activeConfigs: activeConfigs || 0
      };
    }
  });

  const statusChartData = Object.entries(stats?.statusData || {}).map(([name, value]) => ({
    name: name === 'new' ? 'חדש' : 
          name === 'notified' ? 'נשלח' : 
          name === 'archived' ? 'ארכיון' : 
          name === 'imported' ? 'יובא' : name,
    value
  }));

  const sourceChartData = Object.entries(stats?.sourceData || {}).map(([name, value]) => ({
    name: name === 'yad2' ? 'יד2' : name === 'madlan' ? 'מדלן' : name,
    value
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalProperties || 0}</p>
                <p className="text-xs text-muted-foreground">סה"כ דירות</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalNew || 0}</p>
                <p className="text-xs text-muted-foreground">דירות חדשות</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalMatched || 0}</p>
                <p className="text-xs text-muted-foreground">התאמות</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalWhatsApp || 0}</p>
                <p className="text-xs text-muted-foreground">הודעות נשלחו</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalRuns || 0}</p>
                <p className="text-xs text-muted-foreground">סריקות</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.activeConfigs || 0}</p>
                <p className="text-xs text-muted-foreground">הגדרות פעילות</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">התפלגות לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">התפלגות לפי מקור</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">דירות לפי עיר (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.cityData || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="city" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
