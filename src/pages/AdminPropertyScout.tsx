import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Settings, History, Wand2, Copy } from 'lucide-react';
import { ScoutedPropertiesTable } from '@/components/scout/ScoutedPropertiesTable';
import { ScoutConfigManager } from '@/components/scout/ScoutConfigManager';
import { ScoutRunHistory } from '@/components/scout/ScoutRunHistory';
import { ScoutStats } from '@/components/scout/ScoutStats';
import { ManualScoutForm } from '@/components/scout/ManualScoutForm';
import { DuplicateAlertsPanel } from '@/components/scout/DuplicateAlertsPanel';
const AdminPropertyScout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('properties');

  return (
    <ProtectedRoute requiredRole="manager">
      <div className="container mx-auto px-4 py-6 space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold">🔍 Property Scout</h1>
          <p className="text-muted-foreground">
            סריקה אוטומטית של אתרי נדל"ן והתאמה ללקוחות
          </p>
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
