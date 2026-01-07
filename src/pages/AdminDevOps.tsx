import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Search, Gauge, ClipboardCheck, Flag } from "lucide-react";
import { MonitoringTab } from "@/components/devops/MonitoringTab";
import { SeoTab } from "@/components/devops/SeoTab";
import { PerformanceTab } from "@/components/devops/PerformanceTab";
import { QaTestsTab } from "@/components/devops/QaTestsTab";
import { FeatureFlagsTab } from "@/components/devops/FeatureFlagsTab";

const AdminDevOps: React.FC = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">בדיקות איכות ותפעול</h1>
          <p className="text-muted-foreground">ניטור, בדיקות, וכלי פיתוח</p>
        </div>

        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList className="flex flex-wrap flex-row-reverse h-auto gap-2 bg-card/50 p-2">
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              ניטור
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              מהירות
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              בדיקות ידניות
            </TabsTrigger>
            <TabsTrigger value="flags" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              דגלי פיצ'רים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring"><MonitoringTab /></TabsContent>
          <TabsContent value="seo"><SeoTab /></TabsContent>
          <TabsContent value="performance"><PerformanceTab /></TabsContent>
          <TabsContent value="qa"><QaTestsTab /></TabsContent>
          <TabsContent value="flags"><FeatureFlagsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDevOps;
