import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPWAInstallPrompt } from './AdminPWAInstallPrompt';
import { MessageSquare } from 'lucide-react';
import { Property, PropertyStats, Alert } from '../types/property';
import { ActivePropertiesCard } from './ActivePropertiesCard';
import { AnalyticsSummaryCard } from './AnalyticsSummaryCard';
import { UpcomingAppointmentsCard } from './UpcomingAppointmentsCard';
import { AddAppointmentModal } from './AddAppointmentModal';
import { DevelopmentIdeasCard } from './DevelopmentIdeasCard';
import { PriorityTasksCard } from './PriorityTasksCard';
import { SiteIssuesCard } from './SiteIssuesCard';
import { ContactLeadsListCompact } from './ContactLeadsListCompact';
import { DashboardFormsCubes } from './DashboardFormsCubes';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { useAuth } from '@/contexts/AuthContext';
interface MobileDashboardProps {
  properties: Property[];
  stats: PropertyStats;
  alerts: Alert[];
  onAddProperty?: () => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({ 
  properties, 
  stats, 
  alerts,
  onAddProperty 
}) => {
  const { isMobile } = useMobileOptimization();
  const { profile } = useAuth();
  
  // Extract user's name for greeting
  const getUserName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0]; // Get first name
    }
    if (profile?.email) {
      return profile.email.split('@')[0]; // Get part before @
    }
    return '';
  };
  
  const userName = getUserName();
  
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

  if (!isMobile) {
    return null; // This component is only for mobile
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="space-y-4 p-4 pb-24 mobile-scroll max-w-screen-sm mx-auto">
        {/* PWA Install Prompt */}
        <AdminPWAInstallPrompt />
        
        {/* Header with greeting */}
        <div className="bg-gradient-primary rounded-2xl p-5 text-white shadow-elevated animate-fade-in overflow-hidden relative isolate">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20"></div>
            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/10"></div>
          </div>
          
          <div className="relative z-10">
            <div className="mb-4">
              <h1 className="text-xl font-bold mb-1">
                שלום{userName ? ` ${userName}` : ''}! 👋
              </h1>
              <p className="text-white/90 text-sm">ברוך הבא למערכת ניהול הנכסים</p>
            </div>
            
            <DashboardFormsCubes />
          </div>
        </div>

        {/* Priority Tasks Cards */}
        <PriorityTasksCard taskType="daily" title="Daily Priority" />
        <PriorityTasksCard taskType="weekly" title="General Priority" />

        {/* Active Properties Card */}
        <ActivePropertiesCard properties={properties} />

        {/* Upcoming Appointments Card */}
        <UpcomingAppointmentsCard 
          limit={3} 
          onAddAppointment={() => setIsAppointmentModalOpen(true)}
          onEditAppointment={(appt) => { setEditingAppointment(appt); setIsAppointmentModalOpen(true); }}
        />

        {/* Analytics Summary Card */}
        <AnalyticsSummaryCard stats={stats} />

        {/* Development Ideas */}
        <DevelopmentIdeasCard />

        {/* Site Issues */}
        <SiteIssuesCard />

        {/* Website Inquiries */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              פניות מהאתר
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContactLeadsListCompact limit={3} />
          </CardContent>
        </Card>
      </div>

      {/* Add Appointment Modal */}
      <AddAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => { setIsAppointmentModalOpen(false); setEditingAppointment(null); }}
        editingAppointment={editingAppointment}
      />
    </div>
  );
};