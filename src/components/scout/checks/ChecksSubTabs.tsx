import React, { useState, useRef } from 'react';
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
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <Tabs ref={tabsRef} value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full flex h-auto gap-1 bg-muted/50 p-1 overflow-x-auto scrollbar-none" dir="ltr">
        <TabsTrigger value="backfill" className="flex items-center gap-1 text-xs whitespace-nowrap shrink-0">
          <Database className="h-3.5 w-3.5 shrink-0" />
          <span>Backfill</span>
        </TabsTrigger>
        <TabsTrigger value="matching" className="flex items-center gap-1 text-xs whitespace-nowrap shrink-0">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span>התאמות</span>
        </TabsTrigger>
        <TabsTrigger value="dedup" className="flex items-center gap-1 text-xs whitespace-nowrap shrink-0">
          <Copy className="h-3.5 w-3.5 shrink-0" />
          <span>כפילויות</span>
        </TabsTrigger>
        <TabsTrigger value="availability" className="flex items-center gap-1 text-xs whitespace-nowrap shrink-0">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          <span>זמינות</span>
        </TabsTrigger>
        <TabsTrigger value="scans" className="flex items-center gap-1 text-xs whitespace-nowrap shrink-0">
          <History className="h-3.5 w-3.5 shrink-0" />
          <span>סריקות</span>
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
        <div className="text-center py-6 text-muted-foreground">השלמת נתונים זמינה דרך הדשבורד הראשי</div>
      </TabsContent>
    </Tabs>
  );
};
