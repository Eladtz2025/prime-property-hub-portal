import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminPWAInstallPrompt } from './AdminPWAInstallPrompt';
import { 
  Building, 
  TrendingUp,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { Property, PropertyStats, Alert } from '../types/property';
import { ActivePropertiesCard } from './ActivePropertiesCard';
import { AnalyticsSummaryCard } from './AnalyticsSummaryCard';
import { UpcomingAppointmentsCard } from './UpcomingAppointmentsCard';
import { AddAppointmentModal } from './AddAppointmentModal';
import { DevelopmentIdeasCard } from './DevelopmentIdeasCard';
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
  
  // Manual monthly income state
  const [manualMonthlyIncome, setManualMonthlyIncome] = useState<number | null>(null);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [editIncomeValue, setEditIncomeValue] = useState('');
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  // Load saved manual income from localStorage
  useEffect(() => {
    const savedIncome = localStorage.getItem('manualMonthlyIncome');
    if (savedIncome) {
      setManualMonthlyIncome(Number(savedIncome));
    }
  }, []);
  
  // Handle income editing
  const handleEditIncome = () => {
    setEditIncomeValue(displayIncome.toString());
    setIsEditingIncome(true);
  };
  
  const handleSaveIncome = () => {
    const newIncome = Number(editIncomeValue);
    if (!isNaN(newIncome) && newIncome >= 0) {
      setManualMonthlyIncome(newIncome);
      localStorage.setItem('manualMonthlyIncome', newIncome.toString());
    }
    setIsEditingIncome(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditingIncome(false);
    setEditIncomeValue('');
  };
  
  
  // Calculate monthly income only once and memoize it
  const displayIncome = useMemo(() => {
    if (manualMonthlyIncome !== null) {
      return manualMonthlyIncome;
    }
    
    // Calculate from actual property data - only occupied properties
    const autoCalculatedIncome = properties
      .filter(p => p.status === 'occupied' && p.monthlyRent && p.monthlyRent > 0)
      .reduce((sum, p) => sum + (p.monthlyRent || 0), 0);
    
    // If no rent data available, don't show a placeholder
    return autoCalculatedIncome;
  }, [properties, manualMonthlyIncome]);

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
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/20 p-1.5 rounded-lg flex-shrink-0">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold">סה״כ נכסים</span>
                </div>
                <div className="text-xl font-bold number-display">{stats.totalProperties}</div>
              </div>
              
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/20 p-1.5 rounded-lg flex-shrink-0">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold">הכנסה חודשית</span>
                  {!isEditingIncome && (
                    <Button
                      onClick={handleEditIncome}
                      size="sm"
                      variant="ghost"
                      className="bg-white/10 hover:bg-white/20 text-white p-1 h-6 w-6 ml-auto flex-shrink-0"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {isEditingIncome ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editIncomeValue}
                      onChange={(e) => setEditIncomeValue(e.target.value)}
                      placeholder="הכנסה חודשית"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/70 text-sm h-8 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveIncome();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <Button
                      onClick={handleSaveIncome}
                      size="sm"
                      variant="ghost"
                      className="bg-white/10 hover:bg-white/20 text-white p-1 h-8 w-8 flex-shrink-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="ghost"
                      className="bg-white/10 hover:bg-white/20 text-white p-1 h-8 w-8 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-lg font-bold number-display truncate">
                    {displayIncome > 0 ? `₪${displayIncome.toLocaleString('he-IL')}` : 'לא חושב'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Properties Card */}
        <ActivePropertiesCard properties={properties} />

        {/* Upcoming Appointments Card */}
        <UpcomingAppointmentsCard 
          limit={3} 
          onAddAppointment={() => setIsAppointmentModalOpen(true)}
        />

        {/* Analytics Summary Card */}
        <AnalyticsSummaryCard stats={stats} />

        {/* Development Ideas */}
        <DevelopmentIdeasCard />
      </div>

      {/* Add Appointment Modal */}
      <AddAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
      />
    </div>
  );
};