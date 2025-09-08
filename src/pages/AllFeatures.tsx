import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyMaintenance } from '@/components/PropertyMaintenance';
import { CommunicationHub } from '@/components/CommunicationHub';
import { ReportsExporter } from '@/components/ReportsExporter';
import { EnhancedUserRoles } from '@/components/EnhancedUserRoles';
import { MobileNavigation } from '@/components/MobileNavigation';
import { TenantsList } from '@/components/TenantsList';
import { FinancialDashboard } from '@/components/FinancialDashboard';
import { NotificationPanel } from '@/components/NotificationPanel';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { usePropertyData } from '@/hooks/usePropertyData';
import { useTenantData } from '@/hooks/useTenantData';

export const AllFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState('maintenance');
  const { isMobile } = useMobileDetection();
  const { properties } = usePropertyData();
  const { propertiesWithTenants } = useTenantData();
  
  // Mock data for features
  const tenants = propertiesWithTenants.flatMap(p => p.tenants);
  const financialData: any[] = [];
  const maintenanceData: any[] = [];
  const messagesData: any[] = [];
  const notifications: any[] = [];

  if (isMobile) {
    return (
      <div className="pb-32">
        {activeTab === 'maintenance' && <PropertyMaintenance properties={properties} />}
        {activeTab === 'communications' && <CommunicationHub properties={properties} tenants={tenants} />}
        {activeTab === 'reports' && <ReportsExporter properties={properties} tenants={tenants} financialData={financialData} maintenanceData={maintenanceData} messagesData={messagesData} />}
        {activeTab === 'roles' && <EnhancedUserRoles />}
        {activeTab === 'tenants' && <TenantsList />}
        {activeTab === 'finances' && <FinancialDashboard />}
        {activeTab === 'notifications' && <NotificationPanel notifications={notifications} onMarkAsRead={() => {}} />}
        
        <MobileNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          notifications={notifications.filter(n => !n.is_read).length}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">כל התכונות</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="maintenance">תחזוקה</TabsTrigger>
          <TabsTrigger value="communications">תקשורת</TabsTrigger>
          <TabsTrigger value="reports">דוחות</TabsTrigger>
          <TabsTrigger value="roles">הרשאות</TabsTrigger>
          <TabsTrigger value="tenants">דיירים</TabsTrigger>
          <TabsTrigger value="finances">כספים</TabsTrigger>
          <TabsTrigger value="notifications">התראות</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance">
          <PropertyMaintenance properties={properties} />
        </TabsContent>
        
        <TabsContent value="communications">
          <CommunicationHub properties={properties} tenants={tenants} />
        </TabsContent>
        
        <TabsContent value="reports">
          <ReportsExporter 
            properties={properties} 
            tenants={tenants} 
            financialData={financialData}
            maintenanceData={maintenanceData}
            messagesData={messagesData}
          />
        </TabsContent>
        
        <TabsContent value="roles">
          <EnhancedUserRoles />
        </TabsContent>
        
        <TabsContent value="tenants">
          <TenantsList />
        </TabsContent>
        
        <TabsContent value="finances">
          <FinancialDashboard />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationPanel 
            notifications={notifications} 
            onMarkAsRead={() => {}} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};