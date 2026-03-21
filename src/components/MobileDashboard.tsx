import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { MessageSquare } from 'lucide-react';
import { Property, PropertyStats, Alert } from '../types/property';
import { ActivePropertiesCard } from './ActivePropertiesCard';
import { AnalyticsSummaryCard } from './AnalyticsSummaryCard';
import { UpcomingAppointmentsCard } from './UpcomingAppointmentsCard';
import { AddAppointmentModal } from './AddAppointmentModal';
import { DevelopmentIdeasCard } from './DevelopmentIdeasCard';
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
        
        {/* Quick Action Forms */}
        <DashboardFormsCubes />

        {/* Active Properties Card */}
        <ActivePropertiesCard properties={properties} />

        {/* Upcoming Appointments Card */}
        <UpcomingAppointmentsCard 
          limit={3} 
          onAddAppointment={() => setIsAppointmentModalOpen(true)}
          onEditAppointment={(appt) => { setEditingAppointment(appt); setIsAppointmentModalOpen(true); }}
        />

        {/* Development Ideas */}
        <DevelopmentIdeasCard />

        {/* Website Inquiries */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              פניות מהאתר
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[320px] overflow-y-auto">
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