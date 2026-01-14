import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Settings, History, Wand2 } from 'lucide-react';
import { ScoutedPropertiesTable } from '@/components/scout/ScoutedPropertiesTable';
import { ScoutConfigManager } from '@/components/scout/ScoutConfigManager';
import { ScoutRunHistory } from '@/components/scout/ScoutRunHistory';
import { ScoutStats } from '@/components/scout/ScoutStats';
import { ManualScoutForm } from '@/components/scout/ManualScoutForm';

const AdminPropertyScout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('properties');

  return (
    <ProtectedRoute requiredRole="manager">
      <div className="container mx-auto px-4 py-6 space-y-6" dir="rtl">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">🔍 Property Scout</h1>
            <p className="text-muted-foreground">
              סריקה אוטומטית של אתרי נדל"ן והתאמה ללקוחות
            </p>
          </div>
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
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              סריקה ידנית
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

          <TabsContent value="manual" className="mt-6">
            <ManualScoutForm />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPropertyScout;
