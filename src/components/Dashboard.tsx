
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building, Users, CheckCircle, Clock, Phone, TrendingUp, Edit2, ArrowLeft, MessageSquare } from 'lucide-react';
import { Property, PropertyStats, Alert } from '../types/property';
import { MobileDashboard } from './MobileDashboard';
import { ContactLeadsListCompact } from './ContactLeadsListCompact';
import { ActivePropertiesCard } from './ActivePropertiesCard';
import { UpcomingAppointmentsCard } from './UpcomingAppointmentsCard';
import { AddAppointmentModal } from './AddAppointmentModal';
import { DevelopmentIdeasCard } from './DevelopmentIdeasCard';
import { PriorityTasksCard } from './PriorityTasksCard';
import { SiteIssuesCard } from './SiteIssuesCard';
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
  
  // Manual monthly income state
  const [manualMonthlyIncome, setManualMonthlyIncome] = useState<number | null>(null);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  
  // Load saved manual income from localStorage
  useEffect(() => {
    const savedIncome = localStorage.getItem('manualMonthlyIncome');
    if (savedIncome) {
      setManualMonthlyIncome(Number(savedIncome));
    }
  }, []);
  
  // Save manual income to localStorage
  const saveManualIncome = (income: number) => {
    setManualMonthlyIncome(income);
    localStorage.setItem('manualMonthlyIncome', income.toString());
    setIsEditingIncome(false);
  };
  
  // Calculate automatic income from rent - memoized for performance
  const autoCalculatedIncome = React.useMemo(() => 
    properties
      .filter(p => p.monthlyRent && p.monthlyRent > 0)
      .reduce((sum, p) => sum + (p.monthlyRent || 0), 0),
    [properties]
  );
  
  // Use manual income if set, otherwise use auto-calculated
  const displayIncome = manualMonthlyIncome !== null ? manualMonthlyIncome : autoCalculatedIncome;

  
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
      {/* Header with greeting card */}
      <div className="w-full">
        <div className="bg-gradient-primary rounded-2xl p-6 text-white shadow-elevated animate-fade-in relative isolate overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/20"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10"></div>
          </div>
          
          <div className="relative z-10 flex items-start gap-6" dir="rtl">
            {/* Greeting - Right side */}
            <div className="shrink-0">
              <h1 className="text-3xl font-bold mb-2 text-right">
                שלום{userName ? ` ${userName}` : ''}! 👋
              </h1>
              <p className="text-white/90 text-base text-right">ברוך הבא למערכת ניהול הנכסים</p>
              <p className="text-white/70 text-sm mt-1 text-right">עודכן לאחרונה: {new Date().toLocaleDateString('he-IL')}</p>
            </div>
            
            {/* Stats Cards - Left side */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-3 mb-2 flex-row-reverse justify-end">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-right">סה״כ נכסים</span>
                </div>
                <div className="text-2xl font-bold number-display text-right">{stats.totalProperties}</div>
              </div>
              
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-3 mb-2 flex-row-reverse justify-end">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-right">הכנסה חודשית</span>
                  {!isEditingIncome && (
                    <Edit2 
                      className="h-3 w-3 ml-auto cursor-pointer hover:scale-110 transition-transform" 
                      onClick={() => setIsEditingIncome(true)}
                    />
                  )}
                </div>
                {isEditingIncome ? (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="הזן סכום..."
                      defaultValue={manualMonthlyIncome || autoCalculatedIncome}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/70 h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = Number((e.target as HTMLInputElement).value);
                          saveManualIncome(value);
                        }
                        if (e.key === 'Escape') {
                          setIsEditingIncome(false);
                        }
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="text-2xl font-bold number-display text-right">
                    {displayIncome > 0 ? `₪${displayIncome.toLocaleString('he-IL')}` : 'לא חושב'}
                  </div>
                )}
              </div>

              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-3 mb-2 flex-row-reverse justify-end">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-right">תפוסים</span>
                </div>
                <div className="text-2xl font-bold number-display text-right">{stats.confirmedOccupied}</div>
              </div>

              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-3 mb-2 flex-row-reverse justify-end">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-right">פנויים</span>
                </div>
                <div className="text-2xl font-bold number-display text-right">{stats.confirmedVacant}</div>
              </div>

              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-3 mb-2 flex-row-reverse justify-end">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-right">נוצר קשר</span>
                </div>
                <div className="text-2xl font-bold number-display text-right">{stats.contactedProperties}</div>
              </div>

              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-3 mb-2 flex-row-reverse justify-end">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-right">טרם קשר</span>
                </div>
                <div className="text-2xl font-bold number-display text-right">{stats.notContactedProperties}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* הדירות שלנו - קרוסלה */}
      <ActivePropertiesCard properties={properties} />

      {/* שורה 1: Daily Priority + Weekly Priority + פגישות קרובות */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PriorityTasksCard taskType="daily" title="Daily Priority" />
        <PriorityTasksCard taskType="weekly" title="General Priority" />
        <UpcomingAppointmentsCard 
          limit={3} 
          onAddAppointment={() => setIsAppointmentModalOpen(true)}
          onEditAppointment={(appt) => { setEditingAppointment(appt); setIsAppointmentModalOpen(true); }}
        />
      </div>

      {/* שורה 2: באגים ובעיות + רעיונות לפיתוח */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SiteIssuesCard />
        <DevelopmentIdeasCard />
      </div>

      {/* שורה 3: פניות מהאתר (רוחב מלא) */}
      <Card className="w-full">
        <CardHeader className="pb-3">
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
        <CardContent>
          <ContactLeadsListCompact limit={5} />
        </CardContent>
      </Card>

      {/* מודל הוספת פגישה */}
      <AddAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => { setIsAppointmentModalOpen(false); setEditingAppointment(null); }}
        editingAppointment={editingAppointment}
      />
    </div>
  );
});
