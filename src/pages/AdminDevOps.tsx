import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Search, Gauge, ClipboardCheck, TestTube, GitBranch, Server, Flag, Bug } from "lucide-react";
import { MonitoringTab } from "@/components/devops/MonitoringTab";
import { SeoTab } from "@/components/devops/SeoTab";
import { PerformanceTab } from "@/components/devops/PerformanceTab";
import { QaTestsTab } from "@/components/devops/QaTestsTab";
import { AutomatedTestsTab } from "@/components/devops/AutomatedTestsTab";
import { CiCdTab } from "@/components/devops/CiCdTab";
import { StagingTab } from "@/components/devops/StagingTab";
import { FeatureFlagsTab } from "@/components/devops/FeatureFlagsTab";
import { ErrorTrackingTab } from "@/components/devops/ErrorTrackingTab";

const AdminDevOps: React.FC = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">QA & DevOps</h1>
          <p className="text-muted-foreground">ניטור, בדיקות, CI/CD וכלי פיתוח</p>
        </div>

        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-card/50 p-2">
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
              QA ידני
            </TabsTrigger>
            <TabsTrigger value="automated" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              בדיקות אוטומטיות
            </TabsTrigger>
            <TabsTrigger value="cicd" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              CI/CD
            </TabsTrigger>
            <TabsTrigger value="staging" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Staging
            </TabsTrigger>
            <TabsTrigger value="flags" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Feature Flags
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Error Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring"><MonitoringTab /></TabsContent>
          <TabsContent value="seo"><SeoTab /></TabsContent>
          <TabsContent value="performance"><PerformanceTab /></TabsContent>
          <TabsContent value="qa"><QaTestsTab /></TabsContent>
          <TabsContent value="automated"><AutomatedTestsTab /></TabsContent>
          <TabsContent value="cicd"><CiCdTab /></TabsContent>
          <TabsContent value="staging"><StagingTab /></TabsContent>
          <TabsContent value="flags"><FeatureFlagsTab /></TabsContent>
          <TabsContent value="errors"><ErrorTrackingTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDevOps;
