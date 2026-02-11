import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Settings, History, Shield } from 'lucide-react';
import { ScoutedPropertiesTable } from '@/components/scout/ScoutedPropertiesTable';
import { UnifiedScoutSettings } from '@/components/scout/UnifiedScoutSettings';
import { ScoutRunHistory } from '@/components/scout/ScoutRunHistory';
import { AvailabilityCheckDashboard } from '@/components/scout/AvailabilityCheckDashboard';

const AdminPropertyScout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('properties');

  return (
    <ProtectedRoute requiredRole="manager">
      <div className="container mx-auto px-4 py-6 space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" dir="ltr">
            <Search className="h-6 w-6" />
            Property Scout
          </h1>
          <p className="text-muted-foreground">
            סריקה אוטומטית של אתרי נדל"ן והתאמה ללקוחות
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4" dir="ltr">
            <TabsTrigger value="availability" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
              <Shield className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm">בדיקות זמינות</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
              <History className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm">היסטוריית ריצות</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
              <Settings className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm">הגדרות</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
              <Search className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm">דירות שנמצאו</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="mt-6">
            <ScoutedPropertiesTable />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <UnifiedScoutSettings />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ScoutRunHistory />
          </TabsContent>

          <TabsContent value="availability" className="mt-6">
            <AvailabilityCheckDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPropertyScout;
