import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Settings, History, BarChart3 } from 'lucide-react';
import { ScoutedPropertiesTable } from '@/components/scout/ScoutedPropertiesTable';
import { ScoutConfigManager } from '@/components/scout/ScoutConfigManager';
import { ScoutRunHistory } from '@/components/scout/ScoutRunHistory';
import { ScoutStats } from '@/components/scout/ScoutStats';
import { ManualScoutForm } from '@/components/scout/ManualScoutForm';

const AdminPropertyScout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('properties');

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
      <div className="container mx-auto px-4 py-6 space-y-6" dir="rtl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🔍 Property Scout</h1>
              <p className="text-muted-foreground">
                סריקה אוטומטית של אתרי נדל"ן והתאמה ללקוחות
              </p>
            </div>
          </div>

          <ManualScoutForm />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              דירות שנמצאו
            </TabsTrigger>
            <TabsTrigger value="configs" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              הגדרות סריקה
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              היסטוריית ריצות
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              סטטיסטיקות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="mt-6">
            <ScoutedPropertiesTable />
          </TabsContent>

          <TabsContent value="configs" className="mt-6">
            <ScoutConfigManager />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ScoutRunHistory />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <ScoutStats />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPropertyScout;
