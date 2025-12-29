
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building, Users, AlertTriangle, CheckCircle, Clock, Phone, Bell, TrendingUp, Edit2, Plus, FileText, Receipt, ArrowLeft } from 'lucide-react';
import { Property, PropertyStats, Alert } from '../types/property';
import { AlertCard } from './AlertCard';
import { StatsCard } from './StatsCard';
import { MobileDashboard } from './MobileDashboard';
import { ActivityLogsList } from './ActivityLogsList';
import { ContactLeadsListCompact } from './ContactLeadsListCompact';
import { BrokerageFormsList } from './BrokerageFormsList';
import { ActivePropertiesCard } from './ActivePropertiesCard';
import { UpcomingAppointmentsCard } from './UpcomingAppointmentsCard';
import { AddAppointmentModal } from './AddAppointmentModal';
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
  const urgentAlerts = React.useMemo(() => alerts.filter(alert => alert.priority === 'urgent'), [alerts]);
  const highPriorityAlerts = React.useMemo(() => alerts.filter(alert => alert.priority === 'high'), [alerts]);
  const mediumPriorityAlerts = React.useMemo(() => alerts.filter(alert => alert.priority === 'medium'), [alerts]);
  const lowPriorityAlerts = React.useMemo(() => alerts.filter(alert => alert.priority === 'low'), [alerts]);
  
  // Manual monthly income state
  const [manualMonthlyIncome, setManualMonthlyIncome] = useState<number | null>(null);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
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
          
          <div className="relative z-10">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">
                שלום{userName ? ` ${userName}` : ''}! 👋
              </h1>
              <p className="text-white/90 text-base">ברוך הבא למערכת ניהול הנכסים</p>
              <p className="text-white/70 text-sm mt-1">עודכן לאחרונה: {new Date().toLocaleDateString('he-IL')}</p>
            </div>
            
            {/* שורה ראשונה - 3 כרטיסים גדולים */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* סה״כ נכסים */}
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3 flex-row-reverse justify-end">
                  <div className="bg-white/20 p-2.5 rounded-lg">
                    <Building className="h-5 w-5" />
                  </div>
                  <span className="text-base font-semibold text-right">סה״כ נכסים</span>
                </div>
                <div className="text-3xl font-bold number-display text-right">{stats.totalProperties}</div>
              </div>
              
              {/* הכנסה חודשית */}
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3 flex-row-reverse justify-end">
                  <div className="bg-white/20 p-2.5 rounded-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="text-base font-semibold text-right">הכנסה חודשית</span>
                  {!isEditingIncome && (
                    <Edit2 
                      className="h-4 w-4 mr-auto cursor-pointer hover:scale-110 transition-transform" 
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
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/70 h-9 text-base"
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
                  <div className="text-3xl font-bold number-display text-right">
                    {displayIncome > 0 ? `₪${displayIncome.toLocaleString('he-IL')}` : 'לא חושב'}
                  </div>
                )}
              </div>

              {/* תפוסים / פנויים - משולב */}
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3 flex-row-reverse justify-end">
                  <div className="bg-white/20 p-2.5 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-base font-semibold text-right">תפוסה</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold number-display">{stats.confirmedVacant}</div>
                    <div className="text-sm text-white/70">פנויים</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold number-display">{stats.confirmedOccupied}</div>
                    <div className="text-sm text-white/70">תפוסים</div>
                  </div>
                </div>
              </div>
            </div>

            {/* שורה שניה - 2 כרטיסים */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
              {/* נוצר קשר / טרם קשר */}
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3 flex-row-reverse justify-end">
                  <div className="bg-white/20 p-2.5 rounded-lg">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="text-base font-semibold text-right">סטטוס קשר</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold number-display">{stats.notContactedProperties}</div>
                    <div className="text-sm text-white/70">טרם קשר</div>
                  </div>
                  <div className="w-px h-10 bg-white/20"></div>
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold number-display">{stats.contactedProperties}</div>
                    <div className="text-sm text-white/70">נוצר קשר</div>
                  </div>
                </div>
              </div>

              {/* טפסים */}
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3 flex-row-reverse justify-end">
                  <div className="bg-white/20 p-2.5 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-base font-semibold text-right">טפסים</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.open('/brokerage-form/new', '_blank')}
                    className="flex-1 text-center text-sm bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    הזמנת תיווך
                  </button>
                  <button 
                    onClick={() => window.open('/admin-dashboard/price-offers', '_blank')}
                    className="flex-1 text-center text-sm bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors flex items-center justify-center gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    הצעות מחיר
                  </button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>

      {/* הדירות שלנו */}
      <ActivePropertiesCard properties={properties} />

      {/* שורה 2: פגישות קרובות, התראות, פעילות ופניות */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* פגישות קרובות */}
        <UpcomingAppointmentsCard 
          limit={3} 
          onAddAppointment={() => setIsAppointmentModalOpen(true)}
        />
        
        {/* התראות ומעקב */}
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>התראות ומעקב</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/alerts')}
              className="gap-1"
            >
              <span className="text-sm">ראה הכל</span>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {urgentAlerts.length === 0 && highPriorityAlerts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                אין התראות דחופות כרגע
              </div>
            ) : (
              <div className="space-y-2">
                {[...urgentAlerts, ...highPriorityAlerts, ...mediumPriorityAlerts, ...lowPriorityAlerts]
                  .slice(0, 3)
                  .map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* פעילות אחרונה */}
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>פעילות אחרונה</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/activity')}
              className="gap-1"
            >
              <span className="text-sm">ראה הכל</span>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ActivityLogsList limit={3} />
          </CardContent>
        </Card>

        {/* פניות מהאתר */}
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>פניות מהאתר</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/leads')}
              className="gap-1"
            >
              <span className="text-sm">ראה הכל</span>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ContactLeadsListCompact limit={3} />
          </CardContent>
        </Card>
      </div>

      {/* טפסי תיווך - רק בדסקטופ */}
      <div className="space-y-4">
        <BrokerageFormsList />
      </div>

      {/* מודל הוספת פגישה */}
      <AddAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
      />
    </div>
  );
});
