import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Shield, Copy, Users, Database } from 'lucide-react';
import { ScoutRunHistory } from '../ScoutRunHistory';
import { DeduplicationStatus } from './DeduplicationStatus';
import { MatchingStatus } from './MatchingStatus';


// Import the availability run history + results section from AvailabilityCheckDashboard
// We'll create a lightweight wrapper that shows just the collapsibles
import { AvailabilityHistorySection } from './AvailabilityHistorySection';

export const ChecksSubTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scans');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1" dir="ltr">
        <TabsTrigger value="backfill" className="flex items-center gap-1 text-xs flex-1 min-w-[80px]">
          <Database className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Backfill</span>
        </TabsTrigger>
        <TabsTrigger value="matching" className="flex items-center gap-1 text-xs flex-1 min-w-[80px]">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">התאמות</span>
        </TabsTrigger>
        <TabsTrigger value="dedup" className="flex items-center gap-1 text-xs flex-1 min-w-[80px]">
          <Copy className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">כפילויות</span>
        </TabsTrigger>
        <TabsTrigger value="availability" className="flex items-center gap-1 text-xs flex-1 min-w-[80px]">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">זמינות</span>
        </TabsTrigger>
        <TabsTrigger value="scans" className="flex items-center gap-1 text-xs flex-1 min-w-[80px]">
          <History className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">סריקות</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="scans" className="mt-4">
        <ScoutRunHistory />
      </TabsContent>

      <TabsContent value="availability" className="mt-4">
        <AvailabilityHistorySection />
      </TabsContent>

      <TabsContent value="dedup" className="mt-4">
        <DeduplicationStatus />
      </TabsContent>

      <TabsContent value="matching" className="mt-4">
        <MatchingStatus />
      </TabsContent>

      <TabsContent value="backfill" className="mt-4">
        <BackfillStatus />
      </TabsContent>
    </Tabs>
  );
};
