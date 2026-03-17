
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Property, PropertyStats, Alert } from '../types/property';
import { MobileDashboard } from './MobileDashboard';
import { ContactLeadsListCompact } from './ContactLeadsListCompact';
import { ActivePropertiesCard } from './ActivePropertiesCard';
import { UpcomingAppointmentsCard } from './UpcomingAppointmentsCard';
import { AddAppointmentModal } from './AddAppointmentModal';
import { DevelopmentIdeasCard } from './DevelopmentIdeasCard';
import { DashboardFormsCubes } from './DashboardFormsCubes';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  properties: Property[];
  stats: PropertyStats;
  alerts: Alert[];
  onAddProperty?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({ properties, stats, alerts, onAddProperty }) => {
  const { isMobile } = useMobileOptimization();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

  
  // Show mobile dashboard for mobile users
  if (isMobile) {
    return <MobileDashboard properties={properties} stats={stats} alerts={alerts} onAddProperty={onAddProperty} />;
  }
  
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

  return (
    <div className="space-y-6">
      {/* Quick Action Forms */}
      <DashboardFormsCubes />

      {/* הדירות שלנו - קרוסלה */}
      <ActivePropertiesCard properties={properties} />

      {/* שורה: פגישות קרובות + רעיונות לפיתוח + פניות מהאתר */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 [&>*]:max-h-[400px] [&>*]:flex [&>*]:flex-col">
        <UpcomingAppointmentsCard 
          limit={3} 
          onAddAppointment={() => setIsAppointmentModalOpen(true)}
          onEditAppointment={(appt) => { setEditingAppointment(appt); setIsAppointmentModalOpen(true); }}
        />

        <DevelopmentIdeasCard />

        <Card className="flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              פניות מהאתר
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin/leads')}
                className="gap-1"
              >
                ראה הכל
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto">
            <ContactLeadsListCompact limit={5} />
          </CardContent>
        </Card>
      </div>

      {/* מודל הוספת פגישה */}
      <AddAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => { setIsAppointmentModalOpen(false); setEditingAppointment(null); }}
        editingAppointment={editingAppointment}
      />
    </div>
  );
});
