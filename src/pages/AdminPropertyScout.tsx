import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Settings, History, Wand2, Copy, Calculator, Loader2 } from 'lucide-react';
import { ScoutedPropertiesTable } from '@/components/scout/ScoutedPropertiesTable';
import { ScoutConfigManager } from '@/components/scout/ScoutConfigManager';
import { ScoutRunHistory } from '@/components/scout/ScoutRunHistory';
import { ScoutStats } from '@/components/scout/ScoutStats';
import { ManualScoutForm } from '@/components/scout/ManualScoutForm';
import { DuplicateAlertsPanel } from '@/components/scout/DuplicateAlertsPanel';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
const AdminPropertyScout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('properties');
  const queryClient = useQueryClient();

  const matchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('match-scouted-to-leads', {
        body: { send_whatsapp: false }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`חושבו ${data.leads_matched || 0} התאמות ל-${data.properties_processed || 0} נכסים`);
      queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
    },
    onError: (error) => {
      console.error('Match error:', error);
      toast.error('שגיאה בחישוב התאמות');
    }
  });

  return (
    <ProtectedRoute requiredRole="manager">
      <div className="container mx-auto px-4 py-6 space-y-6" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">🔍 Property Scout</h1>
            <p className="text-muted-foreground">
              סריקה אוטומטית של אתרי נדל"ן והתאמה ללקוחות
            </p>
          </div>
          <Button 
            onClick={() => matchMutation.mutate()}
            disabled={matchMutation.isPending}
            className="gap-2"
          >
            {matchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4" />
            )}
            חשב התאמות
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="properties" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
              <Search className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm">דירות שנמצאו</span>
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
              <Copy className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm">כפילויות</span>
            </TabsTrigger>
            <TabsTrigger value="configs" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
              <Settings className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm">הגדרות סריקה</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
              <History className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm">היסטוריית ריצות</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
              <Wand2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm">סריקה ידנית</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="mt-6">
            <ScoutedPropertiesTable />
          </TabsContent>

          <TabsContent value="duplicates" className="mt-6">
            <DuplicateAlertsPanel />
          </TabsContent>

          <TabsContent value="configs" className="mt-6">
            <ScoutConfigManager />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ScoutRunHistory />
          </TabsContent>

          <TabsContent value="manual" className="mt-6">
            <ManualScoutForm />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPropertyScout;
